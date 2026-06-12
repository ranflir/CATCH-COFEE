import { NotFoundException } from '@nestjs/common';
import type { Notification } from '@catch-coffee/db';
import { NotificationsService } from './notifications.service';
import type { NotificationsRepository } from './notifications.repository';

function makeRepo(overrides: Partial<NotificationsRepository> = {}) {
  return {
    listByUser: jest.fn(),
    countUnread: jest.fn(),
    markRead: jest.fn(),
    markAllRead: jest.fn(),
    findByIdForUser: jest.fn(),
    ...overrides,
  } as unknown as NotificationsRepository;
}

const sample = (over: Partial<Notification> = {}): Notification =>
  ({
    id: 'n1',
    userId: 'u1',
    type: 'discount',
    title: 'title',
    body: 'body',
    data: null,
    readAt: null,
    createdAt: new Date(),
    ...over,
  }) as Notification;

describe('NotificationsService', () => {
  it('markRead: 미읽음이면 업데이트된 행 반환', async () => {
    const updated = sample({ readAt: new Date() });
    const repo = makeRepo({ markRead: jest.fn().mockResolvedValue(updated) });
    const service = new NotificationsService(repo);

    await expect(service.markRead('n1', 'u1')).resolves.toBe(updated);
    expect(repo.markRead).toHaveBeenCalledWith('n1', 'u1');
  });

  it('markRead: 이미 읽음이면 멱등하게 기존 행 반환', async () => {
    const existing = sample({ readAt: new Date() });
    const repo = makeRepo({
      markRead: jest.fn().mockResolvedValue(undefined),
      findByIdForUser: jest.fn().mockResolvedValue(existing),
    });
    const service = new NotificationsService(repo);

    await expect(service.markRead('n1', 'u1')).resolves.toBe(existing);
  });

  it('markRead: 존재하지 않으면 NotFound', async () => {
    const repo = makeRepo({
      markRead: jest.fn().mockResolvedValue(undefined),
      findByIdForUser: jest.fn().mockResolvedValue(undefined),
    });
    const service = new NotificationsService(repo);

    await expect(service.markRead('x', 'u1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('unreadCount: 카운트 래핑', async () => {
    const repo = makeRepo({ countUnread: jest.fn().mockResolvedValue(3) });
    const service = new NotificationsService(repo);
    await expect(service.unreadCount('u1')).resolves.toEqual({ count: 3 });
  });
});
