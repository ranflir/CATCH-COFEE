import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { UserRole } from '../types/jwt-payload.type';

/**
 * @Roles(...) 로 지정된 역할만 통과. JwtAuthGuard 이후 실행되어 request.user 존재 가정.
 * 데코레이터 없는 라우트는 통과.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const role = request.user?.role;
    if (!role || !required.includes(role)) {
      throw new ForbiddenException({ code: 'INSUFFICIENT_ROLE' });
    }
    return true;
  }
}
