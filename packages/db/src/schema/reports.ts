import {
  pgTable,
  text,
  varchar,
  numeric,
  integer,
  jsonb,
  timestamp,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { ulid } from 'ulid';
import { cafes } from './cafes';
import { users } from './users';
import { discountType, reportStatus, reportInfoSource } from './enums';

/** 사용자 할인 정보 제보 (기능 6) */
export const discountReports = pgTable(
  'discount_reports',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    cafeId: text('cafe_id')
      .notNull()
      .references(() => cafes.id, { onDelete: 'cascade' }),
    reporterId: text('reporter_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 200 }).notNull(),
    discountType: discountType('discount_type').notNull(),
    discountValue: numeric('discount_value', { precision: 10, scale: 2 }).notNull(),
    conditions: jsonb('conditions'), // 결제수단/최소구매/사용횟수 등
    infoSource: reportInfoSource('info_source').notNull(),
    /** 최초 제보 시 영수증/사진 필수 첨부 (NOT NULL) */
    receiptImageUrl: text('receipt_image_url').notNull(),
    startAt: timestamp('start_at', { withTimezone: true }),
    endAt: timestamp('end_at', { withTimezone: true }),
    status: reportStatus('status').notNull().default('pending'),
    /** "이 정보 맞아요" 확인 수 — report_confirmations 집계 캐시(비정규화, 동기화 필수) */
    confirmCount: integer('confirm_count').notNull().default(0),
    rejectReason: text('reject_reason'),
    /** 승인/자동등록 시 생성된 할인 id (역참조; discounts.reportId 가 정참조) */
    registeredDiscountId: text('registered_discount_id'),
    metadata: jsonb('metadata'),
    version: integer('version').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    cafeIdx: index('reports_cafe_idx').on(t.cafeId),
    reporterIdx: index('reports_reporter_idx').on(t.reporterId),
    // 검수 큐 조회: 상태별 + 최신순
    statusIdx: index('reports_status_idx').on(t.status, t.createdAt),
  }),
);

/**
 * "이 정보 맞아요" 확인 — 1인 1회 (복합 PK로 강제).
 * 확인 취소(되돌리기)는 row 물리 삭제로 처리(토글 의미 → soft delete 예외).
 * 취소 허용 여부(자동등록 전까지)는 애플리케이션 트랜잭션에서 검증.
 */
export const reportConfirmations = pgTable(
  'report_confirmations',
  {
    reportId: text('report_id')
      .notNull()
      .references(() => discountReports.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.reportId, t.userId] }),
    userIdx: index('report_confirmations_user_idx').on(t.userId),
  }),
);

export type DiscountReport = InferSelectModel<typeof discountReports>;
export type NewDiscountReport = InferInsertModel<typeof discountReports>;
export type ReportConfirmation = InferSelectModel<typeof reportConfirmations>;
export type NewReportConfirmation = InferInsertModel<typeof reportConfirmations>;
