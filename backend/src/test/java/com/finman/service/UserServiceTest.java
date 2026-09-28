package com.finman.service;

import com.finman.dto.request.ChangePasswordRequest;
import com.finman.dto.request.UpdateProfileRequest;
import com.finman.dto.response.UserResponse;
import com.finman.entity.User;
import com.finman.exception.BusinessValidationException;
import com.finman.exception.ResourceNotFoundException;
import com.finman.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User("user@finman.com", "encodedPassword123", "Nguyễn Văn A");
        testUser.setId(1L);
        testUser.setAvatarUrl("https://example.com/avatar.png");
    }

    @Test
    @DisplayName("Lấy thông tin cá nhân thành công")
    void testGetProfile_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        UserResponse response = userService.getProfile(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("user@finman.com", response.getEmail());
        assertEquals("Nguyễn Văn A", response.getFullName());
        assertEquals("https://example.com/avatar.png", response.getAvatarUrl());
        verify(userRepository).findById(1L);
    }

    @Test
    @DisplayName("Lấy thông tin cá nhân thất bại khi người dùng không tồn tại")
    void testGetProfile_UserNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userService.getProfile(999L));
    }

    @Test
    @DisplayName("Cập nhật thông tin cá nhân thành công")
    void testUpdateProfile_Success() {
        UpdateProfileRequest request = new UpdateProfileRequest("Nguyễn Văn B", "https://example.com/new_avatar.png");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = userService.updateProfile(1L, request);

        assertNotNull(response);
        assertEquals("Nguyễn Văn B", response.getFullName());
        assertEquals("https://example.com/new_avatar.png", response.getAvatarUrl());
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("Đổi mật khẩu thành công khi thông tin hợp lệ")
    void testChangePassword_Success() {
        ChangePasswordRequest request = new ChangePasswordRequest("OldPass123!", "NewPass456!", "NewPass456!");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("OldPass123!", "encodedPassword123")).thenReturn(true);
        when(passwordEncoder.matches("NewPass456!", "encodedPassword123")).thenReturn(false);
        when(passwordEncoder.encode("NewPass456!")).thenReturn("newEncodedPassword456");

        userService.changePassword(1L, request);

        assertEquals("newEncodedPassword456", testUser.getPasswordHash());
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("Đổi mật khẩu thất bại khi mật khẩu hiện tại không đúng")
    void testChangePassword_WrongCurrentPassword() {
        ChangePasswordRequest request = new ChangePasswordRequest("WrongPass!", "NewPass456!", "NewPass456!");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("WrongPass!", "encodedPassword123")).thenReturn(false);

        BusinessValidationException ex = assertThrows(BusinessValidationException.class,
                () -> userService.changePassword(1L, request));
        assertEquals("INVALID_CURRENT_PASSWORD", ex.getErrorCode());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Đổi mật khẩu thất bại khi mật khẩu mới trùng mật khẩu cũ")
    void testChangePassword_SamePassword() {
        ChangePasswordRequest request = new ChangePasswordRequest("OldPass123!", "OldPass123!", "OldPass123!");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("OldPass123!", "encodedPassword123")).thenReturn(true);

        BusinessValidationException ex = assertThrows(BusinessValidationException.class,
                () -> userService.changePassword(1L, request));
        assertEquals("NEW_PASSWORD_SAME_AS_OLD", ex.getErrorCode());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Đổi mật khẩu thất bại khi xác nhận mật khẩu không khớp")
    void testChangePassword_ConfirmMismatch() {
        ChangePasswordRequest request = new ChangePasswordRequest("OldPass123!", "NewPass456!", "DifferentPass789!");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("OldPass123!", "encodedPassword123")).thenReturn(true);
        when(passwordEncoder.matches("NewPass456!", "encodedPassword123")).thenReturn(false);

        BusinessValidationException ex = assertThrows(BusinessValidationException.class,
                () -> userService.changePassword(1L, request));
        assertEquals("PASSWORD_CONFIRMATION_MISMATCH", ex.getErrorCode());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Đăng xuất không ném lỗi")
    void testLogout_Success() {
        assertDoesNotThrow(() -> userService.logout(1L));
    }
}
