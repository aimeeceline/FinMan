package com.finman.controller;

import com.finman.dto.request.ChangePasswordRequest;
import com.finman.dto.request.UpdateProfileRequest;
import com.finman.dto.response.ApiResponse;
import com.finman.dto.response.UserResponse;
import com.finman.exception.UnauthorizedException;
import com.finman.security.UserPrincipal;
import com.finman.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/v1/users", "/api/v1/user"})
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * GET /api/v1/users/profile
     * Lấy thông tin cá nhân của người dùng hiện tại
     */
    @GetMapping({"/profile", "/me"})
    public ResponseEntity<ApiResponse<UserResponse>> getProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        validateUser(userPrincipal);
        UserResponse response = userService.getProfile(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin cá nhân thành công"));
    }

    /**
     * PUT /api/v1/users/profile
     * Cập nhật thông tin cá nhân (Họ tên, ảnh đại diện)
     */
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody UpdateProfileRequest request) {
        validateUser(userPrincipal);
        UserResponse response = userService.updateProfile(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật thông tin cá nhân thành công"));
    }

    /**
     * POST /api/v1/users/change-password
     * Đổi mật khẩu tài khoản
     */
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody ChangePasswordRequest request) {
        validateUser(userPrincipal);
        userService.changePassword(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(null, "Đổi mật khẩu thành công"));
    }

    /**
     * PUT /api/v1/users/change-password
     * Đổi mật khẩu tài khoản (hỗ trợ phương thức PUT)
     */
    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePasswordPut(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody ChangePasswordRequest request) {
        return changePassword(userPrincipal, request);
    }

    /**
     * POST /api/v1/users/logout
     * Đăng xuất tài khoản
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal != null) {
            userService.logout(userPrincipal.getId());
        }
        return ResponseEntity.ok(ApiResponse.success(null, "Đăng xuất thành công"));
    }

    private void validateUser(UserPrincipal userPrincipal) {
        if (userPrincipal == null || userPrincipal.getId() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để tiếp tục");
        }
    }
}
