import {
  pgTable,
  text,
  varchar,
  numeric,
  integer,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { sql, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { ulid } from 'ulid';
import { cafes } from './cafes';
import { users } from './users';
import { discountReports } from './reports';
import {
  discountSource,
  discountType,
  discountStatus,
  discountTargetScope,
  paymentType,
} from './enums';

/** 통합 할인 정보 (출처: 자동수집/판매자/사용자제보) */
export const discounts = pgTable(
  'discounts',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    cafeId: text('cafe_id')
      .notNull()
      .references(() => cafes.id, { onDelete: 'cascade' }),
    source: discountSource('source').notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    discountType: discountType('discount_type').notNull(),
    discountValue: numeric('discount_value', { precision: 10, scale: 2 }).notNull(),
    targetScope: discountTargetScope('target_scope').notNull().default('all'),
    /** 적용 조건: 최소구매액/사용횟수/중복불가 등 비정형 → jsonb */
    conditions: jsonb('conditions'),
    /** 결제수단 조건 추천 매칭용(없으면 결제수단 무관) */
    paymentType: paymentType('payment_type'),
    startAt: timestamp('start_at', { withTimezone: true }),
    endAt: timestamp('end_at', { withTimezone: true }),
    status: discountStatus('status').notNull().default('active'),
    /** source=seller 일 때 등록 판매자 */
    createdById: text('created_by_id').references(() => users.id, { onDelete: 'set null' }),
    /** source=report 일 때 원본 제보(정참조) */
    reportId: text('report_id').references(() => discountReports.id, {
      onDelete: 'set null',
    }),
    /** 정보 갱신일자 표기(신선도) */
    infoUpdatedAt: timestamp('info_updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    metadata: jsonb('metadata'),
    version: integer('version').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    // 카페 상세: 카페별 활성 할인 조회
    cafeStatusIdx: index('discounts_cafe_status_idx').on(t.cafeId, t.status),
    // 유효성/만료 처리: 상태 + 종료일
    statusEndIdx: index('discounts_status_end_idx').on(t.status, t.endAt),
    sourceIdx: index('discounts_source_idx').on(t.source),
    paymentTypeIdx: index('discounts_payment_type_idx').on(t.paymentType),
    // 활성 할인만 빠르게
    activeIdx: index('discounts_active_idx')
      .on(t.cafeId)
      .where(sql`${t.deletedAt} is null`),
  }),
);

export type Discount = InferSelectModel<typeof discounts>;
export type NewDiscount = InferInsertModel<typeof discounts>;
