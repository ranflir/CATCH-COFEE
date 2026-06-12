import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AdminReportsService } from './admin-reports.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ReviewQueueSchema, type ReviewQueueDto } from './dto/review-queue.dto';
import { RejectReportSchema, type RejectReportDto } from './dto/reject-report.dto';
import type { JwtPayload } from '../common/types/jwt-payload.type';

@Controller('admin/reports')
@Roles('admin')
export class AdminReportsController {
  constructor(private readonly service: AdminReportsService) {}

  @Get()
  listQueue(@Query(new ZodValidationPipe(ReviewQueueSchema)) query: ReviewQueueDto) {
    return this.service.listQueue(query);
  }

  @Get(':id')
  getReport(@Param('id') id: string) {
    return this.service.getReport(id);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.approve(id, user.id);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RejectReportSchema)) dto: RejectReportDto,
  ) {
    return this.service.reject(id, user.id, dto.reason);
  }
}
