package com.finman.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finman.dto.request.AiChatRequest;
import com.finman.dto.request.AiInsightsRequest;
import com.finman.dto.request.AiQuickAddRequest;
import com.finman.entity.Account;
import com.finman.entity.Category;
import com.finman.entity.Transaction;
import com.finman.entity.User;
import com.finman.entity.enums.AccountType;
import com.finman.entity.enums.CategoryType;
import com.finman.entity.enums.TransactionType;
import com.finman.repository.AccountRepository;
import com.finman.repository.CategoryRepository;
import com.finman.repository.TransactionRepository;
import com.finman.repository.UserRepository;
import com.finman.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User user;
    private String token;
    private Account cashAccount;
    private Account bankAccount;
    private Category foodCategory;
    private Category clothesCategory;
    private Category salaryCategory;

    @BeforeEach
    void setUp() {
        user = new User("ai.controller.user@finman.com", "hashedpass", "Lê Văn FinMan");
        user = userRepository.save(user);
        token = jwtTokenProvider.generateToken(user.getId(), user.getEmail());

        cashAccount = new Account(user, "Tiền mặt", AccountType.CASH, 2_000_000L);
        cashAccount = accountRepository.save(cashAccount);

        bankAccount = new Account(user, "Ngân hàng", AccountType.BANK, 10_000_000L);
        bankAccount = accountRepository.save(bankAccount);

        foodCategory = new Category(user, "Ăn uống", CategoryType.EXPENSE, "🍜", false);
        foodCategory = categoryRepository.save(foodCategory);

        clothesCategory = new Category(user, "Áo quần", CategoryType.EXPENSE, "👕", false);
        clothesCategory = categoryRepository.save(clothesCategory);

        salaryCategory = new Category(user, "Lương", CategoryType.INCOME, "💵", false);
        salaryCategory = categoryRepository.save(salaryCategory);

        // Thêm vài giao dịch mẫu cho tháng 2026-09
        Transaction incomeTxn = new Transaction(
                user, bankAccount, salaryCategory,
                TransactionType.INCOME, 15_000_000L,
                LocalDate.of(2026, 9, 5), "Lương công ty"
        );
        transactionRepository.save(incomeTxn);

        Transaction expenseTxn = new Transaction(
                user, cashAccount, foodCategory,
                TransactionType.EXPENSE, 1_500_000L,
                LocalDate.of(2026, 9, 10), "Ăn uống đầu tháng"
        );
        transactionRepository.save(expenseTxn);
    }

    @Test
    @DisplayName("API_AI_01: POST /api/v1/ai/quick-add - Nhập nhanh câu văn tiếng Việt có dấu")
    void testQuickAdd_ClearVietnamese_Success() throws Exception {
        AiQuickAddRequest request = new AiQuickAddRequest("Ăn bún bò 45k bằng tiền mặt");

        mockMvc.perform(post("/api/v1/ai/quick-add")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.type").value("EXPENSE"))
                .andExpect(jsonPath("$.data.amount").value(45000))
                .andExpect(jsonPath("$.data.categoryName").value("Ăn uống"))
                .andExpect(jsonPath("$.data.accountName").value("Tiền mặt"))
                .andExpect(jsonPath("$.data.note").isNotEmpty());
    }

    @Test
    @DisplayName("API_AI_02: POST /api/v1/ai/quick-add - Nhập nhanh tiếng Việt không dấu")
    void testQuickAdd_UnaccentedVietnamese_Success() throws Exception {
        AiQuickAddRequest request = new AiQuickAddRequest("mua ao so mi 350k the ngan hang");

        mockMvc.perform(post("/api/v1/ai/quick-add")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.type").value("EXPENSE"))
                .andExpect(jsonPath("$.data.amount").value(350000))
                .andExpect(jsonPath("$.data.categoryName").value("Áo quần"))
                .andExpect(jsonPath("$.data.accountName").value("Ngân hàng"));
    }

    @Test
    @DisplayName("API_AI_03: POST /api/v1/ai/quick-add - Lỗi khi câu lệnh rỗng hoặc chỉ có khoảng trắng")
    void testQuickAdd_EmptyText_BadRequest() throws Exception {
        AiQuickAddRequest request = new AiQuickAddRequest("   ");

        mockMvc.perform(post("/api/v1/ai/quick-add")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"));
    }

    @Test
    @DisplayName("API_AI_04: POST /api/v1/ai/quick-add - Lỗi khi câu không có thông tin số tiền giao dịch")
    void testQuickAdd_NoAmountText_BusinessValidationError() throws Exception {
        AiQuickAddRequest request = new AiQuickAddRequest("Xin chào FinMan hôm nay trời đẹp quá");

        mockMvc.perform(post("/api/v1/ai/quick-add")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Không thể nhận diện giao dịch. Vui lòng nhập rõ số tiền và nội dung."));
    }

    @Test
    @DisplayName("API_AI_05: POST /api/v1/ai/insights - Tạo nhận xét tài chính tháng qua Request Body")
    void testGenerateInsights_WithBody_Success() throws Exception {
        AiInsightsRequest request = new AiInsightsRequest("2026-09");

        mockMvc.perform(post("/api/v1/ai/insights")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.month").value("2026-09"))
                .andExpect(jsonPath("$.data.totalIncome").value(15_000_000))
                .andExpect(jsonPath("$.data.totalExpense").value(1_500_000))
                .andExpect(jsonPath("$.data.netSavings").value(13_500_000))
                .andExpect(jsonPath("$.data.overview").isNotEmpty())
                .andExpect(jsonPath("$.data.recommendations", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    @DisplayName("API_AI_06: POST /api/v1/ai/insights - Tạo nhận xét tài chính tháng qua Query Param")
    void testGenerateInsights_WithQueryParam_Success() throws Exception {
        mockMvc.perform(post("/api/v1/ai/insights")
                        .header("Authorization", "Bearer " + token)
                        .param("month", "2026-09"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.month").value("2026-09"))
                .andExpect(jsonPath("$.data.netSavings").value(13_500_000));
    }

    @Test
    @DisplayName("API_AI_07: POST /api/v1/ai/insights - Mặc định tháng hiện tại khi không truyền month")
    void testGenerateInsights_DefaultCurrentMonth_Success() throws Exception {
        String currentMonth = YearMonth.now().toString();

        mockMvc.perform(post("/api/v1/ai/insights")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.month").value(currentMonth));
    }

    @Test
    @DisplayName("API_AI_08: POST /api/v1/ai/insights - Báo lỗi khi định dạng tháng không hợp lệ")
    void testGenerateInsights_InvalidMonth_BadRequest() throws Exception {
        AiInsightsRequest request = new AiInsightsRequest("2026-9");

        mockMvc.perform(post("/api/v1/ai/insights")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("API_AI_09: GET /api/v1/ai/insights - Lấy nhận xét tài chính qua GET")
    void testGetInsights_Success() throws Exception {
        mockMvc.perform(get("/api/v1/ai/insights")
                        .header("Authorization", "Bearer " + token)
                        .param("month", "2026-09"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.month").value("2026-09"))
                .andExpect(jsonPath("$.data.overview").isNotEmpty());
    }

    @Test
    @DisplayName("API_AI_10: Từ chối truy cập khi không có Bearer token (401 Unauthorized)")
    void testUnauthorized_NoToken() throws Exception {
        mockMvc.perform(post("/api/v1/ai/quick-add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"Ăn phở 50k\"}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/ai/insights"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("API_AI_11: GET /api/v1/ai/status - Cho phép truy cập công khai kiểm tra trạng thái AI")
    void testGetAiStatus_PermitAll() throws Exception {
        mockMvc.perform(get("/api/v1/ai/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.model").value("gemini-2.5-flash"))
                .andExpect(jsonPath("$.data.geminiConnected").isBoolean());
    }

    @Test
    @DisplayName("API_AI_12: POST /api/v1/ai/chat - Trò chuyện truy vấn số dư tài khoản (QUERY_ANSWER)")
    void testChat_QueryData_Success() throws Exception {
        AiChatRequest request = new AiChatRequest("Số dư tài khoản của tôi hiện tại là bao nhiêu?");

        mockMvc.perform(post("/api/v1/ai/chat")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.responseType").value("QUERY_ANSWER"))
                .andExpect(jsonPath("$.data.text").isNotEmpty());
    }

    @Test
    @DisplayName("API_AI_13: POST /api/v1/ai/chat - Trò chuyện nhập nhanh nhiều giao dịch (QUICK_ADD with items)")
    void testChat_QuickAddMulti_Success() throws Exception {
        AiChatRequest request = new AiChatRequest("Ăn bún bò 45k ví tiền mặt và mua áo 200k");

        mockMvc.perform(post("/api/v1/ai/chat")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.responseType").value("QUICK_ADD"))
                .andExpect(jsonPath("$.data.items", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @DisplayName("API_AI_14: POST /api/v1/ai/query - Truy vấn trực tiếp số liệu cá nhân")
    void testQueryData_Direct_Success() throws Exception {
        AiChatRequest request = new AiChatRequest("Hôm nay tôi đã chi tiêu bao nhiêu tiền?");

        mockMvc.perform(post("/api/v1/ai/query")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.responseType").value("QUERY_ANSWER"))
                .andExpect(jsonPath("$.data.text").isNotEmpty());
    }

    @Test
    @DisplayName("API_AI_15: POST /api/v1/ai/chat - Báo lỗi khi request body message bị rỗng")
    void testChat_EmptyMessage_BadRequest() throws Exception {
        AiChatRequest request = new AiChatRequest("   ");

        mockMvc.perform(post("/api/v1/ai/chat")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
