import { eq } from 'drizzle-orm';
import {
  getDb,
  brands,
  cafes,
  discounts,
  users,
  discountReports,
  crawlSources,
  crawlCandidates,
} from './index';

/** 개발/테스트 계정 공통 비밀번호: Password123! */
const DEV_PASSWORD_HASH =
  '$2a$12$IQ5h5401z7rHIU6OSKISX.SNZd29PlHMDauHjrapJn0tJfupv4uG.';

/**
 * 개발/테스트용 시드 데이터. 고정 id + onConflictDoNothing 으로 멱등.
 * 실행: DATABASE_URL=... node dist/seed.js
 */
async function seed(): Promise<void> {
  const db = getDb();

  const userRows = [
    {
      id: 'seed_user_demo',
      email: 'demo@catch.coffee',
      passwordHash: DEV_PASSWORD_HASH,
      name: '데모 사용자',
      role: 'user' as const,
    },
    {
      id: 'seed_user_seller',
      email: 'seller@catch.coffee',
      passwordHash: DEV_PASSWORD_HASH,
      name: '테스트 셀러',
      role: 'seller' as const,
    },
    {
      id: 'seed_user_admin',
      email: 'admin@catch.coffee',
      passwordHash: DEV_PASSWORD_HASH,
      name: '테스트 관리자',
      role: 'admin' as const,
    },
  ];
  await db.insert(users).values(userRows).onConflictDoNothing({ target: users.id });

  const brandRows = [
    { id: 'seed_brand_mega', name: '메가커피', slug: 'mega', isLowCost: true },
    { id: 'seed_brand_compose', name: '컴포즈커피', slug: 'compose', isLowCost: true },
    { id: 'seed_brand_paik', name: '빽다방', slug: 'paik', isLowCost: true },
  ];
  await db.insert(brands).values(brandRows).onConflictDoNothing({ target: brands.id });

  const cafeRows = [
    {
      id: 'seed_cafe_1',
      brandId: 'seed_brand_mega',
      ownerId: 'seed_user_seller',
      name: '메가커피 강남역점',
      address: '서울 강남구 강남대로 396',
      lat: 37.4979,
      lng: 127.0276,
      kakaoPlaceId: 'seed-place-1',
    },
    {
      id: 'seed_cafe_2',
      brandId: 'seed_brand_compose',
      ownerId: 'seed_user_seller',
      name: '컴포즈커피 홍대입구점',
      address: '서울 마포구 양화로 160',
      lat: 37.5572,
      lng: 126.9245,
      kakaoPlaceId: 'seed-place-2',
    },
    {
      id: 'seed_cafe_3',
      brandId: 'seed_brand_paik',
      name: '빽다방 시청점',
      address: '서울 중구 세종대로 110',
      lat: 37.5663,
      lng: 126.9779,
      kakaoPlaceId: 'seed-place-3',
    },
    {
      id: 'seed_cafe_4',
      brandId: null,
      name: '동네 개인카페 라떼하우스',
      address: '서울 강남구 테헤란로 152',
      lat: 37.5006,
      lng: 127.0366,
      kakaoPlaceId: 'seed-place-4',
    },
  ];
  await db.insert(cafes).values(cafeRows).onConflictDoNothing({ target: cafes.id });
  await db
    .update(cafes)
    .set({ ownerId: 'seed_user_seller' })
    .where(eq(cafes.id, 'seed_cafe_1'));
  await db
    .update(cafes)
    .set({ ownerId: 'seed_user_seller' })
    .where(eq(cafes.id, 'seed_cafe_2'));

  const discountRows = [
    {
      id: 'seed_discount_1',
      cafeId: 'seed_cafe_1',
      source: 'seller' as const,
      title: '아메리카노 10% 할인',
      discountType: 'percentage' as const,
      discountValue: '10',
      status: 'active' as const,
    },
    {
      id: 'seed_discount_2',
      cafeId: 'seed_cafe_2',
      source: 'seller' as const,
      title: '전 음료 1500원 할인',
      discountType: 'amount' as const,
      discountValue: '1500',
      status: 'active' as const,
    },
    {
      id: 'seed_discount_3',
      cafeId: 'seed_cafe_3',
      source: 'seller' as const,
      title: '신메뉴 20% 할인',
      discountType: 'percentage' as const,
      discountValue: '20',
      status: 'active' as const,
    },
    {
      id: 'seed_discount_4',
      cafeId: 'seed_cafe_4',
      source: 'seller' as const,
      title: '아이스 아메리카노 500원 할인',
      discountType: 'amount' as const,
      discountValue: '500',
      status: 'active' as const,
    },
  ];
  await db
    .insert(discounts)
    .values(discountRows)
    .onConflictDoNothing({ target: discounts.id });

  const reportRows = [
    {
      id: 'seed_report_pending',
      cafeId: 'seed_cafe_3',
      reporterId: 'seed_user_demo',
      title: '빽다방 시청점 2+1 이벤트',
      discountType: 'percentage' as const,
      discountValue: '50',
      infoSource: 'receipt' as const,
      receiptImageUrl: 'https://example.com/seed-receipt.jpg',
      status: 'pending' as const,
    },
  ];
  await db
    .insert(discountReports)
    .values(reportRows)
    .onConflictDoNothing({ target: discountReports.id });

  const crawlSourceRows = [
    {
      id: 'seed_crawl_source_1',
      brandId: 'seed_brand_mega',
      channel: 'website' as const,
      url: 'https://example.com/mega/events',
    },
  ];
  await db
    .insert(crawlSources)
    .values(crawlSourceRows)
    .onConflictDoNothing({ target: crawlSources.id });

  const crawlCandidateRows = [
    {
      id: 'seed_crawl_candidate_1',
      sourceId: 'seed_crawl_source_1',
      cafeId: 'seed_cafe_1',
      rawText: '메가커피 아메리카노 1000원 할인 이벤트 (3월 한정)',
      parsed: {
        title: '아메리카노 1000원 할인',
        discountType: 'amount',
        discountValue: 1000,
      },
      status: 'pending' as const,
    },
  ];
  await db
    .insert(crawlCandidates)
    .values(crawlCandidateRows)
    .onConflictDoNothing({ target: crawlCandidates.id });

  console.log(
    `seed done: ${userRows.length} users, ${brandRows.length} brands, ${cafeRows.length} cafes, ${discountRows.length} discounts, ${reportRows.length} reports, ${crawlCandidateRows.length} crawl candidates`,
  );
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('seed failed:', err);
    process.exit(1);
  });
