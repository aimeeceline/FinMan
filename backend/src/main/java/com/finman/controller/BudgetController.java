package com.finman.controller;

import com.finman.dto.request.BudgetRequest;
import com.finman.dto.response.ApiResponse;
import com.finman.dto.response.BudgetResponse;
import com.finman.dto.response.BudgetSummaryResponse;
import com.finman.exception.UnauthorizedException;
import com.finman.security.UserPrincipal;
import com.finman.service.BudgetService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/budgets")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BudgetResponse>>> getBudgets(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) String month) {
        validateUser(userPrincipal);
        List<BudgetResponse> response = budgetService.getBudgetsByMonth(userPrincipal.getId(), month);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách ngân sách thành công"));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<BudgetSummaryResponse>> getBudgetSummary(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) String month) {
        validateUser(userPrincipal);
        BudgetSummaryResponse response = budgetService.getBudgetSummary(userPrincipal.getId(), month);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy tổng quan ngân sách thành công"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BudgetResponse>> getBudgetById(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id) {
        validateUser(userPrincipal);
        BudgetResponse response = budgetService.getBudgetById(userPrincipal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin ngân sách thành công"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BudgetResponse>> setBudget(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody BudgetRequest request) {
        validateUser(userPrincipal);
        BudgetResponse response = budgetService.setBudget(userPrincipal.getId(), request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Thiết lập ngân sách thành công"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BudgetResponse>> updateBudget(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id,
            @Valid @RequestBody BudgetRequest request) {
        validateUser(userPrincipal);
        BudgetResponse response = budgetService.updateBudget(userPrincipal.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật ngân sách thành công"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBudget(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id) {
        validateUser(userPrincipal);
        budgetService.deleteBudget(userPrincipal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa ngân sách thành công"));
    }

    private void validateUser(UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để thực hiện thao tác này");
        }
    }
}
