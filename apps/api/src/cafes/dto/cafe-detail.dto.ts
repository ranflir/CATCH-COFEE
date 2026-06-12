import { z } from 'zod';

export const CafeDetailQuerySchema = z
  .object({
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
  })
  .refine((v) => (v.lat === undefined) === (v.lng === undefined), {
    message: 'lat과 lng는 함께 제공해야 합니다.',
  });

export type CafeDetailQueryDto = z.infer<typeof CafeDetailQuerySchema>;
