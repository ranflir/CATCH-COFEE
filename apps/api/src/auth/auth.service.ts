import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { User } from '@catch-coffee/db';
import { AuthRepository } from './auth.repository';
import type { JwtPayload, UserRole } from '../common/types/jwt-payload.type';
import { ErrorCode } from '../common/constants/error-codes';

const BCRYPT_ROUNDS = 12;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signup(input: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }): Promise<AuthTokens> {
    const existing = await this.repository.findActiveByEmail(input.email);
    if (existing) {
      throw new ConflictException({ code: ErrorCode.AUTH_EMAIL_ALREADY_EXISTS });
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await this.repository.createUser({
      email: input.email,
      passwordHash,
      name: input.name,
      phone: input.phone,
    });

    return this.issueTokens(user);
  }

  async login(input: { email: string; password: string }): Promise<AuthTokens> {
    const user = await this.repository.findActiveByEmail(input.email);
    if (!user) {
      throw new UnauthorizedException({ code: ErrorCode.AUTH_INVALID_CREDENTIALS });
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException({ code: ErrorCode.AUTH_INVALID_CREDENTIALS });
    }

    return this.issueTokens(user);
  }

  /**
   * Refresh token(JWT, 별도 시크릿)을 검증해 새 토큰 쌍 발급.
   * 무상태 회전 — 사용자 존재 여부만 재확인.
   */
  async refresh(rawRefreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(rawRefreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException({ code: ErrorCode.TOKEN_INVALID });
    }

    const user = await this.repository.findActiveById(payload.id);
    if (!user) {
      throw new UnauthorizedException({ code: ErrorCode.AUTH_USER_NOT_FOUND });
    }

    return this.issueTokens(user);
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = { id: user.id, role: user.role as UserRole };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: Number(this.config.get('JWT_REFRESH_EXPIRES_IN', 1209600)),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
