import { test, expect } from '@playwright/test';
import { authenticateSession, TEST_USER } from './fixtures/mock-api';

test.describe('2. Navigation & Sidebar (Điều hướng & Chuyển trang)', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateSession(page, 'giao-dich');
    await page.goto('/');
  });

  test('Hiển thị đầy đủ 6 menu chính trên Sidebar', async ({ page }) => {
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    const nav = sidebar.locator('nav');
    await expect(nav.getByRole('button', { name: /Giao dịch/i })).toBeVisible();
    await expect(nav.getByRole('button', { name: /Thống kê - Báo cáo/i })).toBeVisible();
    await expect(nav.getByRole('button', { name: /Ngân sách/i })).toBeVisible();
    await expect(nav.getByRole('button', { name: /Tài khoản/i })).toBeVisible();
    await expect(nav.getByRole('button', { name: /Trợ lý FinMan/i })).toBeVisible();
    await expect(nav.getByRole('button', { name: /Cài đặt/i })).toBeVisible();
  });

  test('Hiển thị thông tin người dùng ở chân Sidebar', async ({ page }) => {
    const sidebar = page.locator('aside');
    await expect(sidebar.getByText(TEST_USER.fullName)).toBeVisible();
    await expect(sidebar.getByText(TEST_USER.email)).toBeVisible();
  });

  test('Điều hướng qua từng trang và kiểm tra URL', async ({ page }) => {
    const sidebar = page.locator('aside');
    const nav = sidebar.locator('nav');

    // 1. Thống kê - Báo cáo
    await nav.getByRole('button', { name: /Thống kê - Báo cáo/i }).click();
    await expect(page).toHaveURL(/.*thong-ke-va-bao-cao/);

    // 2. Ngân sách
    await nav.getByRole('button', { name: /Ngân sách/i }).click();
    await expect(page).toHaveURL(/.*quan-ly-ngan-sach/);

    // 3. Tài khoản
    await nav.getByRole('button', { name: /Tài khoản/i }).click();
    await expect(page).toHaveURL(/.*tai-khoan-va-tai-san/);

    // 4. Trợ lý FinMan
    await nav.getByRole('button', { name: /Trợ lý FinMan/i }).click();
    await expect(page).toHaveURL(/.*tro-ly-finman-ai/);

    // 5. Cài đặt
    await nav.getByRole('button', { name: /Cài đặt/i }).click();
    await expect(page).toHaveURL(/.*cai-dat-va-danh-muc/);

    // 6. Quay lại Giao dịch
    await nav.getByRole('button', { name: /Giao dịch/i }).click();
    await expect(page).toHaveURL(/\/(giao-dich)?$/);
  });

  test('Đăng xuất thành công và quay lại màn hình Đăng nhập', async ({ page }) => {
    const sidebar = page.locator('aside');
    const logoutBtn = sidebar.getByTitle('Đăng xuất');
    await logoutBtn.click();

    // Verify returning to login page
    await expect(page.getByRole('heading', { name: /Đăng nhập hệ thống/i })).toBeVisible();
    await expect(sidebar).not.toBeVisible();
  });
});
