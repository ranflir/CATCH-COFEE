import {
  pgTable,
  text,
  varchar,
  boolean,
  integer,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { sql, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { ulid } from 'ulid';
import { users } from './users';
import { cafes } from './cafes';
import { paymentType } from './enums';

/** 사용자 보유 결제수단 (기능 3.1.1 / 5.1) — 토큰은 암호화 저장 */
export const paymentMethods = pgTable(
  'payment_methods',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: paymentType('type').notNull(),
    label: varchar('label', { length: 100 }).notNull(),
    /** 인증/계좌 정보는 평문 금지 — 암호화된 값만 저장 */
    encryptedToken: text('encrypted_token'),
    isDefault: boolean('is_default').notNull().default(false),
    metadata: jsonb('metadata'),
    version: integer('version').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    userIdx: index('payment_methods_user_idx').on(t.userId),
    // 사용자당 기본 결제수단 1개만 (부분 unique)
    defaultUniq: uniqueIndex('payment_methods_one_default_uniq')
      .on(t.userId)
      .where(sql`${t.isDefault} = true and ${t.deletedAt} is null`),
  }),
);

/** 즐겨찾기 카페 (기능 4.1) — notifyEnabled 로 카페별 알림 on/off */
export const favorites = pgTable(
  'favorites',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    cafeId: text('cafe_id')
      .notNull()
      .references(() => cafes.id, { onDelete: 'cascade' }),
    notifyEnabled: boolean('notify_enabled').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.cafeId] }),
    cafeIdx: index('favorites_cafe_idx').on(t.cafeId),
  }),
);

/** 결제수단 기반 할인 알림 구독 (기능 4.2) */
export const paymentAlerts = pgTable(
  'payment_alerts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    paymentType: paymentType('payment_type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.paymentType] }),
  }),
);

export type PaymentMethod = InferSelectModel<typeof paymentMethods>;
export type NewPaymentMethod = InferInsertModel<typeof paymentMethods>;
export type Favorite = InferSelectModel<typeof favorites>;
export type NewFavorite = InferInsertModel<typeof favorites>;
export type PaymentAlert = InferSelectModel<typeof paymentAlerts>;
export type NewPaymentAlert = InferInsertModel<typeof paymentAlerts>;
