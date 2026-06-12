import { pgTable, text, varchar, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { ulid } from 'ulid';
import { users } from './users';

/**
 * 감사 로그 (기능 6.8.4 / 7.2.3) — 판매자·관리자 수정/삭제 이력.
 * 읽기 전용 이력 → before/after 스냅샷 비정규화 허용.
 */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    actorId: text('actor_id').references(() => users.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 50 }).notNull(), // create/update/delete/approve/reject ...
    entityType: varchar('entity_type', { length: 50 }).notNull(), // discount/report ...
    entityId: text('entity_id').notNull(),
    before: jsonb('before'),
    after: jsonb('after'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    entityIdx: index('audit_logs_entity_idx').on(t.entityType, t.entityId),
    actorIdx: index('audit_logs_actor_idx').on(t.actorId),
  }),
);

export type AuditLog = InferSelectModel<typeof auditLogs>;
export type NewAuditLog = InferInsertModel<typeof auditLogs>;
