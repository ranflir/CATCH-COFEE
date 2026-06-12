import { Injectable, NotFoundException } from '@nestjs/common';
import type { Discount, PaymentMethod } from '@catch-coffee/db';
import { CafesRepository } from '../cafes/cafes.repository';
import { DiscountsRepository } from '../discounts/discounts.repository';
import { PaymentMethodsRepository } from './payment-methods.repository';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import { ErrorCode } from '../common/constants/error-codes';

export interface DiscountCandidate {
  discountId: string;
  title: string;
  paymentType: PaymentMethod['type'] | null;
  discountType: Discount['discountType'];
  /** 정률(%) 또는 정액(원) 값 */
  value: number;
  estimatedRatePercent: number | null;
  estimatedAmount: number | null;
}

@Injectable()
export class RecommendationService {
  constructor(
    private readonly cafesRepository: CafesRepository,
    private readonly discountsRepository: DiscountsRepository,
    private readonly paymentMethodsRepository: PaymentMethodsRepository,
  ) {}

  async getRecommendation(cafeId: string, user: JwtPayload) {
    const cafe = await this.cafesRepository.findById(cafeId);
    if (!cafe) {
      throw new NotFoundException({ code: ErrorCode.CAFE_NOT_FOUND });
    }

    const [discounts, methods] = await Promise.all([
      this.discountsRepository.findActiveByCafe(cafeId),
      this.paymentMethodsRepository.listByUser(user.id),
    ]);

    const userTypes = new Set(methods.map((m) => m.type));
    const defaultType = methods.find((m) => m.isDefault)?.type ?? null;

    // 결제수단 무관(null) 또는 사용자가 보유한 수단 조건만 적용 가능.
    const candidates: DiscountCandidate[] = discounts
      .filter((d) => d.paymentType === null || userTypes.has(d.paymentType))
      .map((d) => {
        const value = Number(d.discountValue);
        return {
          discountId: d.id,
          title: d.title,
          paymentType: d.paymentType,
          discountType: d.discountType,
          value,
          estimatedRatePercent: d.discountType === 'percentage' ? value : null,
          estimatedAmount: d.discountType === 'amount' ? value : null,
        };
      });

    // 정률끼리, 정액끼리 값 내림차순. 메뉴 가격 데이터 부재로 정률↔정액 정밀 비교는 불가.
    candidates.sort((a, b) => {
      if (a.discountType !== b.discountType) {
        return a.discountType === 'percentage' ? -1 : 1;
      }
      return b.value - a.value;
    });

    const bestPercentage = candidates.find((c) => c.discountType === 'percentage');
    const bestAmount = candidates.find((c) => c.discountType === 'amount');
    const recommended = bestPercentage ?? bestAmount ?? null;

    return {
      cafeId,
      recommended,
      recommendedPaymentType: recommended?.paymentType ?? defaultType,
      candidates,
      note: '메뉴 가격 데이터 부재로 정률/정액 단순 비교 기준입니다.',
    };
  }
}
