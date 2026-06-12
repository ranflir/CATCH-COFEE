import { z } from 'zod';

export const AddFavoriteSchema = z.object({
  notifyEnabled: z.boolean().optional(),
});
export type AddFavoriteDto = z.infer<typeof AddFavoriteSchema>;

export const UpdateFavoriteSchema = z.object({
  notifyEnabled: z.boolean(),
});
export type UpdateFavoriteDto = z.infer<typeof UpdateFavoriteSchema>;
