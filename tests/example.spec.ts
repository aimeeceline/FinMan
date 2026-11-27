import { test, expect } from '@playwright/test';

test.describe('FinMan App Smoke Test', () => {
  test('Khởi động ứng dụng và kiểm tra tiêu đề', async ({ page }) => {
    await page.goto('/');

    // Page title or main branding
    await expect(page).toHaveTitle(/FinMan|Vite/i);
    await expect(page.getByText('Quản lý tài chính cá nhân thông minh')).toBeVisible();
  });
});
