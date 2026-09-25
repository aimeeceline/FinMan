package com.finman.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finman.dto.request.BudgetRequest;
import com.finman.entity.Budget;
import com.finman.entity.Category;
import com.finman.entity.User;
import com.finman.entity.enums.CategoryType;
import com.finman.repository.BudgetRepository;
import com.finman.repository.CategoryRepository;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class BudgetControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User userA;
    private User userB;
    private String tokenA;
    private String tokenB;
    private Category expenseCat;
    private Category incomeCat;

    @BeforeEach
    void setUp() {
        userA = new User("budget.user.a@finman.com", "hashpassA", "Nguyễn Văn A");
        userA = userRepository.save(userA);
        tokenA = jwtTokenProvider.generateToken(userA.getId(), userA.getEmail());

        userB = new User("budget.user.b@finman.com", "hashpassB", "Trần Thị B");
        userB = userRepository.save(userB);
        tokenB = jwtTokenProvider.generateToken(userB.getId(), userB.getEmail());

        expenseCat = new Category(userA, "Ăn uống", CategoryType.EXPENSE, "🍜", false);
        expenseCat = categoryRepository.save(expenseCat);

        incomeCat = new Category(userA, "Lương", CategoryType.INCOME, "💵", false);
        incomeCat = categoryRepository.save(incomeCat);
    }

    @Test
    @DisplayName("API_BDG_01: Tạo / Cập nhật ngân sách thành công (201 Created)")
    void testSetBudget_Success() throws Exception {
        BudgetRequest request = new BudgetRequest(expenseCat.getId(), "2026-09", 3_000_000L);

        mockMvc.perform(post("/api/v1/budgets")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.amount").value(3_000_000))
                .andExpect(jsonPath("$.data.month").value("2026-09"))
                .andExpect(jsonPath("$.data.category.id").value(expenseCat.getId()));
    }

    @Test
    @DisplayName("API_BDG_02: Từ chối thiết lập ngân sách cho danh mục INCOME (400 Bad Request)")
    void testSetBudget_RejectIncomeCategory() throws Exception {
        BudgetRequest request = new BudgetRequest(incomeCat.getId(), "2026-09", 5_000_000L);

        mockMvc.perform(post("/api/v1/budgets")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Chỉ được đặt ngân sách cho danh mục chi tiêu"));
    }

    @Test
    @DisplayName("API_BDG_03: Lấy danh sách và tổng quan ngân sách tháng (200 OK)")
    void testGetBudgets_Success() throws Exception {
        Budget budget = new Budget(userA, expenseCat, "2026-09", 3_000_000L);
        budgetRepository.save(budget);

        mockMvc.perform(get("/api/v1/budgets")
                        .param("month", "2026-09")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].amount").value(3_000_000));

        mockMvc.perform(get("/api/v1/budgets/summary")
                        .param("month", "2026-09")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalBudget").value(3_000_000));
    }

    @Test
    @DisplayName("API_BDG_04: Xóa ngân sách thành công & Chống can thiệp người dùng khác (IDOR 404)")
    void testDeleteBudget_And_IdorProtection() throws Exception {
        Budget budget = new Budget(userA, expenseCat, "2026-09", 2_000_000L);
        budget = budgetRepository.save(budget);

        // User B không thể xóa ngân sách của User A
        mockMvc.perform(delete("/api/v1/budgets/" + budget.getId())
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));

        // User A xóa thành công
        mockMvc.perform(delete("/api/v1/budgets/" + budget.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("API_BDG_05: Từ chối truy cập khi không có JWT token (401 Unauthorized)")
    void testUnauthorized_NoToken() throws Exception {
        mockMvc.perform(get("/api/v1/budgets"))
                .andExpect(status().isUnauthorized());
    }
}
