import { z } from 'zod';

export const CreateDiscountSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    discountType: z.enum(['percentage', 'amount']),
    discountValue: z.number().positive(),
    targetScope: z.enum(['all', 'menu']).default('all'),
    conditions: z.record(z.string(), z.unknown()).optional(),
    paymentType: z.enum(['naverpay', 'kakaopay', 'card', 'other']).optional(),
    startAt: z.coerce.date().optional(),
    endAt: z.coerce.date().optional(),
  })
  .refine((v) => v.discountType !== 'percentage' || v.discountValue <= 100, {
    message: '정률 할인은 0~100% 범위여야 합니다.',
    path: ['discountValue'],
  })
  .refine((v) => !v.startAt || !v.endAt || v.endAt > v.startAt, {
    message: '종료일은 시작일보다 이후여야 합니다.',
    path: ['endAt'],
  });

export type CreateDiscountDto = z.infer<typeof CreateDiscountSchema>;
