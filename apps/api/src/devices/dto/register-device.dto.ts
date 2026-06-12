import { z } from 'zod';

export const RegisterDeviceSchema = z.object({
  expoPushToken: z.string().min(1).max(255),
  platform: z.enum(['ios', 'android', 'web']),
});
export type RegisterDeviceDto = z.infer<typeof RegisterDeviceSchema>;
