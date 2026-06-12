import { z } from 'zod';

export const CafeSearchSchema = z
  .object({
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radius: z.coerce.number().int().min(50).max(5000).default(1000),
    sort: z.enum(['distance', 'alphabetical']).default('distance'),
    q: z.string().trim().min(1).max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine((v) => (v.lat === undefined) === (v.lng === undefined), {
    message: 'lat과 lng는 함께 제공해야 합니다.',
  })
  .refine((v) => v.sort !== 'distance' || v.lat !== undefined, {
    message: '거리순 정렬에는 lat/lng가 필요합니다.',
  });

export type CafeSearchDto = z.infer<typeof CafeSearchSchema>;
