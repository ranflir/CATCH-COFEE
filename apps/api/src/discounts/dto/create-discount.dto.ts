import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { isoDate } from '../../common/zod/iso-date';

export const CreateDiscountSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    discountType: z.enum(['percentage', 'amount']),
    discountValue: z.number().positive(),
    targetScope: z.enum(['all', 'menu']).default('all'),
    conditions: z.record(z.string(), z.unknown()).optional(),
    paymentType: z.enum(['naverpay', 'kakaopay', 'card', 'other']).optional(),
    startAt: isoDate.optional(),
    endAt: isoDate.optional(),
  })
  .refine((v) => v.discountType !== 'percentage' || v.discountValue <= 100, {
    message: '정률 할인은 0~100% 범위여야 합니다.',
    path: ['discountValue'],
  })
  .refine((v) => !v.startAt || !v.endAt || v.endAt > v.startAt, {
    message: '종료일은 시작일보다 이후여야 합니다.',
    path: ['endAt'],
  });

export class CreateDiscountDto extends createZodDto(CreateDiscountSchema) {}
