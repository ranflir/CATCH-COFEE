import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const RejectCandidateSchema = z.object({
  reason: z.string().max(500).optional(),
});
export class RejectCandidateDto extends createZodDto(RejectCandidateSchema) {}
