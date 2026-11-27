import { test, expect } from '@playwright/test';
import { authenticateSession } from './fixtures/mock-api';

test.describe('7. Statistics & Reports (Thống kê & Báo cáo dòng tiền)', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateSession(page, 'thong-ke-va-bao-cao');
    await page.goto('/thong-ke-va-bao-cao');
  });

  test('Hiển thị trang thống kê với biểu đồ và lịch chi tiêu', async ({ page }) => {
    // Assert calendar days header
    await expect(page.locator('span').filter({ hasText: /^T2$/ })).toBeVisible();
    await expect(page.locator('span').filter({ hasText: /^T3$/ })).toBeVisible();
    await expect(page.locator('span').filter({ hasText: /^CN$/ })).toBeVisible();
  });

  test('Hiển thị cơ cấu chi tiêu theo danh mục', async ({ page }) => {
    // Breakdown categories should be visible
    await expect(page.getByText(/Ăn uống|Mua sắm|Lương chính/i).first()).toBeVisible();
  });
});
