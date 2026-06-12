import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { z } from 'zod';
import type { CrawlCandidate } from '@catch-coffee/db';
import { CrawlCandidatesRepository } from './crawl-candidates.repository';
import type { CrawlCandidateQueueDto } from './dto/crawl-candidate-queue.dto';
import type { ApproveCandidateDto } from './dto/approve-candidate.dto';
import type { RejectCandidateDto } from './dto/reject-candidate.dto';
import { ErrorCode } from '../common/constants/error-codes';

/** 크롤러 parser 가 적재하는 파싱 결과 형태 */
const ParsedDiscountSchema = z.object({
  title: z.string().min(1),
  discountType: z.enum(['percentage', 'amount']),
  discountValue: z.number().positive(),
});

export interface CandidateReviewResultView {
  candidateId: string;
  status: CrawlCandidate['status'];
  registeredDiscountId: string | null;
}

@Injectable()
export class CrawlCandidatesService {
  constructor(private readonly repository: CrawlCandidatesRepository) {}

  listQueue(query: CrawlCandidateQueueDto): Promise<CrawlCandidate[]> {
    const statuses: CrawlCandidate['status'][] = query.status
      ? [query.status]
      : ['pending'];
    return this.repository.listQueue({
      statuses,
      page: query.page,
      limit: query.limit,
    });
  }

  async getCandidate(id: string): Promise<CrawlCandidate> {
    const candidate = await this.repository.findById(id);
    if (!candidate) {
      throw new NotFoundException({ code: ErrorCode.CRAWL_CANDIDATE_NOT_FOUND });
    }
    return candidate;
  }

  async approve(
    id: string,
    dto: ApproveCandidateDto,
  ): Promise<CandidateReviewResultView> {
    const candidate = await this.getCandidate(id);
    if (candidate.status !== 'pending') {
      throw new ConflictException({ code: ErrorCode.CRAWL_CANDIDATE_REVIEW_CLOSED });
    }

    const cafeId = dto.cafeId ?? candidate.cafeId;
    if (!cafeId) {
      throw new BadRequestException({ code: ErrorCode.CRAWL_CANDIDATE_NO_CAFE });
    }

    // 파싱 결과 + override 병합 후 검증
    const parsed =
      candidate.parsed && typeof candidate.parsed === 'object'
        ? (candidate.parsed as Record<string, unknown>)
        : {};
    const merged = {
      title: dto.title ?? parsed.title,
      discountType: dto.discountType ?? parsed.discountType,
      discountValue: dto.discountValue ?? parsed.discountValue,
    };
    const validation = ParsedDiscountSchema.safeParse(merged);
    if (!validation.success) {
      throw new BadRequestException({
        code: ErrorCode.CRAWL_CANDIDATE_INVALID_PARSED,
      });
    }

    const result = await this.repository.approve(id, {
      cafeId,
      title: validation.data.title,
      discountType: validation.data.discountType,
      discountValue: validation.data.discountValue,
    });

    switch (result.outcome) {
      case 'not_found':
        throw new NotFoundException({ code: ErrorCode.CRAWL_CANDIDATE_NOT_FOUND });
      case 'closed':
        throw new ConflictException({ code: ErrorCode.CRAWL_CANDIDATE_REVIEW_CLOSED });
      case 'approved':
        return {
          candidateId: result.candidate.id,
          status: result.candidate.status,
          registeredDiscountId: result.discountId,
        };
    }
  }

  async reject(
    id: string,
    reviewerId: string,
    dto: RejectCandidateDto,
  ): Promise<CandidateReviewResultView> {
    const result = await this.repository.reject(id, reviewerId, dto.reason);
    switch (result.outcome) {
      case 'not_found':
        throw new NotFoundException({ code: ErrorCode.CRAWL_CANDIDATE_NOT_FOUND });
      case 'closed':
        throw new ConflictException({ code: ErrorCode.CRAWL_CANDIDATE_REVIEW_CLOSED });
      case 'rejected':
        return {
          candidateId: result.candidate.id,
          status: result.candidate.status,
          registeredDiscountId: null,
        };
    }
  }
}
