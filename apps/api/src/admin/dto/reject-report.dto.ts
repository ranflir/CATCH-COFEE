import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const RejectReportSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});
export class RejectReportDto extends createZodDto(RejectReportSchema) {}
