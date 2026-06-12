import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { SignupSchema, type SignupDto } from './dto/signup.dto';
import { LoginSchema, type LoginDto } from './dto/login.dto';
import { RefreshSchema, type RefreshDto } from './dto/refresh.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  signup(@Body(new ZodValidationPipe(SignupSchema)) dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  login(@Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  refresh(@Body(new ZodValidationPipe(RefreshSchema)) dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  // 무상태 JWT — 서버 측 세션이 없으므로 클라이언트가 토큰을 폐기하면 로그아웃 완료.
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(): void {
    return;
  }
}
