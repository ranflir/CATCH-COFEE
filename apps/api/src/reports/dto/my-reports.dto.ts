import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const MyReportsQuerySchema = z.object({
  status: z
    .enum(['pending', 'reviewing', 'approved', 'rejected', 'auto_registered'])
    .optional(),
});

export class MyReportsQueryDto extends createZodDto(MyReportsQuerySchema) {}
