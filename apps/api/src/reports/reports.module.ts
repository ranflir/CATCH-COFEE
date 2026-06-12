import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportsRepository } from './reports.repository';
import { CafesRepository } from '../cafes/cafes.repository';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, ReportsRepository, CafesRepository],
})
export class ReportsModule {}
