import {
  CallHandler,
  ConflictException,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Redis } from 'ioredis';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { IDEMPOTENT_KEY } from '../decorators/idempotent.decorator';
import { REDIS } from '../../redis/redis.module';
import { ErrorCode } from '../constants/error-codes';

const PENDING = '__PENDING__';
const PENDING_TTL = 60; // 처리 중 락
const RESULT_TTL = 86_400; // 완료 응답 캐시 24h

/**
 * @Idempotent() + Idempotency-Key 헤더가 있을 때만 동작.
 * SET NX 로 선점 → 진행 중이면 409, 완료 응답은 캐시해 재요청 시 그대로 반환.
 * REDIS 미주입(null) 또는 헤더 없으면 통과.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @Inject(REDIS) private readonly redis: Redis | null,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const isIdempotent = this.reflector.getAllAndOverride<boolean>(IDEMPOTENT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const req = context.switchToHttp().getRequest<Request>();
    const headerKey = req.header('Idempotency-Key');

    if (!isIdempotent || !this.redis || !headerKey) {
      return next.handle();
    }

    const redis = this.redis;
    const userId = req.user?.id ?? 'anon';
    const cacheKey = `idem:${userId}:${req.method}:${req.originalUrl}:${headerKey}`;

    const acquired = await redis.set(cacheKey, PENDING, 'EX', PENDING_TTL, 'NX');
    if (acquired !== 'OK') {
      const existing = await redis.get(cacheKey);
      if (existing && existing !== PENDING) {
        return of(JSON.parse(existing) as unknown);
      }
      throw new ConflictException({ code: ErrorCode.IDEMPOTENCY_IN_PROGRESS });
    }

    return next.handle().pipe(
      mergeMap((data) =>
        from(
          redis
            .set(cacheKey, JSON.stringify(data ?? null), 'EX', RESULT_TTL)
            .then(() => data),
        ),
      ),
      catchError((err) => {
        // 실패는 재시도 가능하도록 락 해제
        void redis.del(cacheKey);
        return throwError(() => err);
      }),
    );
  }
}
