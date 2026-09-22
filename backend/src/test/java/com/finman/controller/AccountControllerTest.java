package com.finman.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finman.dto.request.AccountCreateRequest;
import com.finman.dto.request.AccountUpdateRequest;
import com.finman.entity.Account;
import com.finman.entity.User;
import com.finman.entity.enums.AccountType;
import com.finman.repository.AccountRepository;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AccountControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User userA;
    private User userB;
    private String tokenA;
    private String tokenB;

    @BeforeEach
    void setUp() {
        userA = new User("user.a@finman.com", "hashpassA", "Nguyễn Văn A");
        userA = userRepository.save(userA);
        tokenA = jwtTokenProvider.generateToken(userA.getId(), userA.getEmail());

        userB = new User("user.b@finman.com", "hashpassB", "Trần Thị B");
        userB = userRepository.save(userB);
        tokenB = jwtTokenProvider.generateToken(userB.getId(), userB.getEmail());
    }

    @Test
    @DisplayName("TC_ACC_01: Tạo ví Tiền mặt / Ngân hàng thành công")
    void testCreateAccount_CashBank_Success() throws Exception {
        AccountCreateRequest request = new AccountCreateRequest("Vietcombank", AccountType.BANK, 5_000_000L, 0L);

        mockMvc.perform(post("/api/v1/accounts")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Tạo tài khoản thành công"))
                .andExpect(jsonPath("$.data.name").value("Vietcombank"))
                .andExpect(jsonPath("$.data.type").value("BANK"))
                .andExpect(jsonPath("$.data.initialBalance").value(5000000))
                .andExpect(jsonPath("$.data.currentBalance").value(5000000));
    }

    @Test
    @DisplayName("TC_ACC_02: Tạo Thẻ tín dụng thành công với hạn mức và dư nợ ban đầu")
    void testCreateAccount_CreditCard_Success() throws Exception {
        AccountCreateRequest request = new AccountCreateRequest("Techcombank Visa", AccountType.CREDIT_CARD, 0L, 20_000_000L);

        mockMvc.perform(post("/api/v1/accounts")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Techcombank Visa"))
                .andExpect(jsonPath("$.data.type").value("CREDIT_CARD"))
                .andExpect(jsonPath("$.data.creditLimit").value(20000000))
                .andExpect(jsonPath("$.data.currentBalance").value(0));
    }

    @Test
    @DisplayName("TC_ACC_03: Tính toán Tài sản ròng (Net Worth = Assets - Liabilities)")
    void testGetAccountsSummary_NetWorthCalculation() throws Exception {
        // Create Cash wallet 2.000.000
        Account cash = new Account(userA, "Tiền mặt", AccountType.CASH, 2_000_000L);
        accountRepository.save(cash);

        // Create Bank wallet 5.000.000
        Account bank = new Account(userA, "VPBank", AccountType.BANK, 5_000_000L);
        accountRepository.save(bank);

        // Create Credit card debt 1.500.000
        Account credit = new Account(userA, "HSBC Visa", AccountType.CREDIT_CARD, 1_500_000L);
        credit.setCreditLimit(15_000_000L);
        accountRepository.save(credit);

        mockMvc.perform(get("/api/v1/accounts")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalAssets").value(7000000))       // 2M + 5M
                .andExpect(jsonPath("$.data.totalLiabilities").value(1500000)) // 1.5M
                .andExpect(jsonPath("$.data.netWorth").value(5500000))         // 7M - 1.5M
                .andExpect(jsonPath("$.data.accounts.length()").value(3));
    }

    @Test
    @DisplayName("TC_ACC_04: Xóa tài khoản (Soft Delete chuyển isArchived = true)")
    void testDeleteAccount_SoftDelete() throws Exception {
        Account account = new Account(userA, "Ví chi tiêu", AccountType.CASH, 1_000_000L);
        account = accountRepository.save(account);

        mockMvc.perform(delete("/api/v1/accounts/" + account.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Lưu trữ tài khoản thành công"));

        Account archived = accountRepository.findById(account.getId()).orElseThrow();
        assertTrue(archived.getIsArchived());
    }

    @Test
    @DisplayName("TC_ACC_05: Multi-tenant - Chặn User B truy cập hoặc xóa tài khoản của User A")
    void testMultiTenantIsolation() throws Exception {
        Account accountA = new Account(userA, "Ví cá nhân A", AccountType.CASH, 500_000L);
        accountA = accountRepository.save(accountA);

        // User B tries to view User A's account
        mockMvc.perform(get("/api/v1/accounts/" + accountA.getId())
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("RESOURCE_NOT_FOUND"));

        // User B tries to delete User A's account
        mockMvc.perform(delete("/api/v1/accounts/" + accountA.getId())
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    @DisplayName("Cập nhật thông tin tài khoản thành công")
    void testUpdateAccount_Success() throws Exception {
        Account account = new Account(userA, "Ví ban đầu", AccountType.CASH, 500_000L);
        account = accountRepository.save(account);

        AccountUpdateRequest updateRequest = new AccountUpdateRequest("Ví đã đổi tên", 0L, false);

        mockMvc.perform(put("/api/v1/accounts/" + account.getId())
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Ví đã đổi tên"));
    }

    @Test
    @DisplayName("Chặn tạo tài khoản trùng tên")
    void testCreateDuplicateAccountNameFails() throws Exception {
        Account existing = new Account(userA, "Ví Tiết Kiệm", AccountType.BANK, 1_000_000L);
        accountRepository.save(existing);

        AccountCreateRequest duplicate = new AccountCreateRequest("Ví Tiết Kiệm", AccountType.BANK, 2_000_000L, 0L);

        mockMvc.perform(post("/api/v1/accounts")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicate)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("BUSINESS_VALIDATION_ERROR"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("đã tồn tại")));
    }

    @Test
    @DisplayName("Chặn truy cập /api/v1/accounts khi không có token")
    void testAccessWithoutTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/accounts"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }
}
