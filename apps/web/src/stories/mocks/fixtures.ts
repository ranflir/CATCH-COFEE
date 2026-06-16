import type { AdminReport, OwnedCafe, SellerDiscount } from '@/lib/user-profile';

export const mockCafes: OwnedCafe[] = [
  { id: 'seed_cafe_1', name: '메가커피 강남역점', address: '서울 강남구 강남대로 396' },
  { id: 'seed_cafe_2', name: '컴포즈커피 홍대입구점', address: '서울 마포구 양화로 160' },
];

export const mockDiscounts: SellerDiscount[] = [
  {
    id: 'seed_discount_1',
    cafeId: 'seed_cafe_1',
    title: '아메리카노 10% 할인',
    discountType: 'percentage',
    discountValue: '10',
    targetScope: 'all',
    status: 'active',
  },
];

export const mockReports: AdminReport[] = [
  {
    id: 'seed_report_pending',
    cafeId: 'seed_cafe_3',
    reporterId: 'seed_user_demo',
    title: '빽다방 시청점 2+1 이벤트',
    discountType: 'percentage',
    discountValue: '50',
    infoSource: 'receipt',
    receiptImageUrl: 'https://example.com/seed-receipt.jpg',
    status: 'pending',
    confirmCount: 0,
    createdAt: new Date().toISOString(),
  },
];

export const mockCrawlCandidates = [
  {
    id: 'seed_crawl_candidate_1',
    sourceId: 'seed_crawl_source_1',
    cafeId: 'seed_cafe_1',
    rawText: '메가커피 아메리카노 1000원 할인 이벤트',
    parsed: { title: '아메리카노 1000원 할인', discountType: 'amount', discountValue: 1000 },
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
