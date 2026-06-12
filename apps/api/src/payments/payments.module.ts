import { Module } from '@nestjs/common';
import { PaymentMethodsController } from './payment-methods.controller';
import { PaymentMethodsService } from './payment-methods.service';
import { PaymentMethodsRepository } from './payment-methods.repository';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import { CafesRepository } from '../cafes/cafes.repository';
import { DiscountsRepository } from '../discounts/discounts.repository';

@Module({
  controllers: [PaymentMethodsController, RecommendationController],
  providers: [
    PaymentMethodsService,
    PaymentMethodsRepository,
    RecommendationService,
    CafesRepository,
    DiscountsRepository,
  ],
})
export class PaymentsModule {}
