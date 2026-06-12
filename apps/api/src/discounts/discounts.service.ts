import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Discount } from '@catch-coffee/db';
import { DiscountsRepository } from './discounts.repository';
import { CafesRepository } from '../cafes/cafes.repository';
import type { CreateDiscountDto } from './dto/create-discount.dto';
import type { UpdateDiscountDto } from './dto/update-discount.dto';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import { ErrorCode } from '../common/constants/error-codes';

@Injectable()
export class DiscountsService {
  constructor(
    private readonly discountsRepository: DiscountsRepository,
    private readonly cafesRepository: CafesRepository,
  ) {}

  async getDiscount(id: string): Promise<Discount> {
    const discount = await this.discountsRepository.findById(id);
    if (!discount) {
      throw new NotFoundException({ code: ErrorCode.DISCOUNT_NOT_FOUND });
    }
    return discount;
  }

  async createForCafe(
    cafeId: string,
    user: JwtPayload,
    dto: CreateDiscountDto,
  ): Promise<Discount> {
    const cafe = await this.cafesRepository.findById(cafeId);
    if (!cafe) {
      throw new NotFoundException({ code: ErrorCode.CAFE_NOT_FOUND });
    }
    this.assertOwnership(cafe.ownerId, user);

    const status = dto.startAt && dto.startAt > new Date() ? 'scheduled' : 'active';

    return this.discountsRepository.create({
      cafeId,
      source: 'seller',
      title: dto.title,
      discountType: dto.discountType,
      discountValue: String(dto.discountValue),
      targetScope: dto.targetScope,
      conditions: dto.conditions,
      paymentType: dto.paymentType,
      startAt: dto.startAt,
      endAt: dto.endAt,
      status,
      createdById: user.id,
    });
  }

  async updateDiscount(
    id: string,
    user: JwtPayload,
    dto: UpdateDiscountDto,
  ): Promise<Discount> {
    await this.assertDiscountOwnership(id, user);

    const { discountValue, ...rest } = dto;
    const updated = await this.discountsRepository.update(id, {
      ...rest,
      ...(discountValue !== undefined && { discountValue: String(discountValue) }),
    });
    if (!updated) {
      throw new NotFoundException({ code: ErrorCode.DISCOUNT_NOT_FOUND });
    }
    return updated;
  }

  async deleteDiscount(id: string, user: JwtPayload): Promise<void> {
    await this.assertDiscountOwnership(id, user);
    const deleted = await this.discountsRepository.softDelete(id);
    if (!deleted) {
      throw new NotFoundException({ code: ErrorCode.DISCOUNT_NOT_FOUND });
    }
  }

  /** 할인 → 카페 owner 확인 후 권한 검증. */
  private async assertDiscountOwnership(id: string, user: JwtPayload): Promise<void> {
    const discount = await this.discountsRepository.findById(id);
    if (!discount) {
      throw new NotFoundException({ code: ErrorCode.DISCOUNT_NOT_FOUND });
    }
    const cafe = await this.cafesRepository.findById(discount.cafeId);
    if (!cafe) {
      throw new NotFoundException({ code: ErrorCode.CAFE_NOT_FOUND });
    }
    this.assertOwnership(cafe.ownerId, user);
  }

  private assertOwnership(ownerId: string | null, user: JwtPayload): void {
    if (user.role === 'admin') return;
    if (ownerId && ownerId === user.id) return;
    throw new ForbiddenException({ code: ErrorCode.FORBIDDEN_RESOURCE });
  }
}
