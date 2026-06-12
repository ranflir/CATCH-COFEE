import { Injectable, NotFoundException } from '@nestjs/common';
import type { Notification } from '@catch-coffee/db';
import { NotificationsRepository } from './notifications.repository';
import type { ListNotificationsDto } from './dto/list-notifications.dto';
import { ErrorCode } from '../common/constants/error-codes';

@Injectable()
export class NotificationsService {
  constructor(private readonly repository: NotificationsRepository) {}

  list(userId: string, query: ListNotificationsDto): Promise<Notification[]> {
    return this.repository.listByUser(userId, {
      unreadOnly: query.unread ?? false,
      page: query.page,
      limit: query.limit,
    });
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    return { count: await this.repository.countUnread(userId) };
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    const updated = await this.repository.markRead(id, userId);
    if (updated) {
      return updated;
    }
    // 이미 읽음 처리된 알림이면 멱등하게 그대로 반환, 없으면 404
    const existing = await this.repository.findByIdForUser(id, userId);
    if (!existing) {
      throw new NotFoundException({ code: ErrorCode.NOTIFICATION_NOT_FOUND });
    }
    return existing;
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    return { updated: await this.repository.markAllRead(userId) };
  }
}
