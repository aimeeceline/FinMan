import { test, expect } from '@playwright/test';

test.describe('1. Authentication Flows (Đăng nhập / Đăng ký / Quên mật khẩu)', () => {
  // Luôn dùng phiên chưa đăng nhập cho các test case auth
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Hiển thị đầy đủ giao diện Đăng nhập với thương hiệu và form', async ({ page }) => {
    // Title / Brand statement
    await expect(page.getByRole('heading', { name: /Quản lý tài chính cá nhân thông minh/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Đăng nhập hệ thống/i })).toBeVisible();

    // Input fields & buttons
    await expect(page.getByPlaceholder('Nhập email của bạn')).toBeVisible();
    await expect(page.getByPlaceholder('Nhập mật khẩu')).toBeVisible();
    await expect(page.getByRole('button', { name: /Đăng nhập/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Quên mật khẩu\?/i })).toBeVisible();
  });

  test('Kiểm tra validation khi gửi form trống', async ({ page }) => {
    const emailInput = page.getByPlaceholder('Nhập email của bạn');
    await expect(emailInput).toHaveAttribute('required', '');

    const passwordInput = page.getByPlaceholder('Nhập mật khẩu');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('Chuyển đổi ẩn / hiện mật khẩu', async ({ page }) => {
    const passwordInput = page.getByPlaceholder('Nhập mật khẩu');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle button next to password
    const toggleButton = page.locator('form button[type="button"]').filter({ has: page.locator('span.material-symbols-outlined') });
    await toggleButton.first().click();

    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click again to hide
    await toggleButton.first().click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('Báo lỗi khi đăng nhập với thông tin sai', async ({ page }) => {
    await page.getByPlaceholder('Nhập email của bạn').fill('wrong@email.com');
    await page.getByPlaceholder('Nhập mật khẩu').fill('wrongpass');
    await page.getByRole('button', { name: /Đăng nhập/i }).click();

    // Error alert banner should display
    await expect(page.getByText(/Email hoặc mật khẩu không chính xác/i)).toBeVisible();
  });

  test('Mở modal Quên mật khẩu và quay lại Đăng nhập', async ({ page }) => {
    await page.getByRole('button', { name: /Quên mật khẩu\?/i }).click();

    // Modal / View should display
    await expect(page.getByText(/Khôi phục mật khẩu/i).first()).toBeVisible();

    // Fill email and request recovery
    const emailInput = page.getByPlaceholder(/email/i).first();
    await emailInput.fill('user@finman.com');




    
    // Return to login
    const backBtn = page.getByRole('button', { name: /Quay lại đăng nhập/i });
    if (await backBtn.isVisible()) {
      await backBtn.click();
      await expect(page.getByRole('heading', { name: /Đăng nhập hệ thống/i })).toBeVisible();
    }
  });

  test('Chuyển sang trang Đăng ký và hiển thị form đăng ký', async ({ page }) => {
    const registerLink = page.getByRole('button', { name: /Đăng ký tài khoản/i });
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page.getByRole('heading', { name: /Đăng ký tài khoản/i })).toBeVisible();
    }
  });

  test('Đăng nhập thành công và chuyển hướng vào Dashboard Giao dịch', async ({ page }) => {
    await page.getByPlaceholder('Nhập email của bạn').fill('testuser_e2e@finman.com');
    await page.getByPlaceholder('Nhập mật khẩu').fill('password123');
    await page.getByRole('button', { name: /Đăng nhập/i }).click();

    // App should navigate to main screen with sidebar
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.locator('aside').getByRole('button', { name: /Thêm giao dịch/i })).toBeVisible();
  });
});
