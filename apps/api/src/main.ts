import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseFormatInterceptor } from './common/interceptors/response-format.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  // JWT 시크릿 미설정/취약 시 부팅 차단 — 폴백 시크릿 배포 방지.
  for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
    const value = process.env[key];
    if (!value) {
      throw new Error(`[보안] ${key} 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.`);
    }
    if (value.length < 32) {
      throw new Error(`[보안] ${key} 길이가 ${value.length}자입니다. 최소 32자(256bit) 이상이어야 합니다.`);
    }
  }

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: process.env.FRONTEND_URL?.replace(/\/$/, '') ?? '*',
    credentials: true,
  });

  app.useGlobalInterceptors(new ResponseFormatInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
