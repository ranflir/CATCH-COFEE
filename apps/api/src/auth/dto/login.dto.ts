import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const LoginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(72),
});

export class LoginDto extends createZodDto(LoginSchema) {}
