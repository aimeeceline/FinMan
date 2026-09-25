package com.finman.service;

import com.finman.dto.request.BudgetRequest;
import com.finman.dto.response.BudgetResponse;
import com.finman.dto.response.BudgetSummaryResponse;
import com.finman.entity.Budget;
import com.finman.entity.Category;
import com.finman.entity.User;
import com.finman.entity.enums.CategoryType;
import com.finman.entity.enums.TransactionType;
import com.finman.exception.BusinessValidationException;
import com.finman.exception.ResourceNotFoundException;
import com.finman.repository.BudgetRepository;
import com.finman.repository.CategoryRepository;
import com.finman.repository.TransactionRepository;
import com.finman.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public BudgetService(
            BudgetRepository budgetRepository,
            CategoryRepository categoryRepository,
            TransactionRepository transactionRepository,
            UserRepository userRepository) {
        this.budgetRepository = budgetRepository;
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public BudgetResponse setBudget(Long userId, BudgetRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        if (request.getCategoryId() == null) {
            throw new BusinessValidationException("Danh mục không được để trống");
        }

        if (request.getAmount() == null || request.getAmount() <= 0) {
            throw new BusinessValidationException("Hạn mức ngân sách phải lớn hơn 0");
        }

        YearMonth yearMonth = parseMonth(request.getMonth());
        String normalizedMonth = yearMonth.toString();

        Category category = categoryRepository.findAccessibleCategory(request.getCategoryId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục không tồn tại hoặc bạn không có quyền truy cập"));

        if (category.getType() != CategoryType.EXPENSE) {
            throw new BusinessValidationException("Chỉ được đặt ngân sách cho danh mục chi tiêu");
        }

        Optional<Budget> existingOpt = budgetRepository.findByUserIdAndCategoryIdAndMonth(
                userId, category.getId(), normalizedMonth);

        Budget budget;
        if (existingOpt.isPresent()) {
            budget = existingOpt.get();
            budget.setAmount(request.getAmount());
        } else {
            budget = new Budget(user, category, normalizedMonth, request.getAmount());
        }

        budget = budgetRepository.save(budget);

        Long spent = calculateSpentAmount(userId, category.getId(), yearMonth);
        return BudgetResponse.of(budget, spent);
    }

    @Transactional(readOnly = true)
    public List<BudgetResponse> getBudgetsByMonth(Long userId, String monthStr) {
        YearMonth yearMonth = parseMonth(monthStr);
        String normalizedMonth = yearMonth.toString();

        List<Budget> budgets = budgetRepository.findByUserIdAndMonth(userId, normalizedMonth);
        List<BudgetResponse> responses = new ArrayList<>(budgets.size());

        for (Budget budget : budgets) {
            Long spent = calculateSpentAmount(userId, budget.getCategory().getId(), yearMonth);
            responses.add(BudgetResponse.of(budget, spent));
        }

        return responses;
    }

    @Transactional(readOnly = true)
    public BudgetSummaryResponse getBudgetSummary(Long userId, String monthStr) {
        YearMonth yearMonth = parseMonth(monthStr);
        List<BudgetResponse> budgets = getBudgetsByMonth(userId, yearMonth.toString());
        return BudgetSummaryResponse.of(yearMonth.toString(), budgets);
    }

    @Transactional(readOnly = true)
    public BudgetResponse getBudgetById(Long userId, Long id) {
        Budget budget = budgetRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Ngân sách không tồn tại hoặc bạn không có quyền truy cập"));

        YearMonth yearMonth = YearMonth.parse(budget.getMonth());
        Long spent = calculateSpentAmount(userId, budget.getCategory().getId(), yearMonth);
        return BudgetResponse.of(budget, spent);
    }

    @Transactional
    public BudgetResponse updateBudget(Long userId, Long id, BudgetRequest request) {
        Budget budget = budgetRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Ngân sách không tồn tại hoặc bạn không có quyền truy cập"));

        if (request.getAmount() == null || request.getAmount() <= 0) {
            throw new BusinessValidationException("Hạn mức ngân sách phải lớn hơn 0");
        }

        if (request.getCategoryId() != null && !request.getCategoryId().equals(budget.getCategory().getId())) {
            Category category = categoryRepository.findAccessibleCategory(request.getCategoryId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Danh mục không tồn tại hoặc bạn không có quyền truy cập"));

            if (category.getType() != CategoryType.EXPENSE) {
                throw new BusinessValidationException("Chỉ được đặt ngân sách cho danh mục chi tiêu");
            }
            budget.setCategory(category);
        }

        if (request.getMonth() != null && !request.getMonth().isBlank()) {
            YearMonth yearMonth = parseMonth(request.getMonth());
            budget.setMonth(yearMonth.toString());
        }

        budget.setAmount(request.getAmount());
        budget = budgetRepository.save(budget);

        YearMonth yearMonth = YearMonth.parse(budget.getMonth());
        Long spent = calculateSpentAmount(userId, budget.getCategory().getId(), yearMonth);
        return BudgetResponse.of(budget, spent);
    }

    @Transactional
    public void deleteBudget(Long userId, Long id) {
        Budget budget = budgetRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Ngân sách không tồn tại hoặc bạn không có quyền truy cập"));

        budgetRepository.delete(budget);
    }

    public Long calculateSpentAmount(Long userId, Long categoryId, YearMonth yearMonth) {
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();
        Long spent = transactionRepository.sumAmountByUserIdAndCategoryIdAndDateBetween(
                userId, categoryId, TransactionType.EXPENSE, startDate, endDate);
        return (spent != null) ? spent : 0L;
    }

    public YearMonth parseMonth(String monthStr) {
        if (monthStr == null || monthStr.isBlank()) {
            return YearMonth.now();
        }
        if (!monthStr.matches("^\\d{4}-(0[1-9]|1[0-2])$")) {
            throw new BusinessValidationException("Tháng phải có định dạng YYYY-MM");
        }
        try {
            return YearMonth.parse(monthStr);
        } catch (DateTimeParseException e) {
            throw new BusinessValidationException("Tháng không đúng định dạng YYYY-MM");
        }
    }
}
