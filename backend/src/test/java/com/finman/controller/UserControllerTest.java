package com.finman.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finman.dto.request.ChangePasswordRequest;
import com.finman.dto.request.UpdateProfileRequest;
import com.finman.entity.User;
import com.finman.repository.UserRepository;
import com.finman.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testUser;
    private String token;

    @BeforeEach
    void setUp() {
        testUser = new User("user.profile@finman.com", passwordEncoder.encode("CurrentPass123"), "Lê Văn Profile");
        testUser.setAvatarUrl("https://example.com/avatar.png");
        testUser = userRepository.save(testUser);
        token = jwtTokenProvider.generateToken(testUser.getId(), testUser.getEmail());
    }

    @Test
    @DisplayName("TC_USER_01: Lấy thông tin cá nhân thành công qua /api/v1/users/profile")
    void testGetProfile_Success() throws Exception {
        mockMvc.perform(get("/api/v1/users/profile")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Lấy thông tin cá nhân thành công"))
                .andExpect(jsonPath("$.data.id").value(testUser.getId()))
                .andExpect(jsonPath("$.data.email").value("user.profile@finman.com"))
                .andExpect(jsonPath("$.data.fullName").value("Lê Văn Profile"))
                .andExpect(jsonPath("$.data.avatarUrl").value("https://example.com/avatar.png"));
    }

    @Test
    @DisplayName("TC_USER_02: Lấy thông tin cá nhân qua alias /api/v1/users/me và /api/v1/user/profile")
    void testGetProfile_Aliases() throws Exception {
        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("user.profile@finman.com"));

        mockMvc.perform(get("/api/v1/user/profile")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("user.profile@finman.com"));
    }

    @Test
    @DisplayName("TC_USER_03: Lấy thông tin cá nhân không có token bị từ chối 401")
    void testGetProfile_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/users/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("TC_USER_04: Cập nhật họ tên và ảnh đại diện thành công")
    void testUpdateProfile_Success() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest("Lê Thị Profile Mới", "https://example.com/new-avatar.png");

        mockMvc.perform(put("/api/v1/users/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Cập nhật thông tin cá nhân thành công"))
                .andExpect(jsonPath("$.data.fullName").value("Lê Thị Profile Mới"))
                .andExpect(jsonPath("$.data.avatarUrl").value("https://example.com/new-avatar.png"));

        User updatedUser = userRepository.findById(testUser.getId()).orElseThrow();
        assertEquals("Lê Thị Profile Mới", updatedUser.getFullName());
        assertEquals("https://example.com/new-avatar.png", updatedUser.getAvatarUrl());
    }

    @Test
    @DisplayName("TC_USER_05: Cập nhật thông tin thất bại khi họ tên rỗng")
    void testUpdateProfile_ValidationError_BlankName() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest("   ", "https://example.com/avatar.png");

        mockMvc.perform(put("/api/v1/users/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("TC_USER_06: Đổi mật khẩu thành công qua POST /api/v1/users/change-password")
    void testChangePassword_Success() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest(
                "CurrentPass123",
                "NewSecretPass456",
                "NewSecretPass456"
        );

        mockMvc.perform(post("/api/v1/users/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Đổi mật khẩu thành công"));

        User reloadedUser = userRepository.findById(testUser.getId()).orElseThrow();
        assertTrue(passwordEncoder.matches("NewSecretPass456", reloadedUser.getPasswordHash()));
    }

    @Test
    @DisplayName("TC_USER_07: Đổi mật khẩu thành công qua PUT /api/v1/users/change-password")
    void testChangePassword_Put_Success() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest(
                "CurrentPass123",
                "BrandNewPass789",
                "BrandNewPass789"
        );

        mockMvc.perform(put("/api/v1/users/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("TC_USER_08: Đổi mật khẩu thất bại khi mật khẩu hiện tại không đúng")
    void testChangePassword_InvalidCurrentPassword() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest(
                "WrongCurrentPass",
                "NewSecretPass456",
                "NewSecretPass456"
        );

        mockMvc.perform(post("/api/v1/users/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("INVALID_CURRENT_PASSWORD"));
    }

    @Test
    @DisplayName("TC_USER_09: Đổi mật khẩu thất bại khi mật khẩu xác nhận không khớp")
    void testChangePassword_PasswordMismatch() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest(
                "CurrentPass123",
                "NewSecretPass456",
                "MismatchPass789"
        );

        mockMvc.perform(post("/api/v1/users/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("PASSWORD_CONFIRMATION_MISMATCH"));
    }

    @Test
    @DisplayName("TC_USER_10: Đổi mật khẩu thất bại khi mật khẩu mới trùng mật khẩu hiện tại")
    void testChangePassword_SameAsCurrent() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest(
                "CurrentPass123",
                "CurrentPass123",
                "CurrentPass123"
        );

        mockMvc.perform(post("/api/v1/users/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("NEW_PASSWORD_SAME_AS_OLD"));
    }

    @Test
    @DisplayName("TC_USER_11: Đổi mật khẩu thất bại khi mật khẩu mới quá ngắn")
    void testChangePassword_ValidationError_ShortPassword() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest(
                "CurrentPass123",
                "12345",
                "12345"
        );

        mockMvc.perform(post("/api/v1/users/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("TC_USER_12: Đăng xuất người dùng thành công")
    void testLogout_Success() throws Exception {
        mockMvc.perform(post("/api/v1/users/logout")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Đăng xuất thành công"));
    }
}
