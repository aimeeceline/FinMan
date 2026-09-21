package com.finman.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finman.dto.request.LoginRequest;
import com.finman.dto.request.RegisterRequest;
import com.finman.entity.Account;
import com.finman.entity.enums.AccountType;
import com.finman.repository.AccountRepository;
import com.finman.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Test
    @DisplayName("TC_AUTH_01: Đăng ký tài khoản mới thành công và tự động tạo ví Tiền mặt")
    void testRegisterSuccessAndCreatesDefaultCashAccount() throws Exception {
        RegisterRequest request = new RegisterRequest("john.doe@finman.com", "Password123", "John Doe");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Đăng ký tài khoản thành công"))
                .andExpect(jsonPath("$.data.token").isString())
                .andExpect(jsonPath("$.data.user.email").value("john.doe@finman.com"))
                .andExpect(jsonPath("$.data.user.fullName").value("John Doe"));

        // Verify default cash wallet created
        var userOpt = userRepository.findByEmail("john.doe@finman.com");
        assertEquals(true, userOpt.isPresent());

        List<Account> accounts = accountRepository.findByUserId(userOpt.get().getId());
        assertEquals(1, accounts.size());
        Account cashWallet = accounts.get(0);
        assertEquals("Tiền mặt", cashWallet.getName());
        assertEquals(AccountType.CASH, cashWallet.getType());
        assertEquals(0L, cashWallet.getCurrentBalance());
        assertEquals(0L, cashWallet.getInitialBalance());
    }

    @Test
    @DisplayName("TC_AUTH_02: Đăng ký thất bại khi email đã tồn tại")
    void testRegisterDuplicateEmailFails() throws Exception {
        RegisterRequest request1 = new RegisterRequest("dup@finman.com", "Password123", "User One");
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isCreated());

        RegisterRequest request2 = new RegisterRequest("dup@finman.com", "DifferentPass", "User Two");
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("EMAIL_ALREADY_EXISTS"));
    }

    @Test
    @DisplayName("Đăng ký thất bại khi thông tin không hợp lệ")
    void testRegisterValidationErrors() throws Exception {
        RegisterRequest invalidRequest = new RegisterRequest("not-an-email", "123", "");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"));
    }

    @Test
    @DisplayName("TC_AUTH_03 & TC_AUTH_05: Đăng nhập thành công và lấy thông tin /me")
    void testLoginSuccessAndGetMe() throws Exception {
        // Register first
        RegisterRequest regRequest = new RegisterRequest("login.test@finman.com", "MySecretPass", "Tester");
        MvcResult regResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        // Login
        LoginRequest loginRequest = new LoginRequest("login.test@finman.com", "MySecretPass");
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Đăng nhập thành công"))
                .andExpect(jsonPath("$.data.token").isString())
                .andExpect(jsonPath("$.data.user.email").value("login.test@finman.com"))
                .andReturn();

        // Extract token
        String json = loginResult.getResponse().getContentAsString();
        String token = objectMapper.readTree(json).path("data").path("token").asText();
        assertNotNull(token);

        // Call /api/v1/auth/me
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("login.test@finman.com"))
                .andExpect(jsonPath("$.data.fullName").value("Tester"));
    }

    @Test
    @DisplayName("TC_AUTH_04: Đăng nhập thất bại khi sai mật khẩu")
    void testLoginWrongPasswordFails() throws Exception {
        RegisterRequest regRequest = new RegisterRequest("wrong.pass@finman.com", "CorrectPass", "User");
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regRequest)))
                .andExpect(status().isCreated());

        LoginRequest wrongLogin = new LoginRequest("wrong.pass@finman.com", "WrongPass123");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongLogin)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("BAD_CREDENTIALS"));
    }

    @Test
    @DisplayName("Truy cập /me không có token bị chặn 401")
    void testGetMeWithoutTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }
}
