package com.finman.controller;

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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class StatisticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

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
    private Account account;
    private Category catSalary;
    private Category catShopping;

    @BeforeEach
    void setUp() {
        user = new User("stats.ctrl@finman.com", "pass123", "Nguyễn Minh Khang");
        user = userRepository.save(user);
        token = jwtTokenProvider.generateToken(user.getId(), user.getEmail());

        account = new Account(user, "Ví MoMo", AccountType.BANK, 10_000_000L);
        account = accountRepository.save(account);

        catSalary = new Category(user, "Lương", CategoryType.INCOME, "payments", false);
        catSalary = categoryRepository.save(catSalary);

        catShopping = new Category(user, "Mua sắm", CategoryType.EXPENSE, "shopping_cart", false);
        catShopping = categoryRepository.save(catShopping);

        Transaction t1 = new Transaction(
                user, account, catSalary, TransactionType.INCOME, 6_000_000L,
                LocalDate.of(2026, 9, 1), "Lương tháng 9");
        transactionRepository.save(t1);

        Transaction t2 = new Transaction(
                user, account, catShopping, TransactionType.EXPENSE, 1_000_000L,
                LocalDate.of(2026, 9, 12), "Quần áo Zara");
        transactionRepository.save(t2);
    }

    @Test
    @DisplayName("API_STATS_01: GET /api/v1/statistics/overview - Lấy tổng quan thống kê thành công")
    void testGetOverview_Success() throws Exception {
        mockMvc.perform(get("/api/v1/statistics/overview")
                        .header("Authorization", "Bearer " + token)
                        .param("month", "2026-09"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalIncome").value(6_000_000))
                .andExpect(jsonPath("$.data.totalExpense").value(1_000_000))
                .andExpect(jsonPath("$.data.netCashFlow").value(5_000_000))
                .andExpect(jsonPath("$.data.savingsRate").value(83.3))
                .andExpect(jsonPath("$.data.transactionCount").value(2))
                .andExpect(jsonPath("$.data.categoryBreakdown", hasSize(1)))
                .andExpect(jsonPath("$.data.categoryBreakdown[0].categoryName").value("Mua sắm"))
                .andExpect(jsonPath("$.data.categoryBreakdown[0].percentage").value(100.0))
                .andExpect(jsonPath("$.data.dailyTrends", not(empty())))
                .andExpect(jsonPath("$.data.topExpenses", hasSize(1)));
    }

    @Test
    @DisplayName("API_STATS_02: GET /api/v1/statistics/categories - Lấy tỷ trọng danh mục thành công")
    void testGetCategoryBreakdown_Success() throws Exception {
        mockMvc.perform(get("/api/v1/statistics/categories")
                        .header("Authorization", "Bearer " + token)
                        .param("month", "2026-09")
                        .param("type", "EXPENSE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].categoryName").value("Mua sắm"))
                .andExpect(jsonPath("$.data[0].totalAmount").value(1_000_000))
                .andExpect(jsonPath("$.data[0].percentage").value(100.0));
    }

    @Test
    @DisplayName("API_STATS_03: GET /api/v1/statistics/daily - Lấy xu hướng dòng tiền theo ngày thành công")
    void testGetDailyTrends_Success() throws Exception {
        mockMvc.perform(get("/api/v1/statistics/daily")
                        .header("Authorization", "Bearer " + token)
                        .param("month", "2026-09"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].date").value("2026-09-01"))
                .andExpect(jsonPath("$.data[0].income").value(6_000_000))
                .andExpect(jsonPath("$.data[1].date").value("2026-09-12"))
                .andExpect(jsonPath("$.data[1].expense").value(1_000_000));
    }

    @Test
    @DisplayName("API_STATS_04: GET /api/v1/statistics/overview - Báo lỗi 401 khi chưa đăng nhập")
    void testGetOverview_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/statistics/overview"))
                .andExpect(status().isUnauthorized());
    }
}
