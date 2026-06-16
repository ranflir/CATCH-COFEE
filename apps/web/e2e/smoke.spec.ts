import { expect, test } from '@playwright/test';

const API_URL = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:3000';
const PASSWORD = 'Password123!';

test.describe('Catch Coffee smoke', () => {
  test('login → cafes list', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'demo@catch.coffee');
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/cafes');
    await expect(page.getByRole('heading', { name: '주변 카페' })).toBeVisible();
  });

  test('seller discount CRUD', async ({ request }) => {
    const loginRes = await request.post(`${API_URL}/api/v1/auth/login`, {
      data: { email: 'seller@catch.coffee', password: PASSWORD },
    });
    expect(loginRes.ok()).toBeTruthy();
    const { data } = await loginRes.json();
    const token = data.accessToken as string;

    const createRes = await request.post(`${API_URL}/api/v1/cafes/seed_cafe_1/discounts`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: 'E2E 테스트 할인',
        discountType: 'percentage',
        discountValue: 5,
        targetScope: 'all',
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const created = (await createRes.json()).data;
    const discountId = created.id as string;

    const patchRes = await request.patch(`${API_URL}/api/v1/discounts/${discountId}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'E2E 수정 할인', status: 'hidden' },
    });
    expect(patchRes.ok()).toBeTruthy();

    const deleteRes = await request.delete(`${API_URL}/api/v1/discounts/${discountId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(deleteRes.ok()).toBeTruthy();
  });

  test('report form page loads', async ({ page }) => {
    await page.goto('/reports/new?cafeId=seed_cafe_1');
    await expect(page.getByRole('heading', { name: '할인 제보' })).toBeVisible();
  });
});
