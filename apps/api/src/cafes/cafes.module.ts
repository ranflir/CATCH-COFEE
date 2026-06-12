import { Module } from '@nestjs/common';
import { CafesController } from './cafes.controller';
import { CafesService } from './cafes.service';
import { CafesRepository } from './cafes.repository';
import { DiscountsRepository } from '../discounts/discounts.repository';

@Module({
  controllers: [CafesController],
  providers: [CafesService, CafesRepository, DiscountsRepository],
})
export class CafesModule {}
