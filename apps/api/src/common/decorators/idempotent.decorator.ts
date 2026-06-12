import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENT_KEY = 'idempotent';

/** 이 라우트는 Idempotency-Key 헤더로 중복 제출을 방지한다. */
export const Idempotent = () => SetMetadata(IDEMPOTENT_KEY, true);
