import { Inject, Injectable } from '@nestjs/common';
import { desc, eq, inArray } from 'drizzle-orm';
import {
  crawlCandidates,
  discounts,
  type CrawlCandidate,
} from '@catch-coffee/db';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';

/** 검수 액션이 가능한 상태 */
const REVIEWABLE_STATUS = 'pending' as const;

export type CandidateApproveOutcome =
  | { outcome: 'not_found' }
  | { outcome: 'closed'; candidate: CrawlCandidate }
  | { outcome: 'approved'; candidate: CrawlCandidate; discountId: string };

export type CandidateRejectOutcome =
  | { outcome: 'not_found' }
  | { outcome: 'closed'; candidate: CrawlCandidate }
  | { outcome: 'rejected'; candidate: CrawlCandidate };

@Injectable()
export class CrawlCandidatesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  listQueue(params: {
    statuses: CrawlCandidate['status'][];
    page: number;
    limit: number;
  }): Promise<CrawlCandidate[]> {
    return this.db
      .select()
      .from(crawlCandidates)
      .where(inArray(crawlCandidates.status, params.statuses))
      .orderBy(desc(crawlCandidates.createdAt))
      .limit(params.limit)
      .offset((params.page - 1) * params.limit);
  }

  async findById(id: string): Promise<CrawlCandidate | undefined> {
    const [row] = await this.db
      .select()
      .from(crawlCandidates)
      .where(eq(crawlCandidates.id, id))
      .limit(1);
    return row;
  }

  /** 승인 — 할인 생성(source=crawl) + 상태 approved 를 단일 트랜잭션으로 처리. */
  async approve(
    id: string,
    discount: {
      cafeId: string;
      title: string;
      discountType: 'percentage' | 'amount';
      discountValue: number;
    },
  ): Promise<CandidateApproveOutcome> {
    return this.db.transaction(async (tx) => {
      const [candidate] = await tx
        .select()
        .from(crawlCandidates)
        .where(eq(crawlCandidates.id, id))
        .for('update')
        .limit(1);

      if (!candidate) return { outcome: 'not_found' };
      if (candidate.status !== REVIEWABLE_STATUS) {
        return { outcome: 'closed', candidate };
      }

      const [created] = await tx
        .insert(discounts)
        .values({
          cafeId: discount.cafeId,
          source: 'crawl',
          title: discount.title,
          discountType: discount.discountType,
          discountValue: String(discount.discountValue),
          status: 'active',
        })
        .returning({ id: discounts.id });

      if (!created) {
        throw new Error('Failed to create discount on candidate approve');
      }

      const [updated] = await tx
        .update(crawlCandidates)
        .set({
          status: 'approved',
          cafeId: discount.cafeId,
          updatedAt: new Date(),
        })
        .where(eq(crawlCandidates.id, id))
        .returning();

      return { outcome: 'approved', candidate: updated!, discountId: created.id };
    });
  }

  async reject(
    id: string,
    reviewerId: string,
    reason?: string,
  ): Promise<CandidateRejectOutcome> {
    return this.db.transaction(async (tx) => {
      const [candidate] = await tx
        .select()
        .from(crawlCandidates)
        .where(eq(crawlCandidates.id, id))
        .for('update')
        .limit(1);

      if (!candidate) return { outcome: 'not_found' };
      if (candidate.status !== REVIEWABLE_STATUS) {
        return { outcome: 'closed', candidate };
      }

      const existingParsed =
        candidate.parsed && typeof candidate.parsed === 'object'
          ? (candidate.parsed as Record<string, unknown>)
          : {};

      const [updated] = await tx
        .update(crawlCandidates)
        .set({
          status: 'rejected',
          parsed: reason
            ? { ...existingParsed, _review: { reviewerId, reason } }
            : candidate.parsed,
          updatedAt: new Date(),
        })
        .where(eq(crawlCandidates.id, id))
        .returning();

      return { outcome: 'rejected', candidate: updated! };
    });
  }
}
