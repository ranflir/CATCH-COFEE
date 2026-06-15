import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/** 영수증 업로드 허용 이미지 타입 → 확장자 매핑 */
export const RECEIPT_CONTENT_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const PresignReceiptSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});

export class PresignReceiptDto extends createZodDto(PresignReceiptSchema) {}
