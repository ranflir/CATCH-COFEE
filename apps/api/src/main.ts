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

  // 허용 오리진: 로컬 개발 기본값 + FRONTEND_URL(콤마 구분 다중 오리진).
  // credentials:true 이므로 '*' 사용 불가 → 명시적 allowlist 로 검사.
  const stripSlash = (s: string) => s.trim().replace(/\/$/, '');
  const allowedOrigins = new Set(
    ['http://localhost:3000', 'http://localhost:3001']
      .concat((process.env.FRONTEND_URL ?? '').split(','))
      .map(stripSlash)
      .filter(Boolean),
  );

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // origin 없음(서버-서버, curl, 동일 오리진) 은 허용.
      if (!origin || allowedOrigins.has(stripSlash(origin))) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS: origin ${origin} 허용되지 않음`));
    },
    credentials: true,
  });

  app.useGlobalInterceptors(new ResponseFormatInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
