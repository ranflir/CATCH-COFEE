import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const ListNotificationsSchema = z.object({
  unread: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export class ListNotificationsDto extends createZodDto(ListNotificationsSchema) {}
