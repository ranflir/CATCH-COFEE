import { NotFoundException } from '@nestjs/common';
import type { UserDevice } from '@catch-coffee/db';
import { DevicesService } from './devices.service';
import type { DevicesRepository } from './devices.repository';

function makeRepo(overrides: Partial<DevicesRepository> = {}) {
  return {
    listByUser: jest.fn(),
    findActiveByToken: jest.fn(),
    insert: jest.fn(),
    reassign: jest.fn(),
    softDelete: jest.fn(),
    ...overrides,
  } as unknown as DevicesRepository;
}

const device = (over: Partial<UserDevice> = {}): UserDevice =>
  ({
    id: 'd1',
    userId: 'u1',
    expoPushToken: 'ExponentPushToken[abc]',
    platform: 'ios',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...over,
  }) as UserDevice;

describe('DevicesService', () => {
  it('register: 신규 토큰이면 insert', async () => {
    const created = device();
    const repo = makeRepo({
      findActiveByToken: jest.fn().mockResolvedValue(undefined),
      insert: jest.fn().mockResolvedValue(created),
    });
    const service = new DevicesService(repo);

    const res = await service.register('u1', {
      expoPushToken: 'ExponentPushToken[abc]',
      platform: 'ios',
    });
    expect(res).toBe(created);
    expect(repo.insert).toHaveBeenCalled();
  });

  it('register: 동일 사용자/플랫폼이면 기존 반환 (no-op)', async () => {
    const existing = device();
    const repo = makeRepo({
      findActiveByToken: jest.fn().mockResolvedValue(existing),
    });
    const service = new DevicesService(repo);

    const res = await service.register('u1', {
      expoPushToken: 'ExponentPushToken[abc]',
      platform: 'ios',
    });
    expect(res).toBe(existing);
    expect(repo.reassign).not.toHaveBeenCalled();
    expect(repo.insert).not.toHaveBeenCalled();
  });

  it('register: 다른 사용자 소유 토큰이면 재할당', async () => {
    const existing = device({ userId: 'other' });
    const reassigned = device({ userId: 'u1' });
    const repo = makeRepo({
      findActiveByToken: jest.fn().mockResolvedValue(existing),
      reassign: jest.fn().mockResolvedValue(reassigned),
    });
    const service = new DevicesService(repo);

    const res = await service.register('u1', {
      expoPushToken: 'ExponentPushToken[abc]',
      platform: 'ios',
    });
    expect(res).toBe(reassigned);
    expect(repo.reassign).toHaveBeenCalledWith('d1', { userId: 'u1', platform: 'ios' });
  });

  it('remove: 없으면 NotFound', async () => {
    const repo = makeRepo({ softDelete: jest.fn().mockResolvedValue(undefined) });
    const service = new DevicesService(repo);
    await expect(service.remove('x', 'u1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove: 성공 시 id 반환', async () => {
    const repo = makeRepo({ softDelete: jest.fn().mockResolvedValue(device()) });
    const service = new DevicesService(repo);
    await expect(service.remove('d1', 'u1')).resolves.toEqual({ id: 'd1' });
  });
});
