import { Module } from '@nestjs/common';
import { PaymentAlertsController } from './payment-alerts.controller';
import { PaymentAlertsService } from './payment-alerts.service';
import { PaymentAlertsRepository } from './payment-alerts.repository';

@Module({
  controllers: [PaymentAlertsController],
  providers: [PaymentAlertsService, PaymentAlertsRepository],
})
export class PaymentAlertsModule {}
