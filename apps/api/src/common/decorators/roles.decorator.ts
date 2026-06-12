import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../types/jwt-payload.type';

export const ROLES_KEY = 'roles';

/** 허용 역할 지정. RolesGuard가 request.user.role 과 대조. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
