import { z } from 'zod';

export const UpdateMeSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    phone: z.string().max(20).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'At least one field is required',
  });

export type UpdateMeDto = z.infer<typeof UpdateMeSchema>;
