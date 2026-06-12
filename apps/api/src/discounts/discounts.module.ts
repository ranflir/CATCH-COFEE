import { Module } from '@nestjs/common';
import { DiscountsController } from './discounts.controller';
import { DiscountsService } from './discounts.service';
import { DiscountsRepository } from './discounts.repository';
import { CafesRepository } from '../cafes/cafes.repository';

@Module({
  controllers: [DiscountsController],
  providers: [DiscountsService, DiscountsRepository, CafesRepository],
})
export class DiscountsModule {}
