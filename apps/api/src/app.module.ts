import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { RedisModule } from './redis/redis.module';
import { IdempotencyInterceptor } from './common/interceptors/idempotency.interceptor';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CafesModule } from './cafes/cafes.module';
import { DiscountsModule } from './discounts/discounts.module';
import { ReportsModule } from './reports/reports.module';
import { PaymentsModule } from './payments/payments.module';
import { FavoritesModule } from './favorites/favorites.module';
import { PaymentAlertsModule } from './alerts/payment-alerts.module';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DevicesModule } from './devices/devices.module';
import { UploadsModule } from './uploads/uploads.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    ThrottlerModule.forRoot([
      { ttl: 60000, limit: process.env.NODE_ENV !== 'production' ? 10000 : 60 },
    ]),
    RedisModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    CafesModule,
    DiscountsModule,
    ReportsModule,
    PaymentsModule,
    FavoritesModule,
    PaymentAlertsModule,
    AdminModule,
    NotificationsModule,
    DevicesModule,
    UploadsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
  ],
})
export class AppModule {}
