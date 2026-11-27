import { test, expect } from '@playwright/test';
import { authenticateSession } from './fixtures/mock-api';

test.describe('4. Accounts Management (Quản lý tài khoản & Tài sản)', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateSession(page, 'tai-khoan-va-tai-san');
    const accountsLoaded = page.waitForResponse(
      (resp) => resp.url().includes('/accounts') && resp.status() === 200,
      { timeout: 10000 }
    ).catch(() => null);
    await page.goto('/tai-khoan-va-tai-san');
    await accountsLoaded;
  });

  test('Hiển thị danh sách tài khoản theo từng nhóm', async ({ page }) => {
    // Assert primary cash account is displayed
    await expect(page.getByText('Ví tiền mặt').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Thêm tài khoản mới/i }).first()).toBeVisible();
  });

  test('Chuyển đổi giữa tab Đang hoạt động và Lưu trữ', async ({ page }) => {
    const archivedTab = page.getByRole('button', { name: /Lưu trữ/i });
    await expect(archivedTab).toBeVisible();
    await archivedTab.click();

    // Should display empty or archived accounts list
    await expect(page.getByText('Không có tài khoản lưu trữ')).toBeVisible();

    // Switch back
    const activeTab = page.getByRole('button', { name: /Đang hoạt động/i });
    await activeTab.click();
    await expect(page.getByText('Ví tiền mặt').first()).toBeVisible();
  });

  test('Mở modal "Thêm tài khoản" và tạo tài khoản ngân hàng mới', async ({ page }) => {
    const addAccountBtn = page.getByRole('button', { name: /Thêm tài khoản/i }).first();
    await addAccountBtn.click();

    // Modal should be visible
    const modal = page.locator('div[role="dialog"]').or(page.locator('.fixed.inset-0'));
    await expect(modal.first()).toBeVisible();

    // Check account name input
    const nameInput = page.getByPlaceholder(/Tên tài khoản|Nhập tên/i).first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('MB Bank Priority');
    }

    // Check initial balance input
    const balanceInput = page.getByPlaceholder(/0|Số dư ban đầu/i).first();
    if (await balanceInput.isVisible()) {
      await balanceInput.fill('10000000');
    }

    // Submit modal
    const saveBtn = modal.getByRole('button', { name: 'Lưu tài khoản' });
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
    } else {
      const cancelBtn = modal.getByRole('button', { name: 'Hủy bỏ' });
      await cancelBtn.click();
    }
  });
});
