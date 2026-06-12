import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { getDb, cafes } from '@catch-coffee/db';
import { AppModule } from './app.module';
import { ResponseFormatInterceptor } from './common/interceptors/response-format.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

// DATABASE_URL 이 있을 때만 실행 (로컬은 skip, CI postgres 에서 실행).
const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

const PREFIX = '/api/v1';

describeDb('API e2e (DB 필요)', () => {
  let app: INestApplication;
  let cafeId: string;

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET ||= 'e2e-access-secret-at-least-32-characters';
    process.env.JWT_REFRESH_SECRET ||= 'e2e-refresh-secret-at-least-32-characters';
    process.env.ENCRYPTION_KEY ||= 'e2e-encryption-key-at-least-32-characters';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalInterceptors(new ResponseFormatInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    const [cafe] = await getDb()
      .insert(cafes)
      .values({ name: 'E2E 테스트 카페', lat: 37.5665, lng: 126.978 })
      .returning({ id: cafes.id });
    cafeId = cafe!.id;
  });

  afterAll(async () => {
    await app?.close();
  });

  function uniqueEmail(tag: string): string {
    return `e2e_${tag}_${Date.now()}_${Math.floor(Math.random() * 1e6)}@test.com`;
  }

  async function signup(tag: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post(`${PREFIX}/auth/signup`)
      .send({ email: uniqueEmail(tag), password: 'password123', name: tag })
      .expect(201);
    return res.body.data.accessToken as string;
  }

  it('회원가입 → 로그인 → /me 흐름', async () => {
    const email = uniqueEmail('flow');
    const signupRes = await request(app.getHttpServer())
      .post(`${PREFIX}/auth/signup`)
      .send({ email, password: 'password123', name: '플로우' })
      .expect(201);
    expect(signupRes.body.success).toBe(true);
    expect(signupRes.body.data.accessToken).toBeDefined();

    const loginRes = await request(app.getHttpServer())
      .post(`${PREFIX}/auth/login`)
      .send({ email, password: 'password123' })
      .expect(200);
    const token = loginRes.body.data.accessToken as string;

    const meRes = await request(app.getHttpServer())
      .get(`${PREFIX}/me`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(meRes.body.data.email).toBe(email);
  });

  it('인증 없이 /me 접근은 401', async () => {
    await request(app.getHttpServer()).get(`${PREFIX}/me`).expect(401);
  });

  it('제보 → 3인 확인 → 자동등록 → 카페 할인 노출', async () => {
    const reporter = await signup('reporter');

    const createRes = await request(app.getHttpServer())
      .post(`${PREFIX}/cafes/${cafeId}/reports`)
      .set('Authorization', `Bearer ${reporter}`)
      .send({
        title: '아메리카노 10% 할인',
        discountType: 'percentage',
        discountValue: 10,
        infoSource: 'offline',
        receiptImageUrl: 'https://example.com/receipt.jpg',
      })
      .expect(201);
    const reportId = createRes.body.data.id as string;

    // 서로 다른 3명이 확인 → 3번째에서 자동등록
    let lastBody: { status: string; autoRegistered: boolean } | undefined;
    for (let i = 0; i < 3; i += 1) {
      const confirmer = await signup(`confirmer${i}`);
      const res = await request(app.getHttpServer())
        .post(`${PREFIX}/reports/${reportId}/confirm`)
        .set('Authorization', `Bearer ${confirmer}`)
        .expect(200);
      lastBody = res.body.data;
    }

    expect(lastBody?.autoRegistered).toBe(true);
    expect(lastBody?.status).toBe('auto_registered');

    const discountsRes = await request(app.getHttpServer())
      .get(`${PREFIX}/cafes/${cafeId}/discounts`)
      .expect(200);
    const groups = discountsRes.body.data.discounts as Record<
      string,
      Array<{ title: string }>
    >;
    const titles = Object.values(groups)
      .flat()
      .map((d) => d.title);
    expect(titles).toContain('아메리카노 10% 할인');
  });

  it('본인 제보 확인은 400 (self-confirm 차단)', async () => {
    const reporter = await signup('selfreporter');
    const createRes = await request(app.getHttpServer())
      .post(`${PREFIX}/cafes/${cafeId}/reports`)
      .set('Authorization', `Bearer ${reporter}`)
      .send({
        title: '자기확인 테스트',
        discountType: 'amount',
        discountValue: 1000,
        infoSource: 'witnessed',
        receiptImageUrl: 'https://example.com/r2.jpg',
      })
      .expect(201);
    const reportId = createRes.body.data.id as string;

    await request(app.getHttpServer())
      .post(`${PREFIX}/reports/${reportId}/confirm`)
      .set('Authorization', `Bearer ${reporter}`)
      .expect(400);
  });
});
