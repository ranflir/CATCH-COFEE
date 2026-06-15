import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const RegisterDeviceSchema = z.object({
  expoPushToken: z.string().min(1).max(255),
  platform: z.enum(['ios', 'android', 'web']),
});
export class RegisterDeviceDto extends createZodDto(RegisterDeviceSchema) {}
