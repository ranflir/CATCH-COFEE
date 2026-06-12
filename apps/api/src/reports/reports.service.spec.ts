import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { DiscountReport } from '@catch-coffee/db';
import { ReportsService } from './reports.service';
import type { ReportsRepository, ConfirmOutcome } from './reports.repository';
import type { CafesRepository } from '../cafes/cafes.repository';
import type { JwtPayload } from '../common/types/jwt-payload.type';

const user: JwtPayload = { id: 'u1', role: 'user' };

function report(partial: Partial<DiscountReport> = {}): DiscountReport {
  return {
    id: 'r1',
    status: 'pending',
    confirmCount: 1,
    ...partial,
  } as unknown as DiscountReport;
}

describe('ReportsService.confirm 결과 매핑', () => {
  let reports: jest.Mocked<Pick<ReportsRepository, 'confirm'>>;
  let service: ReportsService;

  beforeEach(() => {
    reports = { confirm: jest.fn() };
    service = new ReportsService(
      reports as unknown as ReportsRepository,
      {} as unknown as CafesRepository,
    );
  });

  it('not_found → NotFoundException', async () => {
    reports.confirm.mockResolvedValue({ outcome: 'not_found' } as ConfirmOutcome);
    await expect(service.confirm('r1', user)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('self → BadRequestException', async () => {
    reports.confirm.mockResolvedValue({ outcome: 'self' } as ConfirmOutcome);
    await expect(service.confirm('r1', user)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('closed → ConflictException', async () => {
    reports.confirm.mockResolvedValue({ outcome: 'closed' } as ConfirmOutcome);
    await expect(service.confirm('r1', user)).rejects.toBeInstanceOf(ConflictException);
  });

  it('added → confirmCount 반영된 뷰 반환', async () => {
    reports.confirm.mockResolvedValue({
      outcome: 'added',
      report: report({ confirmCount: 2 }),
    } as ConfirmOutcome);
    const view = await service.confirm('r1', user);
    expect(view).toEqual({
      reportId: 'r1',
      status: 'pending',
      confirmCount: 2,
      autoRegistered: false,
    });
  });

  it('auto_registered → autoRegistered=true', async () => {
    reports.confirm.mockResolvedValue({
      outcome: 'auto_registered',
      report: report({ status: 'auto_registered', confirmCount: 3 }),
    } as ConfirmOutcome);
    const view = await service.confirm('r1', user);
    expect(view.autoRegistered).toBe(true);
    expect(view.status).toBe('auto_registered');
  });
});
