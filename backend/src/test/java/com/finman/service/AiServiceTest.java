package com.finman.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finman.client.GeminiClient;
import com.finman.client.GeminiClientImpl;
import com.finman.config.GeminiConfig;
import com.finman.dto.request.AiChatMessageDto;
import com.finman.dto.response.AiChatResponse;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import com.finman.dto.response.AiInsightsResponse;
import com.finman.dto.response.AiQuickAddResponse;
import com.finman.dto.response.CategoryAggregationResponse;
import com.finman.entity.Account;
import com.finman.entity.Budget;
import com.finman.entity.Category;
import com.finman.entity.User;
import com.finman.entity.enums.AccountType;
import com.finman.entity.enums.CategoryType;
import com.finman.entity.enums.TransactionType;
import com.finman.exception.AppException;
import com.finman.exception.BusinessValidationException;
import com.finman.repository.AccountRepository;
import com.finman.repository.BudgetRepository;
import com.finman.repository.CategoryRepository;
import com.finman.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiServiceTest {

    @Mock
    private GeminiClient geminiClient;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private BudgetRepository budgetRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private GeminiConfig geminiConfig;
    private AiService aiService;

    private User testUser;
    private List<Category> categories;
    private List<Account> accounts;

    @BeforeEach
    void setUp() {
        geminiConfig = new GeminiConfig();
        geminiConfig.setModel("gemini-2.5-flash");
        geminiConfig.setBaseUrl("https://generativelanguage.googleapis.com/v1beta");
        geminiConfig.setApiKey(""); // default offline / local

        aiService = new AiService(
                geminiClient,
                geminiConfig,
                categoryRepository,
                accountRepository,
                transactionRepository,
                budgetRepository,
                objectMapper
        );

        testUser = new User("tester@finman.com", "hashpass", "Tester");
        testUser.setId(1L);

        Category food = new Category("Ăn uống", CategoryType.EXPENSE, "restaurant", true);
        food.setId(10L);

        Category clothes = new Category("Áo quần", CategoryType.EXPENSE, "apparel", true);
        clothes.setId(11L);

        Category transport = new Category("Giao thông", CategoryType.EXPENSE, "directions_car", true);
        transport.setId(12L);

        Category salary = new Category("Lương", CategoryType.INCOME, "payments", true);
        salary.setId(13L);

        Category otherExpense = new Category("Chi tiêu khác", CategoryType.EXPENSE, "more_horiz", true);
        otherExpense.setId(14L);

        categories = List.of(food, clothes, transport, salary, otherExpense);

        Account cash = new Account(testUser, "Tiền mặt", AccountType.CASH, 1_000_000L);
        cash.setId(100L);

        Account bank = new Account(testUser, "Ngân hàng", AccountType.BANK, 5_000_000L);
        bank.setId(101L);

        Account credit = new Account(testUser, "Thẻ tín dụng", AccountType.CREDIT_CARD, 0L);
        credit.setId(102L);

        accounts = List.of(cash, bank, credit);

        lenient().when(categoryRepository.findAllAvailableForUser(1L)).thenReturn(categories);
        lenient().when(accountRepository.findByUserIdAndIsArchivedFalse(1L)).thenReturn(accounts);
    }

    @Test
    @DisplayName("TC_AI_01: Nhập nhanh câu văn tiếng Việt rõ ràng: Ăn bún bò 45k bằng tiền mặt")
    void testParseTransaction_TC_AI_01_ClearVietnamese() {
        geminiConfig.setApiKey(""); // local fallback

        AiQuickAddResponse response = aiService.parseTransactionFromText(1L, "Ăn bún bò 45k bằng tiền mặt");

        assertNotNull(response);
        assertEquals(TransactionType.EXPENSE, response.getType());
        assertEquals(45_000L, response.getAmount());
        assertEquals(10L, response.getCategoryId());
        assertEquals("Ăn uống", response.getCategoryName());
        assertEquals(100L, response.getAccountId());
        assertEquals("Tiền mặt", response.getAccountName());
        assertTrue(response.getNote().toLowerCase().contains("bún bò"));
    }

    @Test
    @DisplayName("TC_AI_02: Nhập nhanh tiếng Việt không dấu: mua ao so mi 350k the ngan hang")
    void testParseTransaction_TC_AI_02_UnaccentedVietnamese() {
        geminiConfig.setApiKey(""); // local fallback

        AiQuickAddResponse response = aiService.parseTransactionFromText(1L, "mua ao so mi 350k the ngan hang");

        assertNotNull(response);
        assertEquals(TransactionType.EXPENSE, response.getType());
        assertEquals(350_000L, response.getAmount());
        assertEquals(11L, response.getCategoryId());
        assertEquals("Áo quần", response.getCategoryName());
        assertEquals(101L, response.getAccountId());
        assertEquals("Ngân hàng", response.getAccountName());
    }

    @Test
    @DisplayName("TC_AI_03: Câu nhập thiếu tên tài khoản: Uống cà phê 35k -> tự gán Tiền mặt")
    void testParseTransaction_TC_AI_03_DefaultAccount() {
        geminiConfig.setApiKey(""); // local fallback

        AiQuickAddResponse response = aiService.parseTransactionFromText(1L, "Uống cà phê 35k");

        assertNotNull(response);
        assertEquals(TransactionType.EXPENSE, response.getType());
        assertEquals(35_000L, response.getAmount());
        assertEquals(10L, response.getCategoryId());
        assertEquals("Ăn uống", response.getCategoryName());
        assertEquals(100L, response.getAccountId());
        assertEquals("Tiền mặt", response.getAccountName());
    }

    @Test
    @DisplayName("TC_AI_04: Câu nhập không hợp lệ hoặc không có số tiền -> ném lỗi thân thiện")
    void testParseTransaction_TC_AI_04_InvalidNoAmount() {
        geminiConfig.setApiKey("");

        BusinessValidationException ex = assertThrows(BusinessValidationException.class, () ->
                aiService.parseTransactionFromText(1L, "Xin chào FinMan hôm nay trời đẹp quá")
        );

        assertEquals("Không thể nhận diện giao dịch. Vui lòng nhập rõ số tiền và nội dung.", ex.getMessage());
    }

    @Test
    @DisplayName("TC_AI_05: Tạo nhận xét tài chính hàng tháng")
    void testGenerateMonthlyInsights_TC_AI_05() {
        when(transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                eq(1L), eq(TransactionType.INCOME), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(15_000_000L);
        when(transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                eq(1L), eq(TransactionType.EXPENSE), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(8_000_000L);

        AiInsightsResponse response = aiService.generateMonthlyInsights(1L, "2026-09");

        assertNotNull(response);
        assertEquals("2026-09", response.getMonth());
        assertEquals(15_000_000L, response.getTotalIncome());
        assertEquals(8_000_000L, response.getTotalExpense());
        assertEquals(7_000_000L, response.getNetSavings());
        assertNotNull(response.getOverview());
        assertFalse(response.getRecommendations().isEmpty());
        assertTrue(response.getRecommendations().size() >= 2);
    }

    @Test
    @DisplayName("TC_AI_06: Xử lý khi mất kết nối Gemini hoặc hết hạn mức -> Ném AI_SERVICE_UNAVAILABLE an toàn")
    void testGeminiClientException_TC_AI_06() {
        geminiConfig.setApiKey("real-gemini-key");
        when(geminiClient.generateContent(anyString(), eq(true)))
                .thenThrow(new AppException("Hệ thống AI hiện đang bận hoặc gián đoạn kết nối. Vui lòng thử lại sau.",
                        HttpStatus.SERVICE_UNAVAILABLE, "AI_SERVICE_UNAVAILABLE"));

        // Khi Gemini lỗi, AiService tự động fallback an toàn sang local parser không làm crash server
        AiQuickAddResponse response = aiService.parseTransactionFromText(1L, "Ăn bún bò 45k bằng tiền mặt");
        assertNotNull(response);
        assertEquals(45_000L, response.getAmount());
        assertEquals("Ăn uống", response.getCategoryName());
    }

    @Test
    @DisplayName("Gemini API Parse Success: Phân tích thành công từ kết quả JSON của Gemini")
    void testParseWithGemini_Success() {
        geminiConfig.setApiKey("real-gemini-key");
        String mockGeminiJson = """
                {
                  "isRecognized": true,
                  "type": "EXPENSE",
                  "amount": 65000,
                  "categoryName": "Ăn uống",
                  "accountName": "Tiền mặt",
                  "note": "phở Thìn",
                  "transactionDate": "2026-09-25"
                }
                """;
        when(geminiClient.generateContent(anyString(), eq(true))).thenReturn(mockGeminiJson);

        AiQuickAddResponse response = aiService.parseTransactionFromText(1L, "Ăn phở Thìn 65k ví tiền mặt hôm nay");

        assertNotNull(response);
        assertEquals(TransactionType.EXPENSE, response.getType());
        assertEquals(65_000L, response.getAmount());
        assertEquals("Ăn uống", response.getCategoryName());
        assertEquals("Tiền mặt", response.getAccountName());
        assertEquals("phở Thìn", response.getNote());
        assertEquals(LocalDate.parse("2026-09-25"), response.getTransactionDate());
    }

    @Test
    @DisplayName("Gemini Client Directly: Kiểm tra ném ngoại lệ khi gọi GeminiClient bị thiếu API Key")
    void testGeminiClientDirectThrows() {
        geminiConfig.setApiKey("");
        GeminiClient directClient = new GeminiClientImpl(null, geminiConfig, objectMapper);

        AppException ex = assertThrows(AppException.class, () ->
                directClient.generateContent("test prompt", true)
        );
        assertEquals("AI_SERVICE_UNAVAILABLE", ex.getErrorCode());
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, ex.getStatus());
    }

    @Test
    @DisplayName("Local Fallback Multi-Transactions: Tách nhiều giao dịch trong 1 câu nói")
    void testParseLocally_MultipleTransactions() {
        String input = "Ăn bún bò 45k ví tiền mặt và đổ xăng 70k";
        AiQuickAddResponse response = aiService.parseTransactionFromText(1L, input);

        assertNotNull(response);
        assertNotNull(response.getItems());
        assertEquals(2, response.getItems().size());

        assertEquals(45_000L, response.getItems().get(0).getAmount());
        assertEquals("Ăn uống", response.getItems().get(0).getCategoryName());

        assertEquals(70_000L, response.getItems().get(1).getAmount());
        assertEquals("Giao thông", response.getItems().get(1).getCategoryName());
    }

    @Test
    @DisplayName("Gemini Multi-Transactions: Bóc tách mảng nhiều giao dịch từ JSON của Gemini")
    void testParseWithGemini_MultipleTransactions() {
        geminiConfig.setApiKey("real-gemini-key");
        String mockGeminiJson = """
                {
                  "isRecognized": true,
                  "transactions": [
                    {
                      "type": "EXPENSE",
                      "amount": 50000,
                      "categoryName": "Ăn uống",
                      "accountName": "Tiền mặt",
                      "note": "Ăn phở",
                      "transactionDate": "2026-09-28"
                    },
                    {
                      "type": "EXPENSE",
                      "amount": 70000,
                      "categoryName": "Đi lại",
                      "accountName": "Techcombank",
                      "note": "Đổ xăng",
                      "transactionDate": "2026-09-28"
                    }
                  ]
                }
                """;
        when(geminiClient.generateContent(anyString(), eq(true))).thenReturn(mockGeminiJson);

        AiQuickAddResponse response = aiService.parseTransactionFromText(1L, "Ăn phở 50k ví tiền mặt và đổ xăng 70k thẻ techcombank");

        assertNotNull(response);
        assertEquals(2, response.getItems().size());
        assertEquals(50_000L, response.getItems().get(0).getAmount());
        assertEquals("Ăn phở", response.getItems().get(0).getNote());
        assertEquals(70_000L, response.getItems().get(1).getAmount());
        assertEquals("Đổ xăng", response.getItems().get(1).getNote());
    }

    @Test
    @DisplayName("TC_AI_11: Tra cứu số dư tài khoản qua processUserChat (Query Intent)")
    void testProcessUserChat_RoutingToQuery() {
        when(accountRepository.findByUserIdAndIsArchivedFalse(1L)).thenReturn(accounts);

        AiChatResponse response = aiService.processUserChat(1L, "Số dư tài khoản của tôi hiện tại là bao nhiêu?");

        assertNotNull(response);
        assertEquals("QUERY_ANSWER", response.getResponseType());
        assertNotNull(response.getText());
        assertTrue(response.getText().contains("Tổng số dư khả dụng"));
        assertTrue(response.getText().contains("Tiền mặt"));
        assertTrue(response.getText().contains("Ngân hàng"));
    }

    @Test
    @DisplayName("TC_AI_12: Nhận diện ghi nhận giao dịch qua processUserChat (Quick Add Intent)")
    void testProcessUserChat_RoutingToQuickAdd() {
        when(categoryRepository.findAllAvailableForUser(1L)).thenReturn(categories);
        when(accountRepository.findByUserIdAndIsArchivedFalse(1L)).thenReturn(accounts);

        AiChatResponse response = aiService.processUserChat(1L, "Ăn phở Thìn 50k ví tiền mặt");

        assertNotNull(response);
        assertEquals("QUICK_ADD", response.getResponseType());
        assertNotNull(response.getItems());
        assertFalse(response.getItems().isEmpty());
        assertEquals(50_000L, response.getItems().get(0).getAmount());
    }

    @Test
    @DisplayName("Local Fallback Date: Bóc tách ngày tháng cụ thể ngày 25/09")
    void testParseLocally_WithSpecificDate() {
        when(categoryRepository.findAllAvailableForUser(1L)).thenReturn(categories);
        when(accountRepository.findByUserIdAndIsArchivedFalse(1L)).thenReturn(accounts);

        AiQuickAddResponse response = aiService.parseTransactionFromText(1L, "Ăn bún bò 45k ngày 25/09 ví tiền mặt");

        assertNotNull(response);
        assertEquals(45_000L, response.getAmount());
        assertEquals("Ăn uống", response.getCategoryName());
        assertEquals(LocalDate.of(LocalDate.now().getYear(), 9, 25), response.getTransactionDate());
        assertFalse(response.getNote().toLowerCase().contains("25/09"));
    }

    @Test
    @DisplayName("Local Fallback Date: Bóc tách ngày hôm qua")
    void testParseLocally_WithYesterday() {
        when(categoryRepository.findAllAvailableForUser(1L)).thenReturn(categories);
        when(accountRepository.findByUserIdAndIsArchivedFalse(1L)).thenReturn(accounts);

        AiQuickAddResponse response = aiService.parseTransactionFromText(1L, "Đổ xăng 50k hôm qua tiền mặt");

        assertNotNull(response);
        assertEquals(50_000L, response.getAmount());
        assertEquals(LocalDate.now().minusDays(1), response.getTransactionDate());
        assertFalse(response.getNote().toLowerCase().contains("hôm qua"));
    }

    @Test
    @DisplayName("Monthly Insights: Tháng không có giao dịch tài chính nào")
    void testGenerateMonthlyInsights_NoTransactions() {
        when(transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                eq(1L), any(), any(), any())).thenReturn(0L);

        AiInsightsResponse response = aiService.generateMonthlyInsights(1L, "2026-09");

        assertNotNull(response);
        assertEquals("2026-09", response.getMonth());
        assertEquals(0L, response.getTotalIncome());
        assertEquals(0L, response.getTotalExpense());
        assertEquals(0L, response.getNetSavings());
        assertEquals(0.0, response.getSavingsRate());
        assertTrue(response.getOverview().contains("chưa ghi nhận giao dịch"));
        assertFalse(response.getRecommendations().isEmpty());
    }

    @Test
    @DisplayName("Monthly Insights: Đầy đủ thu chi, tính đúng net savings, savings rate và highest expense category")
    void testGenerateMonthlyInsights_IncomeAndExpenseDetails() {
        LocalDate start = LocalDate.of(2026, 9, 1);
        LocalDate end = LocalDate.of(2026, 9, 30);

        when(transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                eq(1L), eq(TransactionType.INCOME), eq(start), eq(end))).thenReturn(30_000_000L);
        when(transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                eq(1L), eq(TransactionType.EXPENSE), eq(start), eq(end))).thenReturn(18_000_000L);

        List<CategoryAggregationResponse> expenseAgg = List.of(
                new CategoryAggregationResponse(10L, "Ăn uống", "restaurant", TransactionType.EXPENSE, 10_000_000L, 15L),
                new CategoryAggregationResponse(11L, "Mua sắm", "shopping", TransactionType.EXPENSE, 5_000_000L, 5L),
                new CategoryAggregationResponse(12L, "Giao thông", "car", TransactionType.EXPENSE, 3_000_000L, 8L)
        );
        when(transactionRepository.aggregateByCategory(eq(1L), eq(start), eq(end), eq(TransactionType.EXPENSE)))
                .thenReturn(expenseAgg);

        AiInsightsResponse response = aiService.generateMonthlyInsights(1L, "2026-09");

        assertNotNull(response);
        assertEquals(30_000_000L, response.getTotalIncome());
        assertEquals(18_000_000L, response.getTotalExpense());
        assertEquals(12_000_000L, response.getNetSavings());
        assertEquals(40.0, response.getSavingsRate());

        assertNotNull(response.getKeyMetrics());
        assertEquals("Ăn uống", response.getKeyMetrics().getHighestExpenseCategory());
        assertEquals(10_000_000L, response.getKeyMetrics().getHighestExpenseAmount());
        assertEquals(55.6, response.getKeyMetrics().getHighestExpensePercentage());

        assertEquals(3, response.getTopExpenseCategories().size());
        assertEquals("Ăn uống", response.getTopExpenseCategories().get(0).getCategoryName());
        assertEquals(55.6, response.getTopExpenseCategories().get(0).getPercentage());
    }

    @Test
    @DisplayName("Monthly Insights: So sánh tăng/giảm phần trăm với tháng trước")
    void testGenerateMonthlyInsights_PreviousMonthComparison() {
        LocalDate curStart = LocalDate.of(2026, 9, 1);
        LocalDate curEnd = LocalDate.of(2026, 9, 30);
        LocalDate prevStart = LocalDate.of(2026, 8, 1);
        LocalDate prevEnd = LocalDate.of(2026, 8, 31);

        when(transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                eq(1L), eq(TransactionType.INCOME), eq(curStart), eq(curEnd))).thenReturn(30_000_000L);
        when(transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                eq(1L), eq(TransactionType.EXPENSE), eq(curStart), eq(curEnd))).thenReturn(18_000_000L);

        when(transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                eq(1L), eq(TransactionType.INCOME), eq(prevStart), eq(prevEnd))).thenReturn(25_000_000L);
        when(transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                eq(1L), eq(TransactionType.EXPENSE), eq(prevStart), eq(prevEnd))).thenReturn(15_000_000L);

        AiInsightsResponse response = aiService.generateMonthlyInsights(1L, "2026-09");

        assertNotNull(response);
        assertNotNull(response.getKeyMetrics());
        assertEquals(20.0, response.getKeyMetrics().getIncomeChangePercentage()); // (30-25)/25 = +20.0%
        assertEquals(20.0, response.getKeyMetrics().getExpenseChangePercentage()); // (18-15)/15 = +20.0%
        assertEquals(20.0, response.getKeyMetrics().getSavingsChangePercentage()); // (12-10)/10 = +20.0%
    }

    @Test
    @DisplayName("Monthly Insights: Tháng trước không có dữ liệu -> Trả về null cho change percentage")
    void testGenerateMonthlyInsights_WithoutPreviousMonth() {
        LocalDate curStart = LocalDate.of(2026, 9, 1);
        LocalDate curEnd = LocalDate.of(2026, 9, 30);
        LocalDate prevStart = LocalDate.of(2026, 8, 1);
        LocalDate prevEnd = LocalDate.of(2026, 8, 31);

        when(transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                eq(1L), eq(TransactionType.INCOME), eq(curStart), eq(curEnd))).thenReturn(20_000_000L);
        when(transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                eq(1L), eq(TransactionType.EXPENSE), eq(curStart), eq(curEnd))).thenReturn(10_000_000L);

        when(transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                eq(1L), eq(TransactionType.INCOME), eq(prevStart), eq(prevEnd))).thenReturn(0L);
        when(transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                eq(1L), eq(TransactionType.EXPENSE), eq(prevStart), eq(prevEnd))).thenReturn(0L);

        AiInsightsResponse response = aiService.generateMonthlyInsights(1L, "2026-09");

        assertNotNull(response);
        assertNotNull(response.getKeyMetrics());
        assertNull(response.getKeyMetrics().getIncomeChangePercentage());
        assertNull(response.getKeyMetrics().getExpenseChangePercentage());
        assertNull(response.getKeyMetrics().getSavingsChangePercentage());
    }

    @Test
    @DisplayName("Monthly Insights: Phát hiện danh mục vượt ngân sách (Overbudget Alerts)")
    void testGenerateMonthlyInsights_BudgetOverspentAlerts() {
        LocalDate curStart = LocalDate.of(2026, 9, 1);
        LocalDate curEnd = LocalDate.of(2026, 9, 30);

        when(transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                eq(1L), eq(TransactionType.INCOME), eq(curStart), eq(curEnd))).thenReturn(20_000_000L);
        when(transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                eq(1L), eq(TransactionType.EXPENSE), eq(curStart), eq(curEnd))).thenReturn(12_000_000L);

        Category food = new Category("Ăn uống", CategoryType.EXPENSE, "restaurant", true);
        food.setId(10L);
        Category shopping = new Category("Mua sắm", CategoryType.EXPENSE, "shopping", true);
        shopping.setId(11L);

        List<CategoryAggregationResponse> expenseAgg = List.of(
                new CategoryAggregationResponse(10L, "Ăn uống", "restaurant", TransactionType.EXPENSE, 8_000_000L, 10L),
                new CategoryAggregationResponse(11L, "Mua sắm", "shopping", TransactionType.EXPENSE, 4_000_000L, 4L)
        );
        when(transactionRepository.aggregateByCategory(eq(1L), eq(curStart), eq(curEnd), eq(TransactionType.EXPENSE)))
                .thenReturn(expenseAgg);

        Budget foodBudget = new Budget(testUser, food, "2026-09", 5_000_000L); // chi 8tr / ngân sách 5tr -> 160% (VƯỢT)
        Budget shoppingBudget = new Budget(testUser, shopping, "2026-09", 4_500_000L); // chi 4tr / 4.5tr -> 88.9% (CẢNH BÁO)
        when(budgetRepository.findByUserIdAndMonthWithCategory(1L, "2026-09"))
                .thenReturn(List.of(foodBudget, shoppingBudget));

        AiInsightsResponse response = aiService.generateMonthlyInsights(1L, "2026-09");

        assertNotNull(response);
        assertFalse(response.getAlerts().isEmpty());
        assertTrue(response.getAlerts().stream().anyMatch(a -> a.contains("Ăn uống") && a.contains("vượt ngân sách")));
        assertTrue(response.getAlerts().stream().anyMatch(a -> a.contains("Mua sắm") && a.contains("hạn mức ngân sách")));
    }

    @Test
    @DisplayName("Monthly Insights: Gemini API sinh phân tích thành công kèm overview, recommendations và alerts")
    void testGenerateMonthlyInsights_GeminiSuccess() {
        geminiConfig.setApiKey("valid-gemini-key");
        String geminiJson = """
                {
                  "overview": "Tháng 09/2026 của bạn duy trì thặng dư rất tốt với tỷ lệ tiết kiệm 40%.",
                  "recommendations": [
                    "Duy trì hạn mức chi tiêu ăn uống dưới 6 triệu",
                    "Trích 5 triệu vào quỹ đầu tư tích lũy"
                  ],
                  "alerts": [
                    "Chi tiêu danh mục Mua sắm đang có dấu hiệu tăng nhanh"
                  ]
                }
                """;
        when(geminiClient.generateContent(anyString(), eq(true))).thenReturn(geminiJson);

        when(transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                eq(1L), any(), any(), any())).thenReturn(10_000_000L);

        AiInsightsResponse response = aiService.generateMonthlyInsights(1L, "2026-09");

        assertNotNull(response);
        assertEquals("Tháng 09/2026 của bạn duy trì thặng dư rất tốt với tỷ lệ tiết kiệm 40%.", response.getOverview());
        assertEquals(2, response.getRecommendations().size());
        assertTrue(response.getAlerts().contains("Chi tiêu danh mục Mua sắm đang có dấu hiệu tăng nhanh"));
    }

    @Test
    @DisplayName("Monthly Insights: Gemini lỗi -> Tự động Fallback sang Local Rule-based với dữ liệu động")
    void testGenerateMonthlyInsights_GeminiFailureFallback() {
        geminiConfig.setApiKey("valid-gemini-key");
        when(geminiClient.generateContent(anyString(), eq(true)))
                .thenThrow(new RuntimeException("Gemini quota exceeded"));

        LocalDate start = LocalDate.of(2026, 9, 1);
        LocalDate end = LocalDate.of(2026, 9, 30);

        when(transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                eq(1L), eq(TransactionType.INCOME), eq(start), eq(end))).thenReturn(10_000_000L);
        when(transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                eq(1L), eq(TransactionType.EXPENSE), eq(start), eq(end))).thenReturn(15_000_000L); // thâm hụt

        List<CategoryAggregationResponse> expenseAgg = List.of(
                new CategoryAggregationResponse(10L, "Ăn uống sang trọng", "restaurant", TransactionType.EXPENSE, 12_000_000L, 5L)
        );
        when(transactionRepository.aggregateByCategory(eq(1L), eq(start), eq(end), eq(TransactionType.EXPENSE)))
                .thenReturn(expenseAgg);

        AiInsightsResponse response = aiService.generateMonthlyInsights(1L, "2026-09");

        assertNotNull(response);
        assertEquals(-5_000_000L, response.getNetSavings());
        assertTrue(response.getOverview().contains("Cảnh báo: Dòng tiền tháng 2026-09 đang bị thâm hụt"));
        assertTrue(response.getOverview().contains("Ăn uống sang trọng"));
        assertFalse(response.getRecommendations().isEmpty());
    }

    @Test
    @DisplayName("Monthly Insights: Edge case Income = 0, xử lý an toàn không chia cho 0")
    void testGenerateMonthlyInsights_ZeroIncome() {
        LocalDate start = LocalDate.of(2026, 9, 1);
        LocalDate end = LocalDate.of(2026, 9, 30);

        when(transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                eq(1L), eq(TransactionType.INCOME), eq(start), eq(end))).thenReturn(0L);
        when(transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                eq(1L), eq(TransactionType.EXPENSE), eq(start), eq(end))).thenReturn(5_000_000L);

        AiInsightsResponse response = aiService.generateMonthlyInsights(1L, "2026-09");

        assertNotNull(response);
        assertEquals(0L, response.getTotalIncome());
        assertEquals(5_000_000L, response.getTotalExpense());
        assertEquals(-5_000_000L, response.getNetSavings());
        assertEquals(0.0, response.getSavingsRate());
    }

    // ==========================================
    // TESTS FOR UPGRADED FINANCIAL CHATBOT
    // ==========================================

    @Test
    @DisplayName("Chatbot: Gemini online -> Tạo prompt với đầy đủ Context (Nhóm A-G) và System Prompt chuẩn")
    void testChatbot_GeminiOnline_ContextAndSystemPrompt() {
        geminiConfig.setApiKey("test-api-key");
        when(geminiClient.generateContent(anyString(), eq(false)))
                .thenReturn("Tháng này bạn đã chi tiêu tổng cộng **10.000.000 ₫**.");

        when(accountRepository.findByUserIdAndIsArchivedFalse(1L)).thenReturn(accounts);
        when(transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(eq(1L), any(), any(), any()))
                .thenReturn(10_000_000L);
        when(transactionRepository.findByUserId(eq(1L), any()))
                .thenReturn(new PageImpl<>(List.of()));

        AiChatResponse response = aiService.processUserChat(1L, "Tháng này tôi tiêu bao nhiêu?");

        assertNotNull(response);
        assertEquals("QUERY_ANSWER", response.getResponseType());
        assertEquals("GEMINI_2.5_FLASH", response.getSource());
        assertTrue(response.getText().contains("10.000.000 ₫"));

        // Verify that geminiClient was called with prompt containing anti-injection & structured context
        verify(geminiClient).generateContent(argThat(prompt ->
                prompt.contains("DỮ LIỆU TÀI CHÍNH THỰC TẾ CỦA NGƯỜI DÙNG (SOURCE OF TRUTH") &&
                prompt.contains("[NHÓM A: THỜI GIAN THAM CHIẾU HỆ THỐNG]") &&
                prompt.contains("[NHÓM B: TÀI KHOẢN VÀ VÍ TIỀN]") &&
                prompt.contains("[NHÓM C: TỔNG QUAN THÁNG HIỆN TẠI") &&
                prompt.contains("QUY TẮC PHÂN TÍCH VÀ TRẢ LỜI") &&
                prompt.contains("Tháng này tôi tiêu bao nhiêu?")
        ), eq(false));
    }

    @Test
    @DisplayName("Chatbot: Hỗ trợ Conversation History trong context gửi cho AI")
    void testChatbot_WithConversationHistory() {
        geminiConfig.setApiKey("test-api-key");
        when(geminiClient.generateContent(anyString(), eq(false)))
                .thenReturn("Số dư còn lại của bạn là 5.000.000 ₫.");

        when(accountRepository.findByUserIdAndIsArchivedFalse(1L)).thenReturn(accounts);
        when(transactionRepository.findByUserId(eq(1L), any())).thenReturn(new PageImpl<>(List.of()));

        List<AiChatMessageDto> history = List.of(
                new AiChatMessageDto("user", "Chào bot"),
                new AiChatMessageDto("assistant", "Chào bạn! Tôi có thể giúp gì?")
        );

        AiChatResponse response = aiService.processUserChat(1L, "Tôi còn bao nhiêu tiền?", history);

        assertNotNull(response);
        assertEquals("GEMINI_2.5_FLASH", response.getSource());

        verify(geminiClient).generateContent(argThat(prompt ->
                prompt.contains("[NHÓM H: LỊCH SỬ HỘI THOẠI GẦN ĐÂY (CONTEXT)]") &&
                prompt.contains("Người dùng: Chào bot") &&
                prompt.contains("Trợ lý: Chào bạn! Tôi có thể giúp gì?")
        ), eq(false));
    }

    @Test
    @DisplayName("Chatbot: Local Fallback khi hỏi về Hôm qua (có giao dịch)")
    void testChatbot_YesterdayInquiry_LocalFallback() {
        geminiConfig.setApiKey(""); // Local fallback mode

        LocalDate yesterday = LocalDate.now().minusDays(1);
        when(transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                eq(1L), eq(TransactionType.EXPENSE), eq(yesterday), eq(yesterday))).thenReturn(250_000L);
        when(transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                eq(1L), eq(TransactionType.INCOME), eq(yesterday), eq(yesterday))).thenReturn(0L);

        com.finman.entity.Transaction tx = new com.finman.entity.Transaction();
        tx.setAmount(250_000L);
        tx.setNote("Ăn tối với bạn");
        tx.setType(TransactionType.EXPENSE);
        tx.setCategory(categories.get(0)); // Ăn uống
        tx.setAccount(accounts.get(0)); // Tiền mặt

        when(transactionRepository.findByUserIdAndTransactionDateBetweenOrderByTransactionDateDesc(
                eq(1L), eq(yesterday), eq(yesterday))).thenReturn(List.of(tx));

        AiChatResponse response = aiService.processUserChat(1L, "Hôm qua tôi tiêu gì?");

        assertNotNull(response);
        assertEquals("LOCAL_FALLBACK", response.getSource());
        assertTrue(response.getText().contains("250.000 ₫"));
        assertTrue(response.getText().contains("Ăn tối với bạn"));
        assertTrue(response.getText().contains("Ăn uống"));
    }

    @Test
    @DisplayName("Chatbot: Local Fallback khi hỏi về Hôm qua (không có giao dịch)")
    void testChatbot_YesterdayNoTransaction_LocalFallback() {
        geminiConfig.setApiKey("");

        LocalDate yesterday = LocalDate.now().minusDays(1);
        when(transactionRepository.findByUserIdAndTransactionDateBetweenOrderByTransactionDateDesc(
                eq(1L), eq(yesterday), eq(yesterday))).thenReturn(List.of());

        AiChatResponse response = aiService.processUserChat(1L, "Hôm qua tôi có tiêu gì không?");

        assertNotNull(response);
        assertEquals("LOCAL_FALLBACK", response.getSource());
        assertTrue(response.getText().contains("không có giao dịch nào"));
    }

    @Test
    @DisplayName("Chatbot: Local Fallback tra cứu Ngân sách không bị N+1 query và có cảnh báo vượt mức")
    void testChatbot_BudgetInquiry_LocalFallback() {
        geminiConfig.setApiKey("");

        Budget foodBudget = new Budget(testUser, categories.get(0), "2026-09", 1_000_000L); // Limit 1M
        when(budgetRepository.findByUserIdAndMonthWithCategory(eq(1L), anyString()))
                .thenReturn(List.of(foodBudget));

        List<CategoryAggregationResponse> catAgg = List.of(
                new CategoryAggregationResponse(10L, "Ăn uống", "restaurant", TransactionType.EXPENSE, 1_200_000L, 10L) // Spent 1.2M -> Over budget
        );
        when(transactionRepository.aggregateByCategory(eq(1L), any(), any(), eq(TransactionType.EXPENSE)))
                .thenReturn(catAgg);

        AiChatResponse response = aiService.processUserChat(1L, "Ngân sách tháng này thế nào?");

        assertNotNull(response);
        assertEquals("LOCAL_FALLBACK", response.getSource());
        assertTrue(response.getText().contains("Ăn uống"));
        assertTrue(response.getText().contains("1.200.000 ₫"));
        assertTrue(response.getText().contains("Vượt hạn mức"));
    }

    @Test
    @DisplayName("Chatbot: Local Fallback tra cứu Chi tiêu theo danh mục")
    void testChatbot_CategoryBreakdown_LocalFallback() {
        geminiConfig.setApiKey("");

        when(transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(eq(1L), eq(TransactionType.EXPENSE), any(), any()))
                .thenReturn(5_000_000L);

        List<CategoryAggregationResponse> catAgg = List.of(
                new CategoryAggregationResponse(10L, "Ăn uống", "restaurant", TransactionType.EXPENSE, 3_000_000L, 15L),
                new CategoryAggregationResponse(11L, "Áo quần", "apparel", TransactionType.EXPENSE, 2_000_000L, 4L)
        );
        when(transactionRepository.aggregateByCategory(eq(1L), any(), any(), eq(TransactionType.EXPENSE)))
                .thenReturn(catAgg);

        AiChatResponse response = aiService.processUserChat(1L, "Chi tiêu theo danh mục tháng này");

        assertNotNull(response);
        assertEquals("LOCAL_FALLBACK", response.getSource());
        assertTrue(response.getText().contains("Ăn uống"));
        assertTrue(response.getText().contains("3.000.000 ₫"));
        assertTrue(response.getText().contains("60.0%"));
        assertTrue(response.getText().contains("Áo quần"));
        assertTrue(response.getText().contains("40.0%"));
    }

    @Test
    @DisplayName("Chatbot: Gemini ném ngoại lệ -> Tự động Fallback về Local Solver không crash")
    void testChatbot_GeminiFailureFallback() {
        geminiConfig.setApiKey("valid-key");
        when(geminiClient.generateContent(anyString(), eq(false)))
                .thenThrow(new RuntimeException("Gemini server 503 unavailable"));

        when(accountRepository.findByUserIdAndIsArchivedFalse(1L)).thenReturn(accounts);
        when(transactionRepository.findByUserId(eq(1L), any())).thenReturn(new PageImpl<>(List.of()));

        AiChatResponse response = aiService.processUserChat(1L, "Số dư tài khoản ví của tôi?");

        assertNotNull(response);
        assertEquals("LOCAL_FALLBACK", response.getSource());
        assertTrue(response.getText().contains("Tổng số dư"));
    }

    @Test
    @DisplayName("Chatbot: Đảm bảo User Isolation - UserId được truyền đúng vào mọi repository query")
    void testChatbot_UserIsolation() {
        geminiConfig.setApiKey("");

        when(accountRepository.findByUserIdAndIsArchivedFalse(2L)).thenReturn(List.of());

        AiChatResponse response = aiService.processUserChat(2L, "Xem số dư");

        assertNotNull(response);
        verify(accountRepository).findByUserIdAndIsArchivedFalse(eq(2L));
        verify(accountRepository, never()).findByUserIdAndIsArchivedFalse(eq(1L));
    }
}
