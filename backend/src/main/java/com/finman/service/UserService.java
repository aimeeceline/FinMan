package com.finman.service;

import com.finman.dto.request.ChangePasswordRequest;
import com.finman.dto.request.UpdateProfileRequest;
import com.finman.dto.response.UserResponse;
import com.finman.entity.User;
import com.finman.exception.BusinessValidationException;
import com.finman.exception.ResourceNotFoundException;
import com.finman.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Lấy thông tin hồ sơ người dùng hiện tại
     */
    @Transactional(readOnly = true)
    public UserResponse getProfile(Long userId) {
        User user = findUserById(userId);
        return UserResponse.from(user);
    }

    /**
     * Cập nhật thông tin cá nhân (họ tên, ảnh đại diện)
     */
    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = findUserById(userId);

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }

        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl().trim());
        }

        User updatedUser = userRepository.save(user);
        log.info("Cập nhật thông tin cá nhân thành công cho user ID: {}", userId);
        return UserResponse.from(updatedUser);
    }

    /**
     * Đổi mật khẩu tài khoản
     */
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = findUserById(userId);

        // 1. Kiểm tra mật khẩu hiện tại có đúng không
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BusinessValidationException(
                    "Mật khẩu hiện tại không chính xác",
                    "INVALID_CURRENT_PASSWORD"
            );
        }

        // 2. Kiểm tra mật khẩu mới không được trùng mật khẩu cũ
        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new BusinessValidationException(
                    "Mật khẩu mới không được trùng với mật khẩu hiện tại",
                    "NEW_PASSWORD_SAME_AS_OLD"
            );
        }

        // 3. Kiểm tra xác nhận mật khẩu nếu có truyền
        if (request.getConfirmPassword() != null && !request.getConfirmPassword().isBlank()) {
            if (!request.getNewPassword().equals(request.getConfirmPassword())) {
                throw new BusinessValidationException(
                        "Xác nhận mật khẩu mới không khớp",
                        "PASSWORD_CONFIRMATION_MISMATCH"
                );
            }
        }

        // 4. Mã hóa và lưu mật khẩu mới
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Đổi mật khẩu thành công cho user ID: {}", userId);
    }

    /**
     * Xử lý đăng xuất tài khoản
     */
    public void logout(Long userId) {
        log.info("User ID: {} đã thực hiện đăng xuất", userId);
    }

    private User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", userId));
    }
}
