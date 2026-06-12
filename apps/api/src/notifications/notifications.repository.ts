import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, isNull } from 'drizzle-orm';
import { notifications, type Notification } from '@catch-coffee/db';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';

@Injectable()
export class NotificationsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  listByUser(
    userId: string,
    params: { unreadOnly: boolean; page: number; limit: number },
  ): Promise<Notification[]> {
    const conditions = [eq(notifications.userId, userId)];
    if (params.unreadOnly) {
      conditions.push(isNull(notifications.readAt));
    }
    return this.db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(params.limit)
      .offset((params.page - 1) * params.limit);
  }

  async countUnread(userId: string): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return row?.value ?? 0;
  }

  async markRead(id: string, userId: string): Promise<Notification | undefined> {
    const [row] = await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, userId),
          isNull(notifications.readAt),
        ),
      )
      .returning();
    return row;
  }

  async markAllRead(userId: string): Promise<number> {
    const rows = await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
      .returning({ id: notifications.id });
    return rows.length;
  }

  async findByIdForUser(id: string, userId: string): Promise<Notification | undefined> {
    const [row] = await this.db
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .limit(1);
    return row;
  }
}
