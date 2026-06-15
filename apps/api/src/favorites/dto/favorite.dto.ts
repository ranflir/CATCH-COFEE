import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const AddFavoriteSchema = z.object({
  notifyEnabled: z.boolean().optional(),
});
export class AddFavoriteDto extends createZodDto(AddFavoriteSchema) {}

export const UpdateFavoriteSchema = z.object({
  notifyEnabled: z.boolean(),
});
export class UpdateFavoriteDto extends createZodDto(UpdateFavoriteSchema) {}
