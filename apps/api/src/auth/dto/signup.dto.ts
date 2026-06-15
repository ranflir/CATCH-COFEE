import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const SignupSchema = z.object({
  email: z.string().email().max(255),
  // bcrypt는 72바이트까지만 유효 → 상한 명시
  password: z.string().min(8).max(72),
  name: z.string().min(1).max(100),
  phone: z.string().max(20).optional(),
});

export class SignupDto extends createZodDto(SignupSchema) {}
