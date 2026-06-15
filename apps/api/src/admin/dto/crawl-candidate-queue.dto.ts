import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CrawlCandidateQueueSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export class CrawlCandidateQueueDto extends createZodDto(
  CrawlCandidateQueueSchema,
) {}
