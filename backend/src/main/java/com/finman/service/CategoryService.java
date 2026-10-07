package com.finman.service;

import com.finman.dto.request.CategoryCreateRequest;
import com.finman.dto.request.CategoryUpdateRequest;
import com.finman.dto.response.CategoryResponse;
import com.finman.entity.Category;
import com.finman.entity.User;
import com.finman.entity.enums.CategoryType;
import com.finman.exception.BusinessValidationException;
import com.finman.exception.ResourceNotFoundException;
import com.finman.repository.BudgetRepository;
import com.finman.repository.CategoryRepository;
import com.finman.repository.TransactionRepository;
import com.finman.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;

    public CategoryService(CategoryRepository categoryRepository,
                           UserRepository userRepository,
                           TransactionRepository transactionRepository,
                           BudgetRepository budgetRepository) {
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.budgetRepository = budgetRepository;
    }

    public List<CategoryResponse> getCategories(Long userId, CategoryType type) {
        List<Category> categories;
        if (type != null) {
            categories = categoryRepository.findAllAvailableForUserAndType(userId, type);
        } else {
            categories = categoryRepository.findAllAvailableForUser(userId);
        }

        return categories.stream()
                .map(CategoryResponse::from)
                .toList();
    }

    public CategoryResponse getCategoryById(Long userId, Long categoryId) {
        Category category = categoryRepository.findAccessibleCategory(categoryId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục không tồn tại hoặc bạn không có quyền truy cập"));
        return CategoryResponse.from(category);
    }

    @Transactional
    public CategoryResponse createCategory(Long userId, CategoryCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        String name = request.getName().trim();
        if (categoryRepository.existsByUserIdAndNameIgnoreCaseAndDeletedAtIsNull(userId, name) ||
                categoryRepository.existsByIsDefaultTrueAndNameIgnoreCase(name)) {
            throw new BusinessValidationException("Tên danh mục '" + name + "' đã tồn tại");
        }

        Category category = new Category(user, name, request.getType(), request.getIcon(), false);
        Category saved = categoryRepository.save(category);
        return CategoryResponse.from(saved);
    }

    @Transactional
    public CategoryResponse updateCategory(Long userId, Long categoryId, CategoryUpdateRequest request) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục không tồn tại"));

        if (Boolean.TRUE.equals(category.getIsDefault())) {
            throw new BusinessValidationException("Không thể chỉnh sửa danh mục mặc định của hệ thống");
        }

        if (category.getUser() == null || !category.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Danh mục không tồn tại hoặc bạn không có quyền truy cập");
        }

        String newName = request.getName().trim();
        if (!category.getName().equalsIgnoreCase(newName) &&
                (categoryRepository.existsByUserIdAndNameIgnoreCaseAndDeletedAtIsNull(userId, newName) ||
                 categoryRepository.existsByIsDefaultTrueAndNameIgnoreCase(newName))) {
            throw new BusinessValidationException("Tên danh mục '" + newName + "' đã tồn tại");
        }

        category.setName(newName);
        if (request.getIcon() != null) {
            category.setIcon(request.getIcon());
        }

        Category updated = categoryRepository.save(category);
        return CategoryResponse.from(updated);
    }

    @Transactional
    public void deleteCategory(Long userId, Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục không tồn tại"));

        if (Boolean.TRUE.equals(category.getIsDefault())) {
            throw new BusinessValidationException("Không thể xóa danh mục mặc định của hệ thống");
        }

        if (category.getUser() == null || !category.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Danh mục không tồn tại hoặc bạn không có quyền truy cập");
        }

        // Quy tắc nghiệp vụ: Nếu có budget của danh mục đó nhưng chưa hề có giao dịch thì xóa luôn budget
        long txCount = transactionRepository.countAllByCategoryId(categoryId);
        if (txCount == 0) {
            budgetRepository.hardDeleteByCategoryId(categoryId);
        }

        category.setDeletedAt(java.time.Instant.now());
        category.setIsPurgedFromBin(false);
        categoryRepository.save(category);
    }
}
