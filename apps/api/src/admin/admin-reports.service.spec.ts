import { ConflictException, NotFoundException } from '@nestjs/common';
import type { DiscountReport } from '@catch-coffee/db';
import { AdminReportsService } from './admin-reports.service';
import type { ReportsRepository, ReviewOutcome } from '../reports/reports.repository';

function report(partial: Partial<DiscountReport> = {}): DiscountReport {
  return {
    id: 'r1',
    status: 'approved',
    registeredDiscountId: null,
    ...partial,
  } as unknown as DiscountReport;
}

describe('AdminReportsService', () => {
  let reports: jest.Mocked<Pick<ReportsRepository, 'approve' | 'reject'>>;
  let service: AdminReportsService;

  beforeEach(() => {
    reports = { approve: jest.fn(), reject: jest.fn() };
    service = new AdminReportsService(reports as unknown as ReportsRepository);
  });

  it('approve: approved → discountId 반환', async () => {
    reports.approve.mockResolvedValue({
      outcome: 'approved',
      report: report({ status: 'approved' }),
      discountId: 'disc1',
    } as ReviewOutcome);
    const res = await service.approve('r1', 'admin1');
    expect(res).toEqual({
      reportId: 'r1',
      status: 'approved',
      registeredDiscountId: 'disc1',
    });
  });

  it('approve: not_found → NotFoundException', async () => {
    reports.approve.mockResolvedValue({ outcome: 'not_found' } as ReviewOutcome);
    await expect(service.approve('r1', 'admin1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('approve: closed → ConflictException', async () => {
    reports.approve.mockResolvedValue({
      outcome: 'closed',
      report: report(),
    } as ReviewOutcome);
    await expect(service.approve('r1', 'admin1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('reject: rejected → status 반환', async () => {
    reports.reject.mockResolvedValue({
      outcome: 'rejected',
      report: report({ status: 'rejected' }),
    } as ReviewOutcome);
    const res = await service.reject('r1', 'admin1', '사유');
    expect(res.status).toBe('rejected');
  });

  it('reject: closed → ConflictException', async () => {
    reports.reject.mockResolvedValue({
      outcome: 'closed',
      report: report(),
    } as ReviewOutcome);
    await expect(service.reject('r1', 'admin1', '사유')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
