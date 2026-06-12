import { NotFoundException } from '@nestjs/common';
import type { Discount, PaymentMethod } from '@catch-coffee/db';
import { RecommendationService } from './recommendation.service';
import type { CafesRepository } from '../cafes/cafes.repository';
import type { DiscountsRepository } from '../discounts/discounts.repository';
import type { PaymentMethodsRepository } from './payment-methods.repository';
import type { JwtPayload } from '../common/types/jwt-payload.type';

function discount(partial: Partial<Discount>): Discount {
  return {
    id: 'd1',
    cafeId: 'cafe1',
    source: 'crawl',
    title: '할인',
    discountType: 'percentage',
    discountValue: '10',
    paymentType: null,
    ...partial,
  } as unknown as Discount;
}

function method(type: PaymentMethod['type'], isDefault = false): PaymentMethod {
  return { type, isDefault } as unknown as PaymentMethod;
}

const user: JwtPayload = { id: 'u1', role: 'user' };

describe('RecommendationService', () => {
  let cafes: jest.Mocked<Pick<CafesRepository, 'findById'>>;
  let discounts: jest.Mocked<Pick<DiscountsRepository, 'findActiveByCafe'>>;
  let methods: jest.Mocked<Pick<PaymentMethodsRepository, 'listByUser'>>;
  let service: RecommendationService;

  beforeEach(() => {
    cafes = { findById: jest.fn().mockResolvedValue({ id: 'cafe1' }) };
    discounts = { findActiveByCafe: jest.fn().mockResolvedValue([]) };
    methods = { listByUser: jest.fn().mockResolvedValue([]) };
    service = new RecommendationService(
      cafes as unknown as CafesRepository,
      discounts as unknown as DiscountsRepository,
      methods as unknown as PaymentMethodsRepository,
    );
  });

  it('카페가 없으면 NotFoundException', async () => {
    cafes.findById.mockResolvedValue(undefined);
    await expect(service.getRecommendation('nope', user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('보유하지 않은 결제수단 조건 할인은 제외, 결제수단 무관(null)은 포함', async () => {
    discounts.findActiveByCafe.mockResolvedValue([
      discount({ id: 'agnostic', paymentType: null, discountValue: '5' }),
      discount({ id: 'kakao', paymentType: 'kakaopay', discountValue: '20' }),
    ]);
    methods.listByUser.mockResolvedValue([method('naverpay')]);

    const res = await service.getRecommendation('cafe1', user);
    const ids = res.candidates.map((c) => c.discountId);
    expect(ids).toContain('agnostic');
    expect(ids).not.toContain('kakao');
  });

  it('정률(percentage)이 정액(amount)보다 우선 추천된다', async () => {
    discounts.findActiveByCafe.mockResolvedValue([
      discount({ id: 'amt', discountType: 'amount', discountValue: '5000' }),
      discount({ id: 'pct', discountType: 'percentage', discountValue: '10' }),
    ]);
    const res = await service.getRecommendation('cafe1', user);
    expect(res.recommended?.discountId).toBe('pct');
  });

  it('정률끼리는 값이 높은 것이 먼저', async () => {
    discounts.findActiveByCafe.mockResolvedValue([
      discount({ id: 'low', discountType: 'percentage', discountValue: '10' }),
      discount({ id: 'high', discountType: 'percentage', discountValue: '30' }),
    ]);
    const res = await service.getRecommendation('cafe1', user);
    expect(res.candidates[0]?.discountId).toBe('high');
    expect(res.recommended?.discountId).toBe('high');
  });

  it('추천 할인의 결제수단이 없으면 기본 결제수단으로 대체', async () => {
    discounts.findActiveByCafe.mockResolvedValue([
      discount({ id: 'agnostic', paymentType: null, discountValue: '10' }),
    ]);
    methods.listByUser.mockResolvedValue([method('card', true)]);
    const res = await service.getRecommendation('cafe1', user);
    expect(res.recommendedPaymentType).toBe('card');
  });
});
