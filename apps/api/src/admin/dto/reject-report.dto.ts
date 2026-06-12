import { z } from 'zod';

export const RejectReportSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});
export type RejectReportDto = z.infer<typeof RejectReportSchema>;
