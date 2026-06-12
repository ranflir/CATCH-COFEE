import { z } from 'zod';

export const MyReportsQuerySchema = z.object({
  status: z
    .enum(['pending', 'reviewing', 'approved', 'rejected', 'auto_registered'])
    .optional(),
});

export type MyReportsQueryDto = z.infer<typeof MyReportsQuerySchema>;
