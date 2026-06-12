import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '../types/jwt-payload.type';
import { ErrorCode } from '../constants/error-codes';

/** 인증된 사용자(JwtPayload) 주입. 비공개 라우트에서만 사용. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<Request>();
    if (!request.user) {
      throw new UnauthorizedException({ code: ErrorCode.TOKEN_INVALID });
    }
    return request.user;
  },
);
