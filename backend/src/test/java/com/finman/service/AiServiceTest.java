package com.finman.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finman.client.GeminiClient;
import com.finman.client.GeminiClientImpl;
import com.finman.config.GeminiConfig;
import com.finman.dto.response.AiChatResponse;
import com.finman.dto.response.AiInsightsResponse;
import com.finman.dto.response.AiQuickAddResponse;
import com.finman.entity.Account;
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
}

