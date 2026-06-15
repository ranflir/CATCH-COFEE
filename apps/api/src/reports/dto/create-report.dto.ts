import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { isoDate } from '../../common/zod/iso-date';

export const CreateReportSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    discountType: z.enum(['percentage', 'amount']),
    discountValue: z.number().positive(),
    conditions: z.record(z.string(), z.unknown()).optional(),
    infoSource: z.enum(['offline', 'receipt', 'store_notice', 'witnessed']),
    // 영수증/사진 필수 (스키마 NOT NULL). 업로드는 별도(추후 presigned), 여기선 URL 수신.
    receiptImageUrl: z.string().url().max(2048),
    startAt: isoDate.optional(),
    endAt: isoDate.optional(),
  })
  .refine((v) => v.discountType !== 'percentage' || v.discountValue <= 100, {
    message: '정률 할인은 0~100% 범위여야 합니다.',
    path: ['discountValue'],
  })
  .refine((v) => !v.startAt || !v.endAt || v.endAt > v.startAt, {
    message: '종료일은 시작일보다 이후여야 합니다.',
    path: ['endAt'],
  });

export class CreateReportDto extends createZodDto(CreateReportSchema) {}
