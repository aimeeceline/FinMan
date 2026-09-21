package com.finman.controller;

import com.finman.dto.request.CategoryCreateRequest;
import com.finman.dto.request.CategoryUpdateRequest;
import com.finman.dto.response.ApiResponse;
import com.finman.dto.response.CategoryResponse;
import com.finman.entity.enums.CategoryType;
import com.finman.exception.UnauthorizedException;
import com.finman.security.UserPrincipal;
import com.finman.service.CategoryService;
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
@RequestMapping("/api/v1/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getCategories(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) CategoryType type) {
        validateUser(userPrincipal);
        List<CategoryResponse> response = categoryService.getCategories(userPrincipal.getId(), type);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách danh mục thành công"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategoryById(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id) {
        validateUser(userPrincipal);
        CategoryResponse response = categoryService.getCategoryById(userPrincipal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết danh mục thành công"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody CategoryCreateRequest request) {
        validateUser(userPrincipal);
        CategoryResponse response = categoryService.createCategory(userPrincipal.getId(), request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo danh mục mới thành công"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id,
            @Valid @RequestBody CategoryUpdateRequest request) {
        validateUser(userPrincipal);
        CategoryResponse response = categoryService.updateCategory(userPrincipal.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật danh mục thành công"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id) {
        validateUser(userPrincipal);
        categoryService.deleteCategory(userPrincipal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa danh mục thành công"));
    }

    private void validateUser(UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để thực hiện thao tác này");
        }
    }
}
