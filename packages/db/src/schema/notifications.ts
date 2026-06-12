import {
  pgTable,
  text,
  varchar,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { ulid } from 'ulid';
import { users } from './users';
import { devicePlatform, notificationType } from './enums';

/** 푸시 토큰 (FCM / Expo) */
export const userDevices = pgTable(
  'user_devices',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expoPushToken: text('expo_push_token').notNull(),
    platform: devicePlatform('platform').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    userIdx: index('user_devices_user_idx').on(t.userId),
    tokenUniq: uniqueIndex('user_devices_token_uniq')
      .on(t.expoPushToken)
      .where(sql`${t.deletedAt} is null`),
  }),
);

/** 알림 인박스 (기능 4 알림 내역) */
export const notifications = pgTable(
  'notifications',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: notificationType('type').notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    body: text('body').notNull(),
    data: jsonb('data'), // deep-link payload (cafeId/discountId 등)
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    // 사용자 알림 목록: 최신순 + 안읽음 필터
    userCreatedIdx: index('notifications_user_created_idx').on(t.userId, t.createdAt),
  }),
);

export type UserDevice = InferSelectModel<typeof userDevices>;
export type NewUserDevice = InferInsertModel<typeof userDevices>;
export type Notification = InferSelectModel<typeof notifications>;
export type NewNotification = InferInsertModel<typeof notifications>;
