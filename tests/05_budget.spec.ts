import { test, expect } from '@playwright/test';
import { authenticateSession } from './fixtures/mock-api';

test.describe('5. Budget Management (Quản lý ngân sách đa ngưỡng)', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateSession(page, 'quan-ly-ngan-sach');
    await page.goto('/quan-ly-ngan-sach');
  });

  test('Hiển thị tổng quan ngân sách và hạn mức chi tiêu', async ({ page }) => {
    await expect(page.getByText('Hạn mức chi tiêu tổng thể')).toBeVisible();
    await expect(page.getByRole('button', { name: /Thiết lập ngân sách mới/i })).toBeVisible();
  });

  test('Hiển thị các danh mục ngân sách hoặc nút thiết lập ngân sách', async ({ page }) => {
    await expect(page.locator('#create-budget-btn')).toBeVisible();
    await expect(page.getByText(/Tháng hiện tại|Hạn mức chi tiêu tổng thể/i)).toBeVisible();
  });

  test('Mở modal "Thiết lập ngân sách mới"', async ({ page }) => {
    await page.locator('#create-budget-btn').click();

    // Check modal visibility
    const modal = page.locator('div[role="dialog"]').or(page.locator('.fixed.inset-0'));
    await expect(modal.first()).toBeVisible();

    // Check amount input
    const amountInput = page.getByPlaceholder(/0 ₫|Nhập số tiền/i).first();
    if (await amountInput.isVisible()) {
      await amountInput.fill('6000000');
    }

    // Close or cancel modal
    const closeBtn = page.getByRole('button', { name: /Hủy|Đóng/i }).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });
});
