package com.finman.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finman.client.GeminiClient;
import com.finman.config.GeminiConfig;
import com.finman.entity.NewsArticle;
import com.finman.entity.NewsCategory;
import com.finman.entity.NewsSource;
import com.finman.entity.NewsSummary;
import com.finman.repository.NewsArticleRepository;
import com.finman.repository.NewsCategoryRepository;
import com.finman.repository.NewsSourceRepository;
import com.finman.repository.NewsSummaryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class NewsAiServiceTest {

    @Autowired
    private NewsSourceRepository sourceRepository;

    @Autowired
    private NewsCategoryRepository categoryRepository;

    @Autowired
    private NewsArticleRepository articleRepository;

    @Autowired
    private NewsSummaryRepository summaryRepository;

    private ObjectMapper objectMapper;
    private GeminiConfig geminiConfig;
    private NewsSource cafeFSource;
    private NewsCategory stockCategory;

    @BeforeEach
    void setUp() {
        summaryRepository.deleteAll();
        articleRepository.deleteAll();
        sourceRepository.deleteAll();
        categoryRepository.deleteAll();

        objectMapper = new ObjectMapper();
        geminiConfig = new GeminiConfig();
        geminiConfig.setModel("gemini-2.5-flash");

        cafeFSource = sourceRepository.save(new NewsSource(
                "CAFEF", "CafeF", "https://cafef.vn", "https://cafef.vn/rss", true
        ));
        stockCategory = categoryRepository.save(new NewsCategory(
                "STOCK", "Chứng khoán", "Tin tức thị trường chứng khoán", 1
        ));
    }

    @Test
    @DisplayName("TC_AIN_01, TC_AIN_03 & TC_AIN_04: Tóm tắt 3 ý chính, trích xuất mã FPT/HPG và caching 100% không gọi lại Gemini")
    void testSummarizeArticleExtractsThreeBulletsAndTickersWithDatabaseCaching() {
        NewsArticle article = articleRepository.save(new NewsArticle(
                cafeFSource,
                stockCategory,
                "Tập đoàn FPT và Hòa Phát đạt tổng lợi nhuận 15.000 tỷ đồng, tăng trưởng 22,5% trong quý III",
                "hash_ai_summary_01",
                "Kết quả kinh doanh quý III của FPT và Hòa Phát (HPG) ghi nhận mức tăng trưởng 22,5% so với cùng kỳ năm ngoái.",
                "Doanh thu mảng xuất khẩu phần mềm của FPT và sản lượng thép xây dựng của Hòa Phát đều vượt kế hoạch.",
                "https://cafef.vn/fpt-hpg-lai-lon-q3.chn",
                null,
                "CafeF",
                Instant.now()
        ));

        AtomicInteger geminiCallCount = new AtomicInteger(0);
        GeminiClient stubGeminiClient = (prompt, jsonMode) -> {
            geminiCallCount.incrementAndGet();
            assertThat(prompt).contains("<untrusted_external_news>");
            assertThat(prompt).contains("22,5%");
            return """
                    {
                      "bulletPoints": [
                        "Tập đoàn FPT và Hòa Phát công bố kết quả kinh doanh quý III bứt phá mạnh mẽ.",
                        "Tổng lợi nhuận đạt mốc 15.000 tỷ đồng, tăng trưởng 22,5% so với cùng kỳ.",
                        "Cổ phiếu nhóm công nghệ và thép thu hút dòng tiền tích cực từ nhà đầu tư."
                      ],
                      "sentiment": "POSITIVE",
                      "sentimentReason": "Lợi nhuận 15.000 tỷ đồng tăng 22,5% vượt kế hoạch đề ra.",
                      "impactAnalysis": "Cổ đông FPT và HPG hưởng lợi trực tiếp từ đà tăng trưởng lợi nhuận.",
                      "relatedTickers": ["FPT", "HPG"],
                      "tags": ["#chungkhoan", "#loinhuan"]
                    }
                    """;
        };

        NewsAiService newsAiService = new NewsAiService(
                stubGeminiClient, geminiConfig, articleRepository, summaryRepository, objectMapper
        );

        // Lần gọi thứ 1: Gọi Gemini API và lưu vào bảng news_summaries
        NewsSummary firstResult = newsAiService.summarizeArticle(article.getId());
        assertThat(geminiCallCount.get()).isEqualTo(1);
        assertThat(firstResult.getId()).isNotNull();
        assertThat(firstResult.getSentiment()).isEqualTo("POSITIVE");
        assertThat(firstResult.getRelatedTickers()).contains("FPT").contains("HPG");

        List<String> bullets = newsAiService.parseBulletPointsList(firstResult.getBulletPoints());
        assertThat(bullets).hasSize(3);
        assertThat(bullets.get(1)).contains("15.000 tỷ đồng");

        NewsArticle updatedArticle = articleRepository.findById(article.getId()).orElseThrow();
        assertThat(updatedArticle.getIsAiProcessed()).isTrue();

        // Lần gọi thứ 2: Lấy trực tiếp từ DB cache (< 10ms), tuyệt đối KHÔNG gọi lại Gemini API
        long startNs = System.nanoTime();
        NewsSummary cachedResult = newsAiService.summarizeArticle(article.getId());
        long elapsedMs = (System.nanoTime() - startNs) / 1_000_000;

        assertThat(geminiCallCount.get()).isEqualTo(1);
        assertThat(elapsedMs).isLessThan(10L);
        assertThat(cachedResult.getId()).isEqualTo(firstResult.getId());
    }

    @Test
    @DisplayName("Kiểm tra cơ chế Fallback tự động khi Gemini API gặp lỗi mạng hoặc vượt quota")
    void testSummarizeArticleFallbackWhenGeminiFails() {
        NewsArticle article = articleRepository.save(new NewsArticle(
                cafeFSource,
                stockCategory,
                "Vietcombank và Tập đoàn FPT ký kết thỏa thuận hợp tác chuyển đổi số toàn diện",
                "hash_ai_fallback_02",
                "Thỏa thuận giúp mở rộng hệ sinh thái ngân hàng số và dịch vụ đám mây doanh nghiệp.",
                "Nội dung chi tiết...",
                "https://cafef.vn/vcb-fpt-hop-tac.chn",
                null,
                "CafeF",
                Instant.now()
        ));

        GeminiClient failingClient = (prompt, jsonMode) -> {
            throw new RuntimeException("HTTP 429 Too Many Requests: Gemini quota exceeded");
        };

        NewsAiService newsAiService = new NewsAiService(
                failingClient, geminiConfig, articleRepository, summaryRepository, objectMapper
        );

        NewsSummary fallbackSummary = newsAiService.summarizeArticle(article.getId());
        assertThat(fallbackSummary).isNotNull();
        assertThat(fallbackSummary.getId()).isNotNull();

        List<String> bullets = newsAiService.parseBulletPointsList(fallbackSummary.getBulletPoints());
        assertThat(bullets).hasSize(3);
        assertThat(fallbackSummary.getRelatedTickers()).contains("VCB").contains("FPT");
        assertThat(fallbackSummary.getSentiment()).isIn("POSITIVE", "NEGATIVE", "NEUTRAL");
    }
}

