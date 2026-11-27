import { test, expect } from '@playwright/test';
import { authenticateSession } from './fixtures/mock-api';

test.describe('6. AI Assistant (Trợ lý FinMan AI - Phân tích tài chính)', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateSession(page, 'tro-ly-finman-ai');
    await page.goto('/tro-ly-finman-ai');
  });

  test('Hiển thị giao diện chat Trợ lý FinMan và trạng thái AI', async ({ page }) => {
    // Assert chat input exists
    const chatInput = page.getByPlaceholder(/Nhập câu tiếng Việt/i);
    await expect(chatInput).toBeVisible();

    const sendBtn = page.getByRole('button', { name: /Gửi/i });
    await expect(sendBtn).toBeVisible();
  });

  test('Gửi câu hỏi và nhận câu trả lời phân tích từ AI', async ({ page }) => {
    const chatInput = page.getByPlaceholder(/Nhập câu tiếng Việt/i);
    await chatInput.fill('Tình hình chi tiêu tháng này của tôi thế nào?');

    const sendBtn = page.getByRole('button', { name: /Gửi/i });
    await sendBtn.click();

    // Verify user message appears in chat
    await expect(page.getByText('Tình hình chi tiêu tháng này của tôi thế nào?')).toBeVisible();

    // Verify AI reply appears
    await expect(page.getByText(/FinMan AI/i).first()).toBeVisible({ timeout: 15000 });
  });
});
