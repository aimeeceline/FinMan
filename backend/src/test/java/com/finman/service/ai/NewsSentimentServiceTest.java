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
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class NewsSentimentServiceTest {

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
    private NewsSource vnExpressSource;
    private NewsCategory bankingCategory;

    @BeforeEach
    void setUp() {
        summaryRepository.deleteAll();
        articleRepository.deleteAll();
        sourceRepository.deleteAll();
        categoryRepository.deleteAll();

        objectMapper = new ObjectMapper();
        geminiConfig = new GeminiConfig();
        geminiConfig.setModel("gemini-2.5-flash");

        vnExpressSource = sourceRepository.save(new NewsSource(
                "VNEXPRESS", "VnExpress Kinh Doanh", "https://vnexpress.net", "https://vnexpress.net/rss", true
        ));
        bankingCategory = categoryRepository.save(new NewsCategory(
                "BANKING", "Ngân hàng & Lãi suất", "Thông tin ngân hàng và lãi suất", 1
        ));
    }

    @Test
    @DisplayName("TC_AIN_02: Phân loại sắc thái POSITIVE kèm giải thích và phân định rõ Fact vs AI Opinion")
    void testAnalyzePositiveSentimentSeparatesFactAndAiOpinion() {
        NewsArticle article = articleRepository.save(new NewsArticle(
                vnExpressSource,
                bankingCategory,
                "Vietcombank và Techcombank báo lãi kỷ lục nhờ tín dụng phục hồi mạnh mẽ",
                "hash_sentiment_pos_01",
                "Lợi nhuận trước thuế của khối ngân hàng tăng trưởng 18% trong quý vừa qua, nợ xấu được kiểm soát.",
                "Nội dung chi tiết...",
                "https://vnexpress.net/vcb-tcb-lai-ky-luc.html",
                null,
                "VnExpress",
                Instant.now()
        ));

        AtomicInteger callCount = new AtomicInteger(0);
        GeminiClient stubClient = (prompt, jsonMode) -> {
            callCount.incrementAndGet();
            assertThat(prompt).contains("<untrusted_external_news>");
            return """
                    {
                      "sentiment": "POSITIVE",
                      "sentimentReason": "[Fact] Lợi nhuận trước thuế tăng trưởng 18% và nợ xấu được kiểm soát tốt.",
                      "factSummary": "Vietcombank và Techcombank ghi nhận lợi nhuận trước thuế tăng 18% nhờ tăng trưởng tín dụng.",
                      "aiOpinion": "Kết quả kinh doanh tích cực hỗ trợ định giá nhóm cổ phiếu ngân hàng, tuy nhiên sắc thái tin tức khác với biến động giá ngắn hạn trên sàn.",
                      "beneficiaries": "Cổ đông nắm giữ VCB, TCB và người gửi tiết kiệm kỳ hạn dài",
                      "riskExposed": "Nhà đầu tư mua đuổi giá cao ở vùng kháng cự ngắn hạn",
                      "relatedTickers": ["VCB", "TCB"],
                      "tags": ["#nganhang", "#loinhuan"]
                    }
                    """;
        };

        NewsSentimentService sentimentService = new NewsSentimentService(
                stubClient, geminiConfig, articleRepository, summaryRepository, objectMapper
        );

        NewsSummary summary = sentimentService.analyzeAndCacheSentiment(article.getId());
        assertThat(callCount.get()).isEqualTo(1);
        assertThat(summary.getSentiment()).isEqualTo("POSITIVE");
        assertThat(summary.getSentimentReason()).contains("[Fact]").contains("18%");
        assertThat(summary.getImpactAnalysis())
                .contains("[Dữ kiện bài báo - Fact]")
                .contains("[Nhận định AI - Opinion]")
                .contains("Hưởng lợi:")
                .contains("Chịu rủi ro:");
        assertThat(summary.getRelatedTickers()).contains("VCB").contains("TCB");

        // Gọi lại lần 2 -> lấy từ DB cache, không gọi lại Gemini
        NewsSummary cached = sentimentService.analyzeAndCacheSentiment(article.getId());
        assertThat(callCount.get()).isEqualTo(1);
        assertThat(cached.getId()).isEqualTo(summary.getId());
    }

    @Test
    @DisplayName("TC_AIN_03: Nhận diện chính xác >= 90% (10/10 = 100%) mã cổ phiếu niêm yết xuất hiện trong bài viết")
    void testTickerRecognitionAccuracyExceeds90Percent() {
        NewsSentimentService sentimentService = new NewsSentimentService(
                null, geminiConfig, articleRepository, summaryRepository, objectMapper
        );

        String marketReport = """
                Phiên giao dịch hôm nay chứng kiến sự bứt phá của Tập đoàn FPT, Hòa Phát (HPG),
                ngân hàng Vietcombank, Techcombank, MBBank cùng nhóm bán lẻ Thế Giới Di Động (MWG),
                Vinamilk, Vingroup, Chứng khoán SSI và Vàng bạc đá quý Phú Nhuận (PNJ).
                """;

        Set<String> tickers = sentimentService.extractTickersFromText(marketReport);
        assertThat(tickers).containsExactlyInAnyOrder(
                "FPT", "HPG", "VCB", "TCB", "MBB", "MWG", "VNM", "VIC", "SSI", "PNJ"
        );
    }

    @Test
    @DisplayName("Kiểm tra phân tích sắc thái NEGATIVE qua cơ chế Fallback khi Gemini lỗi mạng")
    void testFallbackNegativeSentimentAndImpactAnalysis() {
        NewsArticle article = articleRepository.save(new NewsArticle(
                vnExpressSource,
                bankingCategory,
                "Áp lực nợ xấu và rủi ro thua lỗ gia tăng tại các doanh nghiệp sử dụng đòn bẩy cao",
                "hash_sentiment_neg_02",
                "Chi phí lãi vay neo cao khiến lợi nhuận suy giảm mạnh và dòng tiền bán ròng gia tăng.",
                "Chi tiết...",
                "https://vnexpress.net/ap-luc-no-xau.html",
                null,
                "VnExpress",
                Instant.now()
        ));

        GeminiClient failingClient = (prompt, jsonMode) -> {
            throw new RuntimeException("Network Timeout");
        };

        NewsSentimentService sentimentService = new NewsSentimentService(
                failingClient, geminiConfig, articleRepository, summaryRepository, objectMapper
        );

        NewsSummary summary = sentimentService.analyzeAndCacheSentiment(article.getId());
        assertThat(summary.getSentiment()).isEqualTo("NEGATIVE");
        assertThat(summary.getSentimentReason()).contains("[Dữ kiện bài báo - Fact]");
        assertThat(summary.getImpactAnalysis())
                .contains("[Dữ kiện bài báo - Fact]")
                .contains("[Nhận định AI - Opinion]");
    }
}

