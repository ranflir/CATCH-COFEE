import { z } from 'zod';

export const CreatePaymentMethodSchema = z.object({
  type: z.enum(['naverpay', 'kakaopay', 'card', 'other']),
  label: z.string().trim().min(1).max(100),
  // 민감 인증정보(선택) — 제공 시 AES-GCM 암호화 저장
  token: z.string().min(1).max(2048).optional(),
  isDefault: z.boolean().optional(),
});

export type CreatePaymentMethodDto = z.infer<typeof CreatePaymentMethodSchema>;
