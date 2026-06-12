import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { CrawlCandidate } from '@catch-coffee/db';
import { CrawlCandidatesService } from './crawl-candidates.service';
import type { CrawlCandidatesRepository } from './crawl-candidates.repository';

function makeRepo(overrides: Partial<CrawlCandidatesRepository> = {}) {
  return {
    listQueue: jest.fn(),
    findById: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
    ...overrides,
  } as unknown as CrawlCandidatesRepository;
}

const candidate = (over: Partial<CrawlCandidate> = {}): CrawlCandidate =>
  ({
    id: 'c1',
    sourceId: 's1',
    cafeId: null,
    rawText: '아메리카노 10% 할인',
    parsed: { title: '아메리카노 10% 할인', discountType: 'percentage', discountValue: 10 },
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  }) as CrawlCandidate;

describe('CrawlCandidatesService', () => {
  it('getCandidate: 없으면 NotFound', async () => {
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(undefined) });
    const service = new CrawlCandidatesService(repo);
    await expect(service.getCandidate('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('approve: cafeId 없으면(후보/override 모두 없음) BadRequest', async () => {
    const repo = makeRepo({
      findById: jest.fn().mockResolvedValue(candidate({ cafeId: null })),
    });
    const service = new CrawlCandidatesService(repo);
    await expect(service.approve('c1', {})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('approve: 이미 검수 완료면 Conflict', async () => {
    const repo = makeRepo({
      findById: jest.fn().mockResolvedValue(candidate({ status: 'approved' })),
    });
    const service = new CrawlCandidatesService(repo);
    await expect(service.approve('c1', { cafeId: 'cafe1' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('approve: 파싱 결과 유효하지 않으면 BadRequest', async () => {
    const repo = makeRepo({
      findById: jest.fn().mockResolvedValue(candidate({ parsed: { foo: 'bar' } })),
    });
    const service = new CrawlCandidatesService(repo);
    await expect(service.approve('c1', { cafeId: 'cafe1' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('approve: 성공 시 discountId 반환 (override cafeId)', async () => {
    const repo = makeRepo({
      findById: jest.fn().mockResolvedValue(candidate()),
      approve: jest.fn().mockResolvedValue({
        outcome: 'approved',
        candidate: candidate({ status: 'approved', cafeId: 'cafe1' }),
        discountId: 'd1',
      }),
    });
    const service = new CrawlCandidatesService(repo);
    const res = await service.approve('c1', { cafeId: 'cafe1' });
    expect(res).toEqual({
      candidateId: 'c1',
      status: 'approved',
      registeredDiscountId: 'd1',
    });
    expect(repo.approve).toHaveBeenCalledWith('c1', {
      cafeId: 'cafe1',
      title: '아메리카노 10% 할인',
      discountType: 'percentage',
      discountValue: 10,
    });
  });

  it('reject: not_found 아웃컴 → NotFound', async () => {
    const repo = makeRepo({
      reject: jest.fn().mockResolvedValue({ outcome: 'not_found' }),
    });
    const service = new CrawlCandidatesService(repo);
    await expect(service.reject('x', 'admin1', {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('reject: 성공 시 rejected 반환', async () => {
    const repo = makeRepo({
      reject: jest.fn().mockResolvedValue({
        outcome: 'rejected',
        candidate: candidate({ status: 'rejected' }),
      }),
    });
    const service = new CrawlCandidatesService(repo);
    await expect(service.reject('c1', 'admin1', { reason: 'spam' })).resolves.toEqual({
      candidateId: 'c1',
      status: 'rejected',
      registeredDiscountId: null,
    });
  });
});
