package com.finman.controller;

import com.finman.dto.request.AccountCreateRequest;
import com.finman.dto.request.AccountUpdateRequest;
import com.finman.dto.response.AccountResponse;
import com.finman.dto.response.AccountSummaryResponse;
import com.finman.dto.response.ApiResponse;
import com.finman.exception.UnauthorizedException;
import com.finman.security.UserPrincipal;
import com.finman.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<AccountSummaryResponse>> getAccounts(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        validateUser(userPrincipal);
        AccountSummaryResponse response = accountService.getAccountsSummary(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách tài khoản thành công"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AccountResponse>> getAccountById(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id) {
        validateUser(userPrincipal);
        AccountResponse response = accountService.getAccountById(userPrincipal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết tài khoản thành công"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AccountResponse>> createAccount(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody AccountCreateRequest request) {
        validateUser(userPrincipal);
        AccountResponse response = accountService.createAccount(userPrincipal.getId(), request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo tài khoản thành công"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AccountResponse>> updateAccount(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id,
            @Valid @RequestBody AccountUpdateRequest request) {
        validateUser(userPrincipal);
        AccountResponse response = accountService.updateAccount(userPrincipal.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật thông tin tài khoản thành công"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id) {
        validateUser(userPrincipal);
        accountService.deleteAccount(userPrincipal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(null, "Lưu trữ tài khoản thành công"));
    }

    private void validateUser(UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để thực hiện thao tác này");
        }
    }
}
