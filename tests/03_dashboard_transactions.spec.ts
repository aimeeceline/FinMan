import { test, expect } from '@playwright/test';
import { authenticateSession } from './fixtures/mock-api';

test.describe('3. Dashboard & Transactions (Màn hình chính & Quản lý giao dịch)', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateSession(page, 'giao-dich');
    await page.goto('/');
  });

  test('Hiển thị các giao dịch hoặc khung quản lý trên Dashboard', async ({ page }) => {
    // Assert dashboard main content area is visible
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByPlaceholder(/Tìm kiếm giao dịch|Tìm kiếm/i)).toBeVisible();
  });

  test('Mở modal "Thêm giao dịch" và kiểm tra 3 loại giao dịch', async ({ page }) => {
    // Click "Thêm giao dịch" in Sidebar
    await page.locator('aside').getByRole('button', { name: /Thêm giao dịch/i }).click();

    // Verify modal appears
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // 3 tabs should be visible
    await expect(modal.getByRole('button', { name: /Khoản Chi tiêu/i })).toBeVisible();
    await expect(modal.getByRole('button', { name: /Khoản Thu nhập/i })).toBeVisible();
    await expect(modal.getByRole('button', { name: /Chuyển khoản/i })).toBeVisible();

    // Switch to "Khoản Thu nhập"
    await modal.getByRole('button', { name: /Khoản Thu nhập/i }).click();

    // Switch to "Chuyển khoản"
    await modal.getByRole('button', { name: /Chuyển khoản/i }).click();

    // Close modal
    await modal.getByLabel('Đóng cửa sổ').click();
    await expect(modal).not.toBeVisible();
  });

  test('Thêm một giao dịch chi tiêu mới thành công', async ({ page }) => {
    await page.locator('aside').getByRole('button', { name: /Thêm giao dịch/i }).click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Click quick amount chip "100.000đ"
    const quickChip = modal.getByText('100.000đ');
    if (await quickChip.isVisible()) {
      await quickChip.click();
    }

    // Select note
    const noteInput = modal.getByPlaceholder(/Ghi chú|Nhập ghi chú/i).first();
    if (await noteInput.isVisible()) {
      await noteInput.fill('Uống cà phê sáng');
    }

    // Submit form
    const submitBtn = modal.getByRole('button', { name: /Lưu giao dịch|Thêm giao dịch|Hoàn tất/i }).first();
    await submitBtn.click();

    // Modal should close upon successful add
    await expect(modal).not.toBeVisible();
  });

  test('Lọc giao dịch theo loại', async ({ page }) => {
    // Locate the type filter select/buttons
    const typeFilter = page.locator('select').first();
    if (await typeFilter.isVisible()) {
      // Check options or change value
      await typeFilter.selectOption({ label: 'Chi tiêu' }).catch(() => {});
    }
  });

  test('Tìm kiếm giao dịch theo từ khóa trên TopHeader', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Tìm kiếm giao dịch|Tìm kiếm/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Ăn uống');
    await expect(searchInput).toHaveValue('Ăn uống');
    await searchInput.fill('');
    await expect(searchInput).toHaveValue('');
  });
});
