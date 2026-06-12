import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateReportSchema, type CreateReportDto } from './dto/create-report.dto';
import { MyReportsQuerySchema, type MyReportsQueryDto } from './dto/my-reports.dto';
import type { JwtPayload } from '../common/types/jwt-payload.type';

@Controller()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('cafes/:cafeId/reports')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('cafeId') cafeId: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateReportSchema)) dto: CreateReportDto,
  ) {
    return this.reportsService.createReport(cafeId, user, dto);
  }

  @Get('me/reports')
  myReports(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(MyReportsQuerySchema)) query: MyReportsQueryDto,
  ) {
    return this.reportsService.getMyReports(user.id, query.status);
  }

  @Public()
  @Get('reports/:id')
  getOne(@Param('id') id: string) {
    return this.reportsService.getReport(id);
  }

  @Post('reports/:id/confirm')
  @HttpCode(HttpStatus.OK)
  confirm(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.reportsService.confirm(id, user);
  }

  @Delete('reports/:id/confirm')
  @HttpCode(HttpStatus.OK)
  cancelConfirm(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.reportsService.cancelConfirm(id, user);
  }
}
