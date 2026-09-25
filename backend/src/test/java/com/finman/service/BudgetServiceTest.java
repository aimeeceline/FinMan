package com.finman.service;

import com.finman.dto.request.BudgetRequest;
import com.finman.dto.response.BudgetResponse;
import com.finman.dto.response.BudgetSummaryResponse;
import com.finman.entity.Budget;
import com.finman.entity.Category;
import com.finman.entity.User;
import com.finman.entity.enums.BudgetStatus;
import com.finman.entity.enums.CategoryType;
import com.finman.entity.enums.TransactionType;
import com.finman.exception.BusinessValidationException;
import com.finman.exception.ResourceNotFoundException;
import com.finman.repository.BudgetRepository;
import com.finman.repository.CategoryRepository;
import com.finman.repository.TransactionRepository;
import com.finman.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BudgetServiceTest {

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private BudgetService budgetService;

    private User testUser;
    private Category expenseCategory;
    private Category incomeCategory;
    private Budget existingBudget;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("tester@finman.com");

        expenseCategory = new Category("Ăn uống", CategoryType.EXPENSE, "🍜", true);
        expenseCategory.setId(10L);

        incomeCategory = new Category("Lương", CategoryType.INCOME, "💵", true);
        incomeCategory.setId(20L);

        existingBudget = new Budget(100L, testUser, expenseCategory, "2026-09", 3_000_000L);
    }

    @Test
    @DisplayName("TC_BDG_01: Thiết lập ngân sách danh mục chi tiêu & Upsert khi đã tồn tại")
    void testSetBudget_TC_BDG_01_SuccessAndUpsert() {
        BudgetRequest request = new BudgetRequest(10L, "2026-09", 3_000_000L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(categoryRepository.findAccessibleCategory(10L, 1L)).thenReturn(Optional.of(expenseCategory));
        when(budgetRepository.findByUserIdAndCategoryIdAndMonth(1L, 10L, "2026-09")).thenReturn(Optional.empty());
        when(budgetRepository.save(any(Budget.class))).thenAnswer(invocation -> {
            Budget b = invocation.getArgument(0);
            return new Budget(100L, b.getUser(), b.getCategory(), b.getMonth(), b.getAmount());
        });
        when(transactionRepository.sumAmountByUserIdAndCategoryIdAndDateBetween(
                eq(1L), eq(10L), eq(TransactionType.EXPENSE), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(1_500_000L);

        // 1. Tạo mới ngân sách
        BudgetResponse response = budgetService.setBudget(1L, request);
        assertNotNull(response);
        assertEquals(3_000_000L, response.getAmount());
        assertEquals("2026-09", response.getMonth());
        assertEquals(1_500_000L, response.getSpentAmount());
        assertEquals(1_500_000L, response.getRemainingAmount());
        assertEquals(BudgetStatus.NORMAL, response.getStatus());

        // 2. Cập nhật (Upsert) khi ngân sách đã tồn tại cho cùng tháng và danh mục
        when(budgetRepository.findByUserIdAndCategoryIdAndMonth(1L, 10L, "2026-09"))
                .thenReturn(Optional.of(existingBudget));
        BudgetRequest updateReq = new BudgetRequest(10L, "2026-09", 4_500_000L);

        BudgetResponse updatedResponse = budgetService.setBudget(1L, updateReq);
        assertNotNull(updatedResponse);
        assertEquals(4_500_000L, updatedResponse.getAmount());
        assertEquals(4_500_000L, existingBudget.getAmount());
    }

    @Test
    @DisplayName("TC_BDG_02: Chặn tạo ngân sách cho danh mục Thu nhập (INCOME)")
    void testSetBudget_TC_BDG_02_RejectIncomeCategory() {
        BudgetRequest request = new BudgetRequest(20L, "2026-09", 5_000_000L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(categoryRepository.findAccessibleCategory(20L, 1L)).thenReturn(Optional.of(incomeCategory));

        BusinessValidationException ex = assertThrows(BusinessValidationException.class, () ->
                budgetService.setBudget(1L, request)
        );

        assertEquals("Chỉ được đặt ngân sách cho danh mục chi tiêu", ex.getMessage());
        verify(budgetRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC_BDG_03: Trạng thái bình thường (< 80%)")
    void testBudgetStatus_TC_BDG_03_Normal() {
        BudgetRequest request = new BudgetRequest(10L, "2026-09", 3_000_000L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(categoryRepository.findAccessibleCategory(10L, 1L)).thenReturn(Optional.of(expenseCategory));
        when(budgetRepository.findByUserIdAndCategoryIdAndMonth(1L, 10L, "2026-09")).thenReturn(Optional.of(existingBudget));
        when(budgetRepository.save(any(Budget.class))).thenReturn(existingBudget);
        // Đã chi 1.500.000 / 3.000.000 (50%)
        when(transactionRepository.sumAmountByUserIdAndCategoryIdAndDateBetween(
                eq(1L), eq(10L), eq(TransactionType.EXPENSE), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(1_500_000L);

        BudgetResponse response = budgetService.setBudget(1L, request);

        assertEquals(BudgetStatus.NORMAL, response.getStatus());
        assertEquals(1_500_000L, response.getRemainingAmount());
        assertEquals(0L, response.getOverspentAmount());
        assertEquals(50.0, response.getPercentage());
    }

    @Test
    @DisplayName("TC_BDG_04: Trạng thái sắp chạm ngưỡng (80% - 100%)")
    void testBudgetStatus_TC_BDG_04_Warning() {
        BudgetRequest request = new BudgetRequest(10L, "2026-09", 3_000_000L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(categoryRepository.findAccessibleCategory(10L, 1L)).thenReturn(Optional.of(expenseCategory));
        when(budgetRepository.findByUserIdAndCategoryIdAndMonth(1L, 10L, "2026-09")).thenReturn(Optional.of(existingBudget));
        when(budgetRepository.save(any(Budget.class))).thenReturn(existingBudget);
        // Đã chi 2.500.000 / 3.000.000 (83.3%)
        when(transactionRepository.sumAmountByUserIdAndCategoryIdAndDateBetween(
                eq(1L), eq(10L), eq(TransactionType.EXPENSE), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(2_500_000L);

        BudgetResponse response = budgetService.setBudget(1L, request);

        assertEquals(BudgetStatus.WARNING, response.getStatus());
        assertEquals(500_000L, response.getRemainingAmount());
        assertEquals(0L, response.getOverspentAmount());
        assertEquals(83.3, response.getPercentage());
    }

    @Test
    @DisplayName("TC_BDG_05: Trạng thái vượt hạn mức (> 100%)")
    void testBudgetStatus_TC_BDG_05_Overbudget() {
        BudgetRequest request = new BudgetRequest(10L, "2026-09", 3_000_000L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(categoryRepository.findAccessibleCategory(10L, 1L)).thenReturn(Optional.of(expenseCategory));
        when(budgetRepository.findByUserIdAndCategoryIdAndMonth(1L, 10L, "2026-09")).thenReturn(Optional.of(existingBudget));
        when(budgetRepository.save(any(Budget.class))).thenReturn(existingBudget);
        // Đã chi 3.200.000 / 3.000.000 (106.7%) -> vượt 200.000
        when(transactionRepository.sumAmountByUserIdAndCategoryIdAndDateBetween(
                eq(1L), eq(10L), eq(TransactionType.EXPENSE), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(3_200_000L);

        BudgetResponse response = budgetService.setBudget(1L, request);

        assertEquals(BudgetStatus.OVERBUDGET, response.getStatus());
        assertEquals(0L, response.getRemainingAmount());
        assertEquals(200_000L, response.getOverspentAmount());
        assertEquals(106.7, response.getPercentage());
    }

    @Test
    @DisplayName("TC_BDG_VALIDATION: Chặn số tiền hạn mức <= 0 hoặc tháng sai format")
    void testValidation_InvalidAmountOrMonth() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        BudgetRequest reqZero = new BudgetRequest(10L, "2026-09", 0L);
        assertThrows(BusinessValidationException.class, () -> budgetService.setBudget(1L, reqZero));

        BudgetRequest reqNeg = new BudgetRequest(10L, "2026-09", -100_000L);
        assertThrows(BusinessValidationException.class, () -> budgetService.setBudget(1L, reqNeg));

        BudgetRequest reqMonth = new BudgetRequest(10L, "2026/09", 1_000_000L);
        assertThrows(BusinessValidationException.class, () -> budgetService.setBudget(1L, reqMonth));
    }

    @Test
    @DisplayName("TC_BDG_SUMMARY: Tính toán tổng quan ngân sách tháng")
    void testGetBudgetSummary_CalculatesTotals() {
        Budget b1 = new Budget(1L, testUser, expenseCategory, "2026-09", 3_000_000L);
        Category shopping = new Category("Mua sắm", CategoryType.EXPENSE, "🛍️", true);
        shopping.setId(11L);
        Budget b2 = new Budget(2L, testUser, shopping, "2026-09", 2_000_000L);

        when(budgetRepository.findByUserIdAndMonth(1L, "2026-09")).thenReturn(List.of(b1, b2));
        when(transactionRepository.sumAmountByUserIdAndCategoryIdAndDateBetween(
                eq(1L), eq(10L), eq(TransactionType.EXPENSE), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(1_500_000L);
        when(transactionRepository.sumAmountByUserIdAndCategoryIdAndDateBetween(
                eq(1L), eq(11L), eq(TransactionType.EXPENSE), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(1_000_000L);

        BudgetSummaryResponse summary = budgetService.getBudgetSummary(1L, "2026-09");

        assertNotNull(summary);
        assertEquals("2026-09", summary.getMonth());
        assertEquals(5_000_000L, summary.getTotalBudget());
        assertEquals(2_500_000L, summary.getTotalSpent());
        assertEquals(2_500_000L, summary.getTotalRemaining());
        assertEquals(50.0, summary.getOverallPercentage());
        assertEquals(2, summary.getBudgets().size());
    }

    @Test
    @DisplayName("TC_BDG_MULTI_TENANT: Chặn can thiệp ngân sách của người dùng khác (IDOR)")
    void testMultiTenant_IdorProtection() {
        when(budgetRepository.findByIdAndUserId(999L, 1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                budgetService.getBudgetById(1L, 999L)
        );

        assertThrows(ResourceNotFoundException.class, () ->
                budgetService.deleteBudget(1L, 999L)
        );

        BudgetRequest req = new BudgetRequest(10L, "2026-09", 2_000_000L);
        assertThrows(ResourceNotFoundException.class, () ->
                budgetService.updateBudget(1L, 999L, req)
        );
    }

    @Test
    @DisplayName("TC_BDG_DELETE: Xóa ngân sách thành công")
    void testDeleteBudget_Success() {
        when(budgetRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(existingBudget));

        budgetService.deleteBudget(1L, 100L);

        verify(budgetRepository, times(1)).delete(existingBudget);
    }
}
