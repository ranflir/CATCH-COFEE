import { Module } from '@nestjs/common';
import { AdminReportsController } from './admin-reports.controller';
import { AdminReportsService } from './admin-reports.service';
import { ReportsRepository } from '../reports/reports.repository';

@Module({
  controllers: [AdminReportsController],
  providers: [AdminReportsService, ReportsRepository],
})
export class AdminModule {}
