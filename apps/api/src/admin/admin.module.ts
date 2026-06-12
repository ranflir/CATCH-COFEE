import { Module } from '@nestjs/common';
import { AdminReportsController } from './admin-reports.controller';
import { AdminReportsService } from './admin-reports.service';
import { CrawlCandidatesController } from './crawl-candidates.controller';
import { CrawlCandidatesService } from './crawl-candidates.service';
import { CrawlCandidatesRepository } from './crawl-candidates.repository';
import { ReportsRepository } from '../reports/reports.repository';

@Module({
  controllers: [AdminReportsController, CrawlCandidatesController],
  providers: [
    AdminReportsService,
    ReportsRepository,
    CrawlCandidatesService,
    CrawlCandidatesRepository,
  ],
})
export class AdminModule {}
