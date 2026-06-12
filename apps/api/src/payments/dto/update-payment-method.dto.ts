import { z } from 'zod';

export const UpdatePaymentMethodSchema = z
  .object({
    label: z.string().trim().min(1).max(100).optional(),
    token: z.string().min(1).max(2048).optional(),
    isDefault: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: '수정할 필드가 최소 하나 필요합니다.',
  });

export type UpdatePaymentMethodDto = z.infer<typeof UpdatePaymentMethodSchema>;
