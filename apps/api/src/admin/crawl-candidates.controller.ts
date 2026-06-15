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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CrawlCandidatesService } from './crawl-candidates.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CrawlCandidateQueueSchema,
  CrawlCandidateQueueDto,
} from './dto/crawl-candidate-queue.dto';
import {
  ApproveCandidateSchema,
  ApproveCandidateDto,
} from './dto/approve-candidate.dto';
import {
  RejectCandidateSchema,
  RejectCandidateDto,
} from './dto/reject-candidate.dto';
import type { JwtPayload } from '../common/types/jwt-payload.type';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin/crawl-candidates')
@Roles('admin')
export class CrawlCandidatesController {
  constructor(private readonly service: CrawlCandidatesService) {}

  @Get()
  listQueue(
    @Query(new ZodValidationPipe(CrawlCandidateQueueSchema))
    query: CrawlCandidateQueueDto,
  ) {
    return this.service.listQueue(query);
  }

  @Get(':id')
  getCandidate(@Param('id') id: string) {
    return this.service.getCandidate(id);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ApproveCandidateSchema)) dto: ApproveCandidateDto,
  ) {
    return this.service.approve(id, dto);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RejectCandidateSchema)) dto: RejectCandidateDto,
  ) {
    return this.service.reject(id, user.id, dto);
  }
}
