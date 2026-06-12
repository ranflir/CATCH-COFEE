import {
  pgTable,
  text,
  varchar,
  boolean,
  jsonb,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { ulid } from 'ulid';

/** 커피 브랜드 (메가커피, 컴포즈커피, 빽다방 ...) — 마커 아이콘/크롤링 대상 관리 */
export const brands = pgTable(
  'brands',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    name: varchar('name', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull(),
    logoUrl: text('logo_url'),
    isLowCost: boolean('is_low_cost').notNull().default(true),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    slugUniq: uniqueIndex('brands_slug_active_uniq')
      .on(t.slug)
      .where(sql`${t.deletedAt} is null`),
  }),
);

export type Brand = InferSelectModel<typeof brands>;
export type NewBrand = InferInsertModel<typeof brands>;
