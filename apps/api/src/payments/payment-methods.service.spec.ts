import { NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { PaymentMethod } from '@catch-coffee/db';
import { PaymentMethodsService } from './payment-methods.service';
import type { PaymentMethodsRepository } from './payment-methods.repository';
import { decryptSecret } from '../common/utils/crypto.util';

const SECRET = 'unit-test-encryption-key-32-chars-xx';

function pm(partial: Partial<PaymentMethod> = {}): PaymentMethod {
  return {
    id: 'p1',
    type: 'card',
    label: '내 카드',
    isDefault: false,
    encryptedToken: null,
    createdAt: new Date('2026-01-01'),
    ...partial,
  } as unknown as PaymentMethod;
}

describe('PaymentMethodsService', () => {
  let repo: jest.Mocked<
    Pick<PaymentMethodsRepository, 'create' | 'update' | 'softDelete' | 'listByUser'>
  >;
  let config: Pick<ConfigService, 'getOrThrow'>;
  let service: PaymentMethodsService;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      listByUser: jest.fn(),
    };
    config = { getOrThrow: jest.fn().mockReturnValue(SECRET) } as unknown as ConfigService;
    service = new PaymentMethodsService(
      repo as unknown as PaymentMethodsRepository,
      config as ConfigService,
    );
  });

  it('토큰 제공 시 암호화하여 저장한다', async () => {
    repo.create.mockResolvedValue(pm({ encryptedToken: 'enc' }));
    await service.create('u1', { type: 'card', label: '내 카드', token: 'raw-token' });

    const arg = repo.create.mock.calls[0]![0];
    expect(arg.encryptedToken).toBeDefined();
    expect(arg.encryptedToken).not.toContain('raw-token');
    expect(decryptSecret(arg.encryptedToken!, SECRET)).toBe('raw-token');
  });

  it('뷰는 토큰 원문/암호문을 노출하지 않고 hasToken만 제공', async () => {
    repo.create.mockResolvedValue(pm({ encryptedToken: 'enc-value' }));
    const view = await service.create('u1', { type: 'card', label: '내 카드' });
    expect(view).not.toHaveProperty('encryptedToken');
    expect(view.hasToken).toBe(true);
  });

  it('토큰 없으면 hasToken=false', async () => {
    repo.create.mockResolvedValue(pm({ encryptedToken: null }));
    const view = await service.create('u1', { type: 'card', label: '내 카드' });
    expect(view.hasToken).toBe(false);
  });

  it('update 대상이 없으면 NotFoundException', async () => {
    repo.update.mockResolvedValue(undefined);
    await expect(
      service.update('p1', 'u1', { label: '변경' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove 대상이 없으면 NotFoundException', async () => {
    repo.softDelete.mockResolvedValue(undefined);
    await expect(service.remove('p1', 'u1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
