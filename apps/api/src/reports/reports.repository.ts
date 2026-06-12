import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
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
