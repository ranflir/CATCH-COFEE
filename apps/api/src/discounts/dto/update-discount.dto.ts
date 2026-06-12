import { z } from 'zod';

export const UpdateDiscountSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    discountType: z.enum(['percentage', 'amount']).optional(),
    discountValue: z.number().positive().optional(),
    targetScope: z.enum(['all', 'menu']).optional(),
    conditions: z.record(z.string(), z.unknown()).optional(),
    paymentType: z.enum(['naverpay', 'kakaopay', 'card', 'other']).optional(),
    startAt: z.coerce.date().optional(),
    endAt: z.coerce.date().optional(),
    // 조기 종료/숨김 등 상태 전환
    status: z.enum(['scheduled', 'active', 'ended', 'hidden']).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: '수정할 필드가 최소 하나 필요합니다.',
  })
  .refine(
    (v) =>
      v.discountType !== 'percentage' ||
      v.discountValue === undefined ||
      v.discountValue <= 100,
    { message: '정률 할인은 0~100% 범위여야 합니다.', path: ['discountValue'] },
  )
  .refine((v) => !v.startAt || !v.endAt || v.endAt > v.startAt, {
    message: '종료일은 시작일보다 이후여야 합니다.',
    path: ['endAt'],
  });

export type UpdateDiscountDto = z.infer<typeof UpdateDiscountSchema>;
