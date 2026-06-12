import {
  pgTable,
  text,
  varchar,
  integer,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { ulid } from 'ulid';
import { userRole } from './enums';

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: text('password_hash').notNull(), // bcrypt
    name: varchar('name', { length: 100 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    role: userRole('role').notNull().default('user'),
    /** 제보 신뢰도 점수 — 어뷰징 방지/가중치 (기획서 리스크 대응) */
    trustScore: integer('trust_score').notNull().default(0),
    metadata: jsonb('metadata'),
    version: integer('version').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    // soft delete 고려: 살아있는 사용자 기준 email 유일
    emailUniq: uniqueIndex('users_email_active_uniq')
      .on(t.email)
      .where(sql`${t.deletedAt} is null`),
    roleIdx: index('users_role_idx').on(t.role),
  }),
);

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
