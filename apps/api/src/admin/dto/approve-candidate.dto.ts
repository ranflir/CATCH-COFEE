import { z } from 'zod';

/** 검수 승인 시 파싱 결과를 보정/확정하기 위한 override (선택) */
export const ApproveCandidateSchema = z.object({
  cafeId: z.string().min(1).optional(),
  title: z.string().min(1).max(200).optional(),
  discountType: z.enum(['percentage', 'amount']).optional(),
  discountValue: z.number().positive().optional(),
});
export type ApproveCandidateDto = z.infer<typeof ApproveCandidateSchema>;
