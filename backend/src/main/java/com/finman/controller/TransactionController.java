package com.finman.controller;

import com.finman.dto.request.TransactionCreateRequest;
import com.finman.dto.request.TransactionUpdateRequest;
import com.finman.dto.response.ApiResponse;
import com.finman.dto.response.TransactionResponse;
import com.finman.dto.response.TransactionSummaryResponse;
import com.finman.entity.enums.TransactionType;
import com.finman.exception.UnauthorizedException;
import com.finman.security.UserPrincipal;
import com.finman.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TransactionResponse>> createTransaction(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody TransactionCreateRequest request) {
        validateUser(userPrincipal);
        TransactionResponse response = transactionService.createTransaction(userPrincipal.getId(), request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Ghi nhận giao dịch thành công"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> getTransactions(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) String month,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "transactionDate", direction = Sort.Direction.DESC) Pageable pageable) {
        validateUser(userPrincipal);
        Page<TransactionResponse> response = transactionService.getTransactions(
                userPrincipal.getId(), month, startDate, endDate, accountId, categoryId, type, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách giao dịch thành công"));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<TransactionSummaryResponse>> getTransactionSummary(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) String month,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long accountId) {
        validateUser(userPrincipal);
        TransactionSummaryResponse response = transactionService.getTransactionSummary(
                userPrincipal.getId(), month, startDate, endDate, accountId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thống kê giao dịch thành công"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponse>> getTransactionById(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id) {
        validateUser(userPrincipal);
        TransactionResponse response = transactionService.getTransactionById(userPrincipal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết giao dịch thành công"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponse>> updateTransaction(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id,
            @Valid @RequestBody TransactionUpdateRequest request) {
        validateUser(userPrincipal);
        TransactionResponse response = transactionService.updateTransaction(userPrincipal.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật giao dịch thành công"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTransaction(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id) {
        validateUser(userPrincipal);
        transactionService.deleteTransaction(userPrincipal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa giao dịch thành công"));
    }

    private void validateUser(UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để tiếp tục");
        }
    }
}
