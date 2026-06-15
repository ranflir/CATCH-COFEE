import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export class RefreshDto extends createZodDto(RefreshSchema) {}
