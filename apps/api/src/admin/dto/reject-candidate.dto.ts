import { z } from 'zod';

export const RejectCandidateSchema = z.object({
  reason: z.string().max(500).optional(),
});
export type RejectCandidateDto = z.infer<typeof RejectCandidateSchema>;
