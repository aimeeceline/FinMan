import { test, expect } from '@playwright/test';
import { authenticateSession, TEST_USER } from './fixtures/mock-api';

test.describe('8. Settings & Categories (Cài đặt & Danh mục & Thùng rác)', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateSession(page, 'cai-dat-va-danh-muc');
    await page.goto('/cai-dat-va-danh-muc');
  });

  test('Hiển thị tab Hồ sơ cá nhân với thông tin người dùng', async ({ page }) => {
    await expect(page.getByText('Hồ sơ cá nhân').first()).toBeVisible();
    await expect(page.getByText(TEST_USER.email).first()).toBeVisible();
  });

  test('Chuyển sang tab "Bảo mật & Mật khẩu"', async ({ page }) => {
    const securityTab = page.getByRole('button', { name: /Bảo mật & Mật khẩu/i });
    await securityTab.click();

    // Check security fields
    await expect(page.getByText(/Mật khẩu hiện tại|Đổi mật khẩu/i).first()).toBeVisible();
  });

  test('Chuyển sang tab "Danh mục thu chi" và kiểm tra danh mục', async ({ page }) => {
    const categoriesTab = page.getByRole('button', { name: /Danh mục thu chi/i });
    await categoriesTab.click();

    // Verify categories from mock
    await expect(page.getByText('Ăn uống').first()).toBeVisible();
    await expect(page.getByText('Mua sắm').first()).toBeVisible();

    // Check "Thêm danh mục" button
    const addCategoryBtn = page.getByRole('button', { name: /Thêm danh mục|Tạo danh mục/i }).first();
    if (await addCategoryBtn.isVisible()) {
      await addCategoryBtn.click();
      const modal = page.locator('div[role="dialog"]').or(page.locator('.fixed.inset-0'));
      await expect(modal.first()).toBeVisible();
    }
  });

  test('Chuyển sang tab "Thùng rác" và hiển thị các bộ lọc thùng rác', async ({ page }) => {
    const binTab = page.getByRole('button', { name: /Thùng rác/i });
    await binTab.click();

    // Verify recycle bin controls are visible
    await expect(page.getByRole('button', { name: /Dọn sạch thùng rác/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Làm mới/i })).toBeVisible();
  });
});
