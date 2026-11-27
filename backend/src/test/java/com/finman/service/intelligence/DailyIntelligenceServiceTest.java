package com.finman.service.intelligence;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finman.client.GeminiClient;
import com.finman.config.GeminiConfig;
import com.finman.dto.response.BudgetResponse;
import com.finman.dto.response.BudgetSummaryResponse;
import com.finman.dto.response.CategoryResponse;
import com.finman.dto.response.DailyDigestResponse;
import com.finman.dto.response.DailyIntelligenceResponse;
import com.finman.dto.response.PersonalFinancialAlertDto;
import com.finman.service.BudgetService;
import com.finman.entity.DailyDigest;
import com.finman.entity.MarketIndex;
import com.finman.entity.NewsArticle;
import com.finman.entity.NewsCategory;
import com.finman.entity.NewsSource;
import com.finman.entity.NewsSummary;
import com.finman.repository.DailyDigestRepository;
import com.finman.repository.MarketIndexRepository;
import com.finman.repository.NewsArticleRepository;
import com.finman.repository.NewsSummaryRepository;
import com.finman.service.ai.NewsAiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DailyIntelligenceServiceTest {

    @Mock
    private DailyDigestRepository dailyDigestRepository;

    @Mock
    private MarketIndexRepository marketIndexRepository;

    @Mock
    private NewsArticleRepository newsArticleRepository;

    @Mock
    private NewsSummaryRepository newsSummaryRepository;

    @Mock
    private NewsAiService newsAiService;

    @Mock
    private GeminiClient geminiClient;

    @Mock
    private GeminiConfig geminiConfig;

    @Mock
    private BudgetService budgetService;

    private ObjectMapper objectMapper;
    private DailyIntelligenceService dailyIntelligenceService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
        dailyIntelligenceService = new DailyIntelligenceService(
                dailyDigestRepository,
                marketIndexRepository,
                newsArticleRepository,
                newsSummaryRepository,
                newsAiService,
                geminiClient,
                geminiConfig,
                budgetService,
                objectMapper
        );
    }

    private MarketIndex createMockIndex(String code, String name, BigDecimal value, BigDecimal change, BigDecimal pct) {
        MarketIndex mi = new MarketIndex();
        mi.setCode(code);
        mi.setName(name);
        mi.setCurrentValue(value);
        mi.setChangeValue(change);
        mi.setPercentChange(pct);
        mi.setTradingVolume(1000000L);
        mi.setTradingValue(50000000000L);
        mi.setSessionStatus("CLOSED");
        return mi;
    }

    private NewsArticle createMockArticle(Long id, String title, String sourceName, String catName) {
        NewsArticle article = new NewsArticle();
        article.setId(id);
        article.setTitle(title);
        article.setDescription("Mô tả bài viết tài chính " + id);
        article.setOriginalUrl("https://example.com/news/" + id);
        article.setPublishedAt(Instant.now());

        NewsSource source = new NewsSource();
        source.setName(sourceName);
        article.setSource(source);

        NewsCategory category = new NewsCategory();
        category.setNameVi(catName);
        article.setCategory(category);

        return article;
    }

    @Test
    @DisplayName("compileDailyDigest: Thành công với JSON từ Gemini")
    void testCompileDailyDigest_WithGeminiJson() {
        LocalDate targetDate = LocalDate.of(2026, 11, 20);

        when(dailyDigestRepository.findByDigestDate(targetDate)).thenReturn(Optional.empty());

        when(marketIndexRepository.findAll()).thenReturn(List.of(
                createMockIndex("VNINDEX", "VN-Index", BigDecimal.valueOf(1285.50), BigDecimal.valueOf(8.45), BigDecimal.valueOf(0.66)),
                createMockIndex("VN30", "VN30-Index", BigDecimal.valueOf(1342.10), BigDecimal.valueOf(10.20), BigDecimal.valueOf(0.77))
        ));

        NewsArticle mockArticle = createMockArticle(101L, "Lợi nhuận ngân hàng bứt phá quý 4", "VnEconomy", "Ngân hàng");
        when(newsArticleRepository.findRecentArticles(any(Instant.class), any(Pageable.class))).thenReturn(List.of(mockArticle));

        NewsSummary summary = new NewsSummary();
        summary.setBulletPoints("[\"Lợi nhuận toàn ngành tăng 15%\", \"Tín dụng mở rộng tốt\", \"Nợ xấu được kiểm soát\"]");
        summary.setSentiment("POSITIVE");
        summary.setRelatedTickers("FPT,VCB");
        when(newsSummaryRepository.findByArticleId(101L)).thenReturn(Optional.of(summary));

        when(geminiConfig.hasApiKey()).thenReturn(true);
        String mockGeminiJson = """
                {
                  "ai_macro_summary": "Thị trường tài chính khởi sắc nhờ đà dẫn dắt của nhóm cổ phiếu ngân hàng và dòng vốn dồi dào.",
                  "key_takeaways": [
                    "Ngành ngân hàng ghi nhận tăng trưởng tín dụng khả quan",
                    "Thanh khoản thị trường duy trì trên 20 nghìn tỷ đồng",
                    "Nhà đầu tư nên tiếp tục ưu tiên quản trị dòng tiền an toàn"
                  ],
                  "suggested_prompts": [
                    "Nhóm cổ phiếu ngân hàng có còn dư địa tăng trưởng?",
                    "Tôi nên cân đối thu chi tháng này thế nào?",
                    "Lãi suất tiền gửi hiện tại có xu hướng ra sao?"
                  ]
                }
                """;
        when(geminiClient.generateContent(anyString(), anyBoolean())).thenReturn(mockGeminiJson);

        when(dailyDigestRepository.save(any(DailyDigest.class))).thenAnswer(invocation -> {
            DailyDigest d = invocation.getArgument(0);
            d.setId(1L);
            d.setCreatedAt(Instant.now());
            d.setUpdatedAt(Instant.now());
            return d;
        });

        DailyDigest result = dailyIntelligenceService.compileDailyDigest(targetDate);

        assertThat(result).isNotNull();
        assertThat(result.getDigestDate()).isEqualTo(targetDate);
        assertThat(result.getAiMacroSummary()).contains("ngân hàng");
        assertThat(result.getStatus()).isEqualTo("READY");

        ArgumentCaptor<DailyDigest> captor = ArgumentCaptor.forClass(DailyDigest.class);
        verify(dailyDigestRepository).save(captor.capture());
        DailyDigest saved = captor.getValue();
        assertThat(saved.getMarketPulseJson()).contains("VNINDEX");
        assertThat(saved.getTopHeadlinesJson()).contains("Lợi nhuận ngân hàng");
    }

    @Test
    @DisplayName("compileDailyDigest: Tự động Fallback sang Rule-Based Synthesis khi Gemini không khả dụng")
    void testCompileDailyDigest_FallbackWhenGeminiUnavailable() {
        LocalDate targetDate = LocalDate.of(2026, 11, 21);

        when(dailyDigestRepository.findByDigestDate(targetDate)).thenReturn(Optional.empty());
        when(marketIndexRepository.findAll()).thenReturn(List.of(
                createMockIndex("VNINDEX", "VN-Index", BigDecimal.valueOf(1280.00), BigDecimal.valueOf(-4.20), BigDecimal.valueOf(-0.33))
        ));

        when(newsArticleRepository.findRecentArticles(any(Instant.class), any(Pageable.class))).thenReturn(List.of(
                createMockArticle(202L, "Xuất khẩu thủy sản hồi phục mạnh mẽ", "Báo Đầu Tư", "Thương mại")
        ));
        when(newsSummaryRepository.findByArticleId(202L)).thenReturn(Optional.empty());

        when(geminiConfig.hasApiKey()).thenReturn(false);

        when(dailyDigestRepository.save(any(DailyDigest.class))).thenAnswer(invocation -> {
            DailyDigest d = invocation.getArgument(0);
            d.setId(2L);
            d.setCreatedAt(Instant.now());
            d.setUpdatedAt(Instant.now());
            return d;
        });

        DailyDigest result = dailyIntelligenceService.compileDailyDigest(targetDate);

        assertThat(result).isNotNull();
        assertThat(result.getAiMacroSummary()).isNotBlank();
        assertThat(result.getKeyTakeawaysJson()).contains("Chỉ số VN-Index");
        assertThat(result.getSuggestedPromptsJson()).contains("tài chính cá nhân");

        verify(geminiClient, never()).generateContent(anyString(), anyBoolean());
        verify(dailyDigestRepository).save(any(DailyDigest.class));
    }

    @Test
    @DisplayName("compileDailyDigest: Không tạo trùng khi bản tin ngày đó đã tồn tại (Idempotent)")
    void testCompileDailyDigest_IdempotentWhenAlreadyExists() {
        LocalDate targetDate = LocalDate.of(2026, 11, 22);

        DailyDigest existing = new DailyDigest(targetDate, "Bản tin đã có sẵn", "[]", "[]");
        existing.setId(99L);
        when(dailyDigestRepository.findByDigestDate(targetDate)).thenReturn(Optional.of(existing));

        DailyDigest result = dailyIntelligenceService.compileDailyDigest(targetDate);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(99L);
        assertThat(result.getAiMacroSummary()).isEqualTo("Bản tin đã có sẵn");

        verify(dailyDigestRepository, never()).save(any(DailyDigest.class));
        verify(geminiClient, never()).generateContent(anyString(), anyBoolean());
    }

    @Test
    @DisplayName("convertToResponse: Chuyển đổi Entity sang Response DTO chuẩn xác")
    void testConvertToResponse() {
        DailyDigest entity = new DailyDigest();
        entity.setId(10L);
        entity.setDigestDate(LocalDate.of(2026, 11, 20));
        entity.setAiMacroSummary("Tóm tắt vĩ mô kinh tế");
        entity.setMarketPulseJson("""
                [{"code":"VNINDEX","name":"VN-Index","currentValue":1285.50,"changeValue":8.45,"percentChange":0.66,"sessionStatus":"CLOSED","isPositive":true}]
                """);
        entity.setTopHeadlinesJson("""
                [{"id":1,"title":"Tin tài chính tiêu điểm","sourceName":"VnEconomy","summaryBullets":["Ý 1","Ý 2"]}]
                """);
        entity.setKeyTakeawaysJson("[\"Điểm 1\",\"Điểm 2\"]");
        entity.setSuggestedPromptsJson("[\"Gợi ý câu hỏi 1\"]");
        entity.setStatus("READY");
        entity.setCreatedAt(Instant.now());

        DailyDigestResponse response = dailyIntelligenceService.convertToResponse(entity);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getDigestDate()).isEqualTo(LocalDate.of(2026, 11, 20));
        assertThat(response.getMarketPulse()).hasSize(1);
        assertThat(response.getMarketPulse().get(0).getCode()).isEqualTo("VNINDEX");
        assertThat(response.getTopHeadlines()).hasSize(1);
        assertThat(response.getTopHeadlines().get(0).getTitle()).isEqualTo("Tin tài chính tiêu điểm");
        assertThat(response.getKeyTakeaways()).contains("Điểm 1");
        assertThat(response.getSuggestedPrompts()).contains("Gợi ý câu hỏi 1");
    }

    @Test
    @DisplayName("calculatePersonalFinancialAlert: Cảnh báo SAFE khi chi tiêu dưới tiến độ tháng")
    void testCalculatePersonalFinancialAlert_Safe() {
        Long userId = 1L;
        LocalDate date = LocalDate.of(2026, 11, 15); // ngày 15/30 = 50% tháng

        BudgetSummaryResponse summary = new BudgetSummaryResponse();
        summary.setTotalBudget(10000000L);
        summary.setTotalSpent(4000000L); // 40% < 50%
        summary.setTotalRemaining(6000000L);
        summary.setOverallPercentage(40.0);

        when(budgetService.getBudgetSummary(eq(userId), eq("2026-11"))).thenReturn(summary);

        PersonalFinancialAlertDto alert = dailyIntelligenceService.calculatePersonalFinancialAlert(userId, date);

        assertThat(alert).isNotNull();
        assertThat(alert.getAlertLevel()).isEqualTo("SAFE");
        assertThat(alert.getSpentPercentage()).isEqualTo(40.0);
        assertThat(alert.getTotalRemaining()).isEqualTo(6000000L);
        assertThat(alert.getMessage()).contains("kỷ luật dòng tiền");
    }

    @Test
    @DisplayName("calculatePersonalFinancialAlert: Cảnh báo DANGER khi chi tiêu vượt tiến độ thời gian")
    void testCalculatePersonalFinancialAlert_Danger() {
        Long userId = 1L;
        LocalDate date = LocalDate.of(2026, 11, 15); // ngày 15/30 = 50% tháng

        BudgetSummaryResponse summary = new BudgetSummaryResponse();
        summary.setTotalBudget(10000000L);
        summary.setTotalSpent(9000000L); // 90% >> 50% + 20%
        summary.setTotalRemaining(1000000L);
        summary.setOverallPercentage(90.0);

        BudgetResponse catBudget = new BudgetResponse();
        CategoryResponse cat = new CategoryResponse();
        cat.setName("Mua sắm");
        catBudget.setCategory(cat);
        catBudget.setPercentage(110.0);
        summary.setBudgets(List.of(catBudget));

        when(budgetService.getBudgetSummary(eq(userId), eq("2026-11"))).thenReturn(summary);

        PersonalFinancialAlertDto alert = dailyIntelligenceService.calculatePersonalFinancialAlert(userId, date);

        assertThat(alert).isNotNull();
        assertThat(alert.getAlertLevel()).isEqualTo("DANGER");
        assertThat(alert.getHighestCategoryName()).isEqualTo("Mua sắm");
        assertThat(alert.getMessage()).contains("vượt");
    }

    @Test
    @DisplayName("getAggregatedDailyIntelligence: Tổng hợp thành công DailyIntelligenceResponse cho người dùng")
    void testGetAggregatedDailyIntelligence() {
        Long userId = 2L;
        LocalDate date = LocalDate.of(2026, 11, 20);

        DailyDigest entity = new DailyDigest(date, "Nhận định vĩ mô ngày 20", "[]", "[]");
        entity.setId(55L);
        when(dailyDigestRepository.findByDigestDate(date)).thenReturn(Optional.of(entity));

        BudgetSummaryResponse summary = new BudgetSummaryResponse();
        summary.setTotalBudget(0L);
        summary.setTotalSpent(0L);
        when(budgetService.getBudgetSummary(eq(userId), any())).thenReturn(summary);

        DailyIntelligenceResponse res = dailyIntelligenceService.getAggregatedDailyIntelligence(date, userId);

        assertThat(res).isNotNull();
        assertThat(res.getId()).isEqualTo(55L);
        assertThat(res.getDigestDate()).isEqualTo(date);
        assertThat(res.getPersonalAlert()).isNotNull();
        assertThat(res.getPersonalAlert().getAlertLevel()).isEqualTo("INFO");
    }
}
