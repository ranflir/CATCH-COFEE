import { BadRequestException, PipeTransform } from '@nestjs/common';
import { z, ZodType } from 'zod';
import { ErrorCode } from '../constants/error-codes';

/**
 * Zod 스키마 기반 요청 검증 파이프.
 *
 * 사용:
 *   @Body(new ZodValidationPipe(SignupSchema)) dto: SignupDto
 *
 * 실패 시 error envelope:
 *   { error: { code: 'VALIDATION_ERROR', details: <tree> } }
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: ErrorCode.VALIDATION_ERROR,
        details: z.treeifyError(result.error),
      });
    }
    return result.data;
  }
}
