import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS = Symbol('REDIS');

/** REDIS_URL 미설정 시 null 주입 → 소비자(인터셉터)가 no-op 처리(MVP). */
@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis | null => {
        const url = config.get<string>('REDIS_URL');
        if (!url) {
          return null;
        }
        return new Redis(url, { maxRetriesPerRequest: 2 });
      },
    },
  ],
  exports: [REDIS],
})
export class RedisModule {}
