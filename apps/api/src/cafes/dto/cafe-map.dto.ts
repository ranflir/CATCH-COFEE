import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/** bbox = "minLng,minLat,maxLng,maxLat" (지도 영역) */
export const CafeMapSchema = z
  .object({
    bbox: z
      .string()
      .transform((s, ctx) => {
        const parts = s.split(',').map((p) => Number(p.trim()));
        if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
          ctx.addIssue({ code: 'custom', message: 'bbox는 "minLng,minLat,maxLng,maxLat" 형식이어야 합니다.' });
          return z.NEVER;
        }
        const [minLng, minLat, maxLng, maxLat] = parts as [number, number, number, number];
        if (minLng > maxLng || minLat > maxLat) {
          ctx.addIssue({ code: 'custom', message: 'bbox 좌표 범위가 올바르지 않습니다.' });
          return z.NEVER;
        }
        return { minLng, minLat, maxLng, maxLat };
      }),
    limit: z.coerce.number().int().min(1).max(500).default(200),
  });

export class CafeMapDto extends createZodDto(CafeMapSchema) {}
