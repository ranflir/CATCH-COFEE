import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { DiscountReport } from '@catch-coffee/db';
import { ReportsRepository } from '../reports/reports.repository';
import type { ReviewQueueDto } from './dto/review-queue.dto';
import { ErrorCode } from '../common/constants/error-codes';

export interface ReviewResultView {
  reportId: string;
  status: DiscountReport['status'];
  registeredDiscountId: string | null;
}

@Injectable()
export class AdminReportsService {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  listQueue(query: ReviewQueueDto): Promise<DiscountReport[]> {
    const statuses: DiscountReport['status'][] = query.status
      ? [query.status]
      : ['pending', 'reviewing'];
    return this.reportsRepository.listForReview({
      statuses,
      page: query.page,
      limit: query.limit,
    });
  }

  async getReport(id: string): Promise<DiscountReport> {
    const report = await this.reportsRepository.findById(id);
    if (!report) {
      throw new NotFoundException({ code: ErrorCode.REPORT_NOT_FOUND });
    }
    return report;
  }

  async approve(id: string, reviewerId: string): Promise<ReviewResultView> {
    const result = await this.reportsRepository.approve(id, reviewerId);
    switch (result.outcome) {
      case 'not_found':
        throw new NotFoundException({ code: ErrorCode.REPORT_NOT_FOUND });
      case 'closed':
        throw new ConflictException({ code: ErrorCode.REPORT_REVIEW_CLOSED });
      case 'approved':
        return {
          reportId: result.report.id,
          status: result.report.status,
          registeredDiscountId: result.discountId,
        };
      default:
        throw new ConflictException({ code: ErrorCode.REPORT_REVIEW_CLOSED });
    }
  }

  async reject(id: string, reviewerId: string, reason: string): Promise<ReviewResultView> {
    const result = await this.reportsRepository.reject(id, reviewerId, reason);
    switch (result.outcome) {
      case 'not_found':
        throw new NotFoundException({ code: ErrorCode.REPORT_NOT_FOUND });
      case 'closed':
        throw new ConflictException({ code: ErrorCode.REPORT_REVIEW_CLOSED });
      case 'rejected':
        return {
          reportId: result.report.id,
          status: result.report.status,
          registeredDiscountId: result.report.registeredDiscountId,
        };
      default:
        throw new ConflictException({ code: ErrorCode.REPORT_REVIEW_CLOSED });
    }
  }
}
