import { z } from 'zod';

export const ReviewQueueSchema = z.object({
  status: z
    .enum(['pending', 'reviewing', 'approved', 'rejected', 'auto_registered'])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ReviewQueueDto = z.infer<typeof ReviewQueueSchema>;
