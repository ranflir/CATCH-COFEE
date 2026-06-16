import { http, HttpResponse } from 'msw';
import type { SellerDiscount } from '@/lib/user-profile';
import {
  mockCafes,
  mockCrawlCandidates,
  mockDiscounts,
  mockReports,
} from './fixtures';

function ok<T>(data: T) {
  return HttpResponse.json({ success: true, data });
}

const discounts = [...mockDiscounts];
let reports = [...mockReports];
let crawlCandidates = [...mockCrawlCandidates];

export const handlers = [
  http.get('*/api/v1/me/cafes', () => ok(mockCafes)),

  http.get('*/api/v1/cafes/:cafeId/discounts/manage', ({ params }) =>
    ok(discounts.filter((d) => d.cafeId === params.cafeId)),
  ),

  http.post('*/api/v1/cafes/:cafeId/discounts', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const created: SellerDiscount = {
      id: `discount_${Date.now()}`,
      cafeId: String(params.cafeId),
      title: String(body.title),
      discountType: body.discountType as SellerDiscount['discountType'],
      discountValue: String(body.discountValue),
      targetScope: (body.targetScope as SellerDiscount['targetScope']) ?? 'all',
      status: 'active',
    };
    discounts.unshift(created);
    return ok(created);
  }),

  http.patch('*/api/v1/discounts/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const idx = discounts.findIndex((d) => d.id === params.id);
    if (idx < 0) {
      return HttpResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });
    }
    discounts[idx] = {
      ...discounts[idx]!,
      ...body,
      discountValue:
        body.discountValue != null ? String(body.discountValue) : discounts[idx]!.discountValue,
    } as SellerDiscount;
    return ok(discounts[idx]);
  }),

  http.delete('*/api/v1/discounts/:id', ({ params }) => {
    const idx = discounts.findIndex((d) => d.id === params.id);
    if (idx >= 0) discounts.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('*/api/v1/admin/reports', () => ok(reports)),

  http.post('*/api/v1/admin/reports/:id/approve', ({ params }) => {
    reports = reports.filter((r) => r.id !== params.id);
    return ok({ reportId: params.id, status: 'approved', registeredDiscountId: 'new_discount' });
  }),

  http.post('*/api/v1/admin/reports/:id/reject', ({ params }) => {
    reports = reports.filter((r) => r.id !== params.id);
    return ok({ reportId: params.id, status: 'rejected', registeredDiscountId: null });
  }),

  http.get('*/api/v1/admin/crawl-candidates', () => ok(crawlCandidates)),

  http.post('*/api/v1/admin/crawl-candidates/:id/approve', ({ params }) => {
    crawlCandidates = crawlCandidates.filter((c) => c.id !== params.id);
    return ok({ candidateId: params.id, status: 'approved', registeredDiscountId: 'crawl_discount_1' });
  }),

  http.post('*/api/v1/admin/crawl-candidates/:id/reject', ({ params }) => {
    crawlCandidates = crawlCandidates.filter((c) => c.id !== params.id);
    return ok({ candidateId: params.id, status: 'rejected', registeredDiscountId: null });
  }),
];
