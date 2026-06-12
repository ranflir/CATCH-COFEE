import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { JwtPayload } from '../types/jwt-payload.type';
import { ErrorCode } from '../constants/error-codes';

/**
 * 전역 인증 가드. Bearer access token(JWT)을 검증해 request.user 주입.
 * @Public() 라우트는 토큰이 있으면 주입하되 없어도 통과.
 *
 * 무상태(stateless) 검증 — DB 조회 없이 서명/만료만 확인 (access token 단명).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (isPublic) {
      if (token) {
        try {
          const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
          if (this.isValidPayload(payload)) request.user = payload;
        } catch {
          /* 유효하지 않은 토큰은 무시 */
        }
      }
      return true;
    }

    if (!token) {
      throw new UnauthorizedException({ code: ErrorCode.TOKEN_INVALID });
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      if (!this.isValidPayload(payload)) {
        throw new UnauthorizedException({ code: ErrorCode.TOKEN_INVALID });
      }
      request.user = payload;
      return true;
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new UnauthorizedException({ code: ErrorCode.TOKEN_EXPIRED });
      }
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException({ code: ErrorCode.TOKEN_INVALID });
    }
  }

  private isValidPayload(payload: unknown): payload is JwtPayload {
    if (typeof payload !== 'object' || payload === null) return false;
    const p = payload as Partial<JwtPayload>;
    return typeof p.id === 'string' && p.id.length > 0 && typeof p.role === 'string';
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      if (token) return token;
    }
    return null;
  }
}
