import { test, expect } from '@playwright/test';
import { authenticateSession } from './fixtures/mock-api';

test.describe('9. Financial News Dashboard & Article Modal (Tin tức tài chính & Đọc bài)', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateSession(page, 'tin-tuc-tai-chinh');
    await page.goto('/tin-tuc-tai-chinh');
  });

  test('Hiển thị giao diện Tin tức tài chính với đầy đủ tiêu đề và bộ lọc', async ({ page }) => {
    // Assert Hero Header
    await expect(page.getByRole('heading', { name: /Tin Tức & Thị Trường Tài Chính/i })).toBeVisible();

    // Assert Category chips
    const categoryBar = page.getByTestId('news-category-chips');
    await expect(categoryBar).toBeVisible();
    await expect(page.getByTestId('category-chip-ALL')).toBeVisible();
    await expect(page.getByTestId('category-chip-STOCK')).toBeVisible();
    await expect(page.getByTestId('category-chip-BANKING')).toBeVisible();

    // Assert Search & Source filter
    await expect(page.getByTestId('news-search-input')).toBeVisible();
    await expect(page.getByTestId('news-source-select')).toBeVisible();

    // Assert Tabs "Tất cả bản tin" & "Đã lưu"
    await expect(page.getByTestId('tab-all-news')).toBeVisible();
    await expect(page.getByTestId('tab-saved-news')).toBeVisible();
  });

  test('Lọc danh mục bằng cách nhấn vào chip danh mục ngang', async ({ page }) => {
    // Click category "Chứng khoán"
    const stockChip = page.getByTestId('category-chip-STOCK');
    await stockChip.click();

    // Verify chip is active (has primary background)
    await expect(stockChip).toHaveClass(/bg-primary/);

    // Verify news cards exist
    const cardsGrid = page.getByTestId('news-cards-grid');
    await expect(cardsGrid).toBeVisible();
  });

  test('Tìm kiếm tin tức bằng từ khóa', async ({ page }) => {
    const searchInput = page.getByTestId('news-search-input');
    await searchInput.fill('FPT');

    // Wait for debounced search
    await page.waitForTimeout(400);

    const cardsGrid = page.getByTestId('news-cards-grid');
    await expect(cardsGrid).toBeVisible();
    await expect(page.locator('article').first()).toContainText(/FPT/i);
  });

  test('Mở Modal xem chi tiết bài báo sạch và kiểm tra khối tóm tắt AI', async ({ page }) => {
    // Click on the first article card
    const firstCard = page.locator('article').first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    // Verify modal is open
    const modal = page.getByTestId('news-detail-modal');
    await expect(modal).toBeVisible();

    // Verify AI summary card exists inside modal
    const aiSummary = modal.getByTestId('modal-ai-summary-card');
    await expect(aiSummary).toBeVisible();
    await expect(aiSummary).toContainText(/FinMan AI/i);

    // Verify link to original article
    await expect(modal.getByTestId('modal-original-url-link')).toBeVisible();

    // Close modal
    await modal.getByTestId('modal-close-btn').click();
    await expect(modal).not.toBeVisible();
  });

  test('Lưu bài viết và kiểm tra hiển thị trong tab "Đã lưu"', async ({ page }) => {
    // Find the first bookmark button on a news card
    const firstSaveBtn = page.locator('button[data-testid^="save-article-btn-"]').first();
    await expect(firstSaveBtn).toBeVisible();
    await firstSaveBtn.click();

    // Switch to "Đã lưu" tab
    await page.getByTestId('tab-saved-news').click();

    // Verify saved article list is shown
    await expect(page.getByTestId('news-cards-grid')).toBeVisible();
    const savedCards = page.locator('article');
    expect(await savedCards.count()).toBeGreaterThan(0);
  });
});

