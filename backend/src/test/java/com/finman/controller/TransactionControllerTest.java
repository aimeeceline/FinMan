package com.finman.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finman.dto.request.TransactionCreateRequest;
import com.finman.dto.request.TransactionUpdateRequest;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class TransactionControllerTest {

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

    private User userA;
    private User userB;
    private String tokenA;
    private String tokenB;
    private Account accountA1;
    private Account accountA2;
    private Category categoryExpense;
    private Category categoryIncome;

    @BeforeEach
    void setUp() {
        userA = new User("txn.user.a@finman.com", "hashpassA", "Nguyễn Văn A");
        userA = userRepository.save(userA);
        tokenA = jwtTokenProvider.generateToken(userA.getId(), userA.getEmail());

        userB = new User("txn.user.b@finman.com", "hashpassB", "Trần Thị B");
        userB = userRepository.save(userB);
        tokenB = jwtTokenProvider.generateToken(userB.getId(), userB.getEmail());

        accountA1 = new Account(userA, "Ví Tiền mặt", AccountType.CASH, 3_000_000L);
        accountA1 = accountRepository.save(accountA1);

        accountA2 = new Account(userA, "Tài khoản VCB", AccountType.BANK, 5_000_000L);
        accountA2 = accountRepository.save(accountA2);

        categoryExpense = new Category(userA, "Ăn uống", CategoryType.EXPENSE, "restaurant", false);
        categoryExpense = categoryRepository.save(categoryExpense);

        categoryIncome = new Category(userA, "Tiền lương", CategoryType.INCOME, "payments", false);
        categoryIncome = categoryRepository.save(categoryIncome);
    }

    @Test
    @DisplayName("TC_TXN_01: Thêm giao dịch Thu nhập (INCOME) thành công (+ balance)")
    void testCreateIncomeTransaction_Success() throws Exception {
        accountA1.setCurrentBalance(1_000_000L);
        accountA1 = accountRepository.save(accountA1);

        TransactionCreateRequest request = new TransactionCreateRequest(
                accountA1.getId(), categoryIncome.getId(), TransactionType.INCOME, 2_000_000L, LocalDate.now(), "Lương công ty");

        mockMvc.perform(post("/api/v1/transactions")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.amount").value(2_000_000L))
                .andExpect(jsonPath("$.data.type").value("INCOME"))
                .andExpect(jsonPath("$.data.account.name").value("Ví Tiền mặt"))
                .andExpect(jsonPath("$.data.category.name").value("Tiền lương"));

        Account refreshed = accountRepository.findById(accountA1.getId()).orElseThrow();
        assertEquals(3_000_000L, refreshed.getCurrentBalance()); // 1M + 2M = 3M
    }

    @Test
    @DisplayName("TC_TXN_02: Thêm giao dịch Chi tiêu (EXPENSE) thành công (- balance)")
    void testCreateExpenseTransaction_Success() throws Exception {
        TransactionCreateRequest request = new TransactionCreateRequest(
                accountA1.getId(), categoryExpense.getId(), TransactionType.EXPENSE, 800_000L, LocalDate.now(), "Ăn tối cùng bạn");

        mockMvc.perform(post("/api/v1/transactions")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.amount").value(800_000L))
                .andExpect(jsonPath("$.data.type").value("EXPENSE"));

        Account refreshed = accountRepository.findById(accountA1.getId()).orElseThrow();
        assertEquals(2_200_000L, refreshed.getCurrentBalance()); // 3M - 800k = 2.2M
    }

    @Test
    @DisplayName("TC_TXN_03: Chỉnh sửa số tiền giao dịch thành công (hoàn tác cũ, áp dụng mới)")
    void testUpdateTransaction_AmountChange_Success() throws Exception {
        // Tạo giao dịch chi tiêu 800k (ví còn 2.2M)
        Transaction tx = new Transaction(userA, accountA1, categoryExpense, TransactionType.EXPENSE, 800_000L, LocalDate.now(), "Ăn tối");
        tx = transactionRepository.save(tx);
        accountA1.setCurrentBalance(2_200_000L);
        accountRepository.save(accountA1);

        // Đổi số tiền lên 1.000.000đ
        TransactionUpdateRequest request = new TransactionUpdateRequest(
                accountA1.getId(), categoryExpense.getId(), TransactionType.EXPENSE, 1_000_000L, LocalDate.now(), "Ăn buffet hải sản");

        mockMvc.perform(put("/api/v1/transactions/" + tx.getId())
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.amount").value(1_000_000L));

        Account refreshed = accountRepository.findById(accountA1.getId()).orElseThrow();
        // 2.2M + 800k - 1M = 2.0M
        assertEquals(2_000_000L, refreshed.getCurrentBalance());
    }

    @Test
    @DisplayName("TC_TXN_04: Chỉnh sửa đổi ví phát sinh giao dịch thành công")
    void testUpdateTransaction_ChangeAccount_Success() throws Exception {
        // Chi 500k từ ví A1 (3M còn 2.5M)
        Transaction tx = new Transaction(userA, accountA1, categoryExpense, TransactionType.EXPENSE, 500_000L, LocalDate.now(), "Mua sắm");
        tx = transactionRepository.save(tx);
        accountA1.setCurrentBalance(2_500_000L);
        accountRepository.save(accountA1);

        // Đổi sang ví A2 (5M)
        TransactionUpdateRequest request = new TransactionUpdateRequest(
                accountA2.getId(), categoryExpense.getId(), TransactionType.EXPENSE, 500_000L, LocalDate.now(), "Mua sắm bằng VCB");

        mockMvc.perform(put("/api/v1/transactions/" + tx.getId())
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.account.id").value(accountA2.getId()));

        Account refreshedA1 = accountRepository.findById(accountA1.getId()).orElseThrow();
        Account refreshedA2 = accountRepository.findById(accountA2.getId()).orElseThrow();

        assertEquals(3_000_000L, refreshedA1.getCurrentBalance()); // A1 hoàn tác 500k -> 3M
        assertEquals(4_500_000L, refreshedA2.getCurrentBalance()); // A2 trừ 500k -> 4.5M
    }

    @Test
    @DisplayName("TC_TXN_05: Xóa giao dịch Chi tiêu hoàn trả số dư")
    void testDeleteExpenseTransaction_Success() throws Exception {
        Transaction tx = new Transaction(userA, accountA1, categoryExpense, TransactionType.EXPENSE, 500_000L, LocalDate.now(), "Mua áo");
        tx = transactionRepository.save(tx);
        accountA1.setCurrentBalance(1_500_000L);
        accountRepository.save(accountA1);

        mockMvc.perform(delete("/api/v1/transactions/" + tx.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertFalse(transactionRepository.existsById(tx.getId()));
        Account refreshed = accountRepository.findById(accountA1.getId()).orElseThrow();
        assertEquals(2_000_000L, refreshed.getCurrentBalance()); // 1.5M + 500k = 2M
    }

    @Test
    @DisplayName("TC_TXN_06: Xóa giao dịch Thu nhập khấu trừ lại số dư")
    void testDeleteIncomeTransaction_Success() throws Exception {
        Transaction tx = new Transaction(userA, accountA1, categoryIncome, TransactionType.INCOME, 1_000_000L, LocalDate.now(), "Thưởng");
        tx = transactionRepository.save(tx);
        accountA1.setCurrentBalance(2_000_000L);
        accountRepository.save(accountA1);

        mockMvc.perform(delete("/api/v1/transactions/" + tx.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk());

        assertFalse(transactionRepository.existsById(tx.getId()));
        Account refreshed = accountRepository.findById(accountA1.getId()).orElseThrow();
        assertEquals(1_000_000L, refreshed.getCurrentBalance()); // 2M - 1M = 1M
    }

    @Test
    @DisplayName("TC_TXN_07: Chặn số tiền không hợp lệ (Validation số tiền <= 0)")
    void testCreateTransaction_InvalidAmount_BadRequest() throws Exception {
        TransactionCreateRequest request = new TransactionCreateRequest(
                accountA1.getId(), categoryExpense.getId(), TransactionType.EXPENSE, 0L, LocalDate.now(), "Không đồng");

        mockMvc.perform(post("/api/v1/transactions")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TC_TXN_08: Tính toàn vẹn Database Transaction (Rollback khi gặp lỗi, số dư không đổi)")
    void testCreateTransaction_RollbackOnFailure_BalancePreserved() throws Exception {
        Long initialBalance = accountA1.getCurrentBalance();

        // Gửi request sai danh mục (category loại INCOME nhưng giao dịch loại EXPENSE)
        TransactionCreateRequest request = new TransactionCreateRequest(
                accountA1.getId(), categoryIncome.getId(), TransactionType.EXPENSE, 500_000L, LocalDate.now(), "Lỗi khớp danh mục");

        mockMvc.perform(post("/api/v1/transactions")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        // Xác nhận số dư ví được bảo toàn nguyên trạng, không bị trừ tiền
        Account refreshed = accountRepository.findById(accountA1.getId()).orElseThrow();
        assertEquals(initialBalance, refreshed.getCurrentBalance());
    }

    @Test
    @DisplayName("TC_TXN_09: Lấy danh sách giao dịch & Phân trang, Lọc theo tháng")
    void testGetTransactions_MonthFilter_Success() throws Exception {
        LocalDate dateSept = LocalDate.of(2026, 9, 15);
        LocalDate dateAugust = LocalDate.of(2026, 8, 20);

        Transaction tx1 = new Transaction(userA, accountA1, categoryExpense, TransactionType.EXPENSE, 100_000L, dateSept, "Sept tx");
        Transaction tx2 = new Transaction(userA, accountA1, categoryExpense, TransactionType.EXPENSE, 200_000L, dateAugust, "Aug tx");
        transactionRepository.save(tx1);
        transactionRepository.save(tx2);

        mockMvc.perform(get("/api/v1/transactions")
                        .header("Authorization", "Bearer " + tokenA)
                        .param("month", "2026-09"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].note").value("Sept tx"));
    }

    @Test
    @DisplayName("TC_TXN_SUMMARY: Thống kê dòng tiền tóm tắt theo tháng")
    void testGetTransactionSummary_Success() throws Exception {
        LocalDate dateSept = LocalDate.of(2026, 9, 10);
        transactionRepository.save(new Transaction(userA, accountA1, categoryIncome, TransactionType.INCOME, 10_000_000L, dateSept, "Lương"));
        transactionRepository.save(new Transaction(userA, accountA1, categoryExpense, TransactionType.EXPENSE, 3_000_000L, dateSept, "Tiền nhà"));

        mockMvc.perform(get("/api/v1/transactions/summary")
                        .header("Authorization", "Bearer " + tokenA)
                        .param("month", "2026-09"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalIncome").value(10_000_000L))
                .andExpect(jsonPath("$.data.totalExpense").value(3_000_000L))
                .andExpect(jsonPath("$.data.netCashFlow").value(7_000_000L))
                .andExpect(jsonPath("$.data.transactionCount").value(2));
    }

    @Test
    @DisplayName("TC_TXN_MULTI_TENANT: User B không thể truy cập hoặc xóa giao dịch của User A")
    void testMultiTenantIsolation_ForbiddenOrNotFound() throws Exception {
        Transaction txA = new Transaction(userA, accountA1, categoryExpense, TransactionType.EXPENSE, 100_000L, LocalDate.now(), "Tx của A");
        txA = transactionRepository.save(txA);

        // User B cố lấy chi tiết giao dịch của A
        mockMvc.perform(get("/api/v1/transactions/" + txA.getId())
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());

        // User B cố xóa giao dịch của A
        mockMvc.perform(delete("/api/v1/transactions/" + txA.getId())
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("TC_TXN_SECURITY: Chặn truy cập khi không có Bearer token")
    void testUnauthorized_Returns401() throws Exception {
        mockMvc.perform(get("/api/v1/transactions"))
                .andExpect(status().isUnauthorized());
    }
}
