import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import {
  discountReports,
  reportConfirmations,
  discounts,
  type DiscountReport,
  type NewDiscountReport,
} from '@catch-coffee/db';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';

/** 3인 확인 시 자동 등록 */
export const AUTO_REGISTER_THRESHOLD = 3;

/** 검수 큐에서 액션 가능한 상태 */
const REVIEWABLE_STATUSES = ['pending', 'reviewing'] as const;

export type ReviewOutcome =
  | { outcome: 'not_found' }
  | { outcome: 'closed'; report: DiscountReport }
  | { outcome: 'approved'; report: DiscountReport; discountId: string }
  | { outcome: 'rejected'; report: DiscountReport };

export type ConfirmOutcome =
  | { outcome: 'not_found' }
  | { outcome: 'self' }
  | { outcome: 'closed' }
  | { outcome: 'already'; report: DiscountReport }
  | { outcome: 'added'; report: DiscountReport }
  | { outcome: 'auto_registered'; report: DiscountReport };

export type CancelOutcome =
  | { outcome: 'not_found' }
  | { outcome: 'locked' }
  | { outcome: 'removed'; report: DiscountReport }
  | { outcome: 'noop'; report: DiscountReport };

@Injectable()
export class ReportsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async create(input: NewDiscountReport): Promise<DiscountReport> {
    const [row] = await this.db.insert(discountReports).values(input).returning();
    if (!row) {
      throw new Error('Failed to create report');
    }
    return row;
  }

  async findById(id: string): Promise<DiscountReport | undefined> {
    const [row] = await this.db
      .select()
      .from(discountReports)
      .where(and(eq(discountReports.id, id), isNull(discountReports.deletedAt)))
      .limit(1);
    return row;
  }

  async findByReporter(
    reporterId: string,
    status?: DiscountReport['status'],
  ): Promise<DiscountReport[]> {
    const conditions = [eq(discountReports.reporterId, reporterId), isNull(discountReports.deletedAt)];
    if (status) {
      conditions.push(eq(discountReports.status, status));
    }
    return this.db
      .select()
      .from(discountReports)
      .where(and(...conditions))
      .orderBy(desc(discountReports.createdAt));
  }

  /** 카페별 확인 가능 제보 (pending/reviewing) — 공개 목록용 */
  async findConfirmableByCafe(cafeId: string): Promise<DiscountReport[]> {
    return this.db
      .select()
      .from(discountReports)
      .where(
        and(
          eq(discountReports.cafeId, cafeId),
          isNull(discountReports.deletedAt),
          inArray(discountReports.status, ['pending', 'reviewing']),
        ),
      )
      .orderBy(desc(discountReports.createdAt));
  }

  /** 관리자 검수 큐 — 상태별(기본 pending/reviewing) 오래된 순. */
  listForReview(params: {
    statuses: DiscountReport['status'][];
    page: number;
    limit: number;
  }): Promise<DiscountReport[]> {
    const { statuses, page, limit } = params;
    return this.db
      .select()
      .from(discountReports)
      .where(
        and(inArray(discountReports.status, statuses), isNull(discountReports.deletedAt)),
      )
      .orderBy(asc(discountReports.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);
  }

  /** 승인 — 할인 생성(source=report) + 상태 approved 를 단일 트랜잭션으로 처리. */
  async approve(reportId: string, reviewerId: string): Promise<ReviewOutcome> {
    return this.db.transaction(async (tx) => {
      const [report] = await tx
        .select()
        .from(discountReports)
        .where(and(eq(discountReports.id, reportId), isNull(discountReports.deletedAt)))
        .for('update')
        .limit(1);

      if (!report) return { outcome: 'not_found' };
      if (!REVIEWABLE_STATUSES.includes(report.status as (typeof REVIEWABLE_STATUSES)[number])) {
        return { outcome: 'closed', report };
      }

      const [created] = await tx
        .insert(discounts)
        .values({
          cafeId: report.cafeId,
          source: 'report',
          title: report.title,
          discountType: report.discountType,
          discountValue: report.discountValue,
          conditions: report.conditions,
          startAt: report.startAt,
          endAt: report.endAt,
          status: 'active',
          reportId: report.id,
        })
        .returning({ id: discounts.id });

      if (!created) {
        throw new Error('Failed to create discount on approve');
      }

      const [updated] = await tx
        .update(discountReports)
        .set({
          status: 'approved',
          registeredDiscountId: created.id,
          metadata: { reviewedBy: reviewerId, reviewedAt: new Date().toISOString() },
          updatedAt: new Date(),
          version: sql`${discountReports.version} + 1`,
        })
        .where(eq(discountReports.id, reportId))
        .returning();

      return { outcome: 'approved', report: updated ?? report, discountId: created.id };
    });
  }

  /** 반려 — 상태 rejected + 사유 저장. */
  async reject(
    reportId: string,
    reviewerId: string,
    reason: string,
  ): Promise<ReviewOutcome> {
    return this.db.transaction(async (tx) => {
      const [report] = await tx
        .select()
        .from(discountReports)
        .where(and(eq(discountReports.id, reportId), isNull(discountReports.deletedAt)))
        .for('update')
        .limit(1);

      if (!report) return { outcome: 'not_found' };
      if (!REVIEWABLE_STATUSES.includes(report.status as (typeof REVIEWABLE_STATUSES)[number])) {
        return { outcome: 'closed', report };
      }

      const [updated] = await tx
        .update(discountReports)
        .set({
          status: 'rejected',
          rejectReason: reason,
          metadata: { reviewedBy: reviewerId, reviewedAt: new Date().toISOString() },
          updatedAt: new Date(),
          version: sql`${discountReports.version} + 1`,
        })
        .where(eq(discountReports.id, reportId))
        .returning();

      return { outcome: 'rejected', report: updated ?? report };
    });
  }

  /** "이 정보 맞아요" — 1인1회 + 3인 도달 시 자동등록을 단일 트랜잭션으로 처리. */
  async confirm(reportId: string, userId: string): Promise<ConfirmOutcome> {
    return this.db.transaction(async (tx) => {
      const [report] = await tx
        .select()
        .from(discountReports)
        .where(and(eq(discountReports.id, reportId), isNull(discountReports.deletedAt)))
        .for('update')
        .limit(1);

      if (!report) return { outcome: 'not_found' };
      if (report.reporterId === userId) return { outcome: 'self' };
      if (report.status !== 'pending' && report.status !== 'reviewing') {
        return { outcome: 'closed' };
      }

      const inserted = await tx
        .insert(reportConfirmations)
        .values({ reportId, userId })
        .onConflictDoNothing()
        .returning();

      if (inserted.length === 0) {
        return { outcome: 'already', report };
      }

      const newCount = report.confirmCount + 1;

      if (newCount >= AUTO_REGISTER_THRESHOLD) {
        const [created] = await tx
          .insert(discounts)
          .values({
            cafeId: report.cafeId,
            source: 'report',
            title: report.title,
            discountType: report.discountType,
            discountValue: report.discountValue,
            conditions: report.conditions,
            startAt: report.startAt,
            endAt: report.endAt,
            status: 'active',
            reportId: report.id,
          })
          .returning({ id: discounts.id });

        const [updated] = await tx
          .update(discountReports)
          .set({
            confirmCount: newCount,
            status: 'auto_registered',
            registeredDiscountId: created?.id,
            updatedAt: new Date(),
            version: sql`${discountReports.version} + 1`,
          })
          .where(eq(discountReports.id, reportId))
          .returning();

        return { outcome: 'auto_registered', report: updated ?? report };
      }

      const [updated] = await tx
        .update(discountReports)
        .set({
          confirmCount: newCount,
          updatedAt: new Date(),
          version: sql`${discountReports.version} + 1`,
        })
        .where(eq(discountReports.id, reportId))
        .returning();

      return { outcome: 'added', report: updated ?? report };
    });
  }

  /** 확인 취소 — 자동등록 전까지만 허용. */
  async cancelConfirm(reportId: string, userId: string): Promise<CancelOutcome> {
    return this.db.transaction(async (tx) => {
      const [report] = await tx
        .select()
        .from(discountReports)
        .where(and(eq(discountReports.id, reportId), isNull(discountReports.deletedAt)))
        .for('update')
        .limit(1);

      if (!report) return { outcome: 'not_found' };
      if (report.status === 'auto_registered') return { outcome: 'locked' };

      const deleted = await tx
        .delete(reportConfirmations)
        .where(
          and(
            eq(reportConfirmations.reportId, reportId),
            eq(reportConfirmations.userId, userId),
          ),
        )
        .returning();

      if (deleted.length === 0) {
        return { outcome: 'noop', report };
      }

      const newCount = Math.max(0, report.confirmCount - 1);
      const [updated] = await tx
        .update(discountReports)
        .set({
          confirmCount: newCount,
          updatedAt: new Date(),
          version: sql`${discountReports.version} + 1`,
        })
        .where(eq(discountReports.id, reportId))
        .returning();

      return { outcome: 'removed', report: updated ?? report };
    });
  }
}
