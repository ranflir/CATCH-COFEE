import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { DiscountReport } from '@catch-coffee/db';
import { ReportsRepository } from './reports.repository';
import { CafesRepository } from '../cafes/cafes.repository';
import type { CreateReportDto } from './dto/create-report.dto';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import { ErrorCode } from '../common/constants/error-codes';

export interface ConfirmStateView {
  reportId: string;
  status: DiscountReport['status'];
  confirmCount: number;
  autoRegistered: boolean;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly cafesRepository: CafesRepository,
  ) {}

  async createReport(
    cafeId: string,
    user: JwtPayload,
    dto: CreateReportDto,
  ): Promise<DiscountReport> {
    const cafe = await this.cafesRepository.findById(cafeId);
    if (!cafe) {
      throw new NotFoundException({ code: ErrorCode.CAFE_NOT_FOUND });
    }
    return this.reportsRepository.create({
      cafeId,
      reporterId: user.id,
      title: dto.title,
      discountType: dto.discountType,
      discountValue: String(dto.discountValue),
      conditions: dto.conditions,
      infoSource: dto.infoSource,
      receiptImageUrl: dto.receiptImageUrl,
      startAt: dto.startAt,
      endAt: dto.endAt,
    });
  }

  async getReport(id: string): Promise<DiscountReport> {
    const report = await this.reportsRepository.findById(id);
    if (!report) {
      throw new NotFoundException({ code: ErrorCode.REPORT_NOT_FOUND });
    }
    return report;
  }

  getMyReports(userId: string, status?: DiscountReport['status']): Promise<DiscountReport[]> {
    return this.reportsRepository.findByReporter(userId, status);
  }

  async confirm(id: string, user: JwtPayload): Promise<ConfirmStateView> {
    const result = await this.reportsRepository.confirm(id, user.id);
    switch (result.outcome) {
      case 'not_found':
        throw new NotFoundException({ code: ErrorCode.REPORT_NOT_FOUND });
      case 'self':
        throw new BadRequestException({ code: ErrorCode.REPORT_SELF_CONFIRM });
      case 'closed':
        throw new ConflictException({ code: ErrorCode.REPORT_CONFIRM_CLOSED });
      default:
        return this.toView(result.report);
    }
  }

  async cancelConfirm(id: string, user: JwtPayload): Promise<ConfirmStateView> {
    const result = await this.reportsRepository.cancelConfirm(id, user.id);
    switch (result.outcome) {
      case 'not_found':
        throw new NotFoundException({ code: ErrorCode.REPORT_NOT_FOUND });
      case 'locked':
        throw new ConflictException({ code: ErrorCode.REPORT_ALREADY_REGISTERED });
      default:
        return this.toView(result.report);
    }
  }

  private toView(report: DiscountReport): ConfirmStateView {
    return {
      reportId: report.id,
      status: report.status,
      confirmCount: report.confirmCount,
      autoRegistered: report.status === 'auto_registered',
    };
  }
}
