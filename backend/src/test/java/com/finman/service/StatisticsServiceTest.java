package com.finman.service;

import com.finman.dto.response.CategoryAggregationResponse;
import com.finman.dto.response.DailyCashflowResponse;
import com.finman.dto.response.StatisticsOverviewResponse;
import com.finman.entity.Account;
import com.finman.entity.Category;
import com.finman.entity.Transaction;
import com.finman.entity.User;
import com.finman.entity.enums.AccountType;
import com.finman.entity.enums.CategoryType;
import com.finman.entity.enums.TransactionType;
import com.finman.exception.ResourceNotFoundException;
import com.finman.repository.TransactionRepository;
import com.finman.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StatisticsServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private StatisticsService statisticsService;

    private User testUser;
    private Account testAccount;
    private Category testExpenseCat;

    @BeforeEach
    void setUp() {
        testUser = new User("stats.user@finman.com", "pass123", "Nguyễn Minh Khang");
        testUser.setId(1L);

        testAccount = new Account(testUser, "Ví MoMo", AccountType.BANK, 5_000_000L);
        testAccount.setId(10L);

        testExpenseCat = new Category(testUser, "Áo quần & Mua sắm", CategoryType.EXPENSE, "checkroom", false);
        testExpenseCat.setId(101L);
    }

    @Test
    @DisplayName("STATS_SRV_01: Lấy tổng quan số liệu thống kê thành công và tính toán thặng dư chính xác")
    void testGetStatisticsOverview_Success() {
        LocalDate start = LocalDate.of(2026, 9, 1);
        LocalDate end = LocalDate.of(2026, 9, 30);

        when(userRepository.existsById(1L)).thenReturn(true);
        when(transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                eq(1L), eq(TransactionType.INCOME), eq(start), eq(end)))
                .thenReturn(6_000_000L);
        when(transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                eq(1L), eq(TransactionType.EXPENSE), eq(start), eq(end)))
                .thenReturn(1_090_000L);
        when(transactionRepository.countByUserIdAndDateBetween(eq(1L), eq(start), eq(end)))
                .thenReturn(3L);

        // Raw daily data
        List<Object[]> rawDaily = new ArrayList<>();
        rawDaily.add(new Object[]{LocalDate.of(2026, 9, 5), TransactionType.INCOME, 6_000_000L});
        rawDaily.add(new Object[]{LocalDate.of(2026, 9, 8), TransactionType.EXPENSE, 90_000L});
        rawDaily.add(new Object[]{LocalDate.of(2026, 9, 12), TransactionType.EXPENSE, 1_000_000L});
        when(transactionRepository.aggregateDailyCashflow(eq(1L), eq(start), eq(end), isNull()))
                .thenReturn(rawDaily);

        // Category breakdown
        List<CategoryAggregationResponse> catList = new ArrayList<>();
        catList.add(new CategoryAggregationResponse(101L, "Áo quần", "checkroom", TransactionType.EXPENSE, 1_000_000L, 1L));
        catList.add(new CategoryAggregationResponse(102L, "Ăn uống", "restaurant", TransactionType.EXPENSE, 90_000L, 1L));
        when(transactionRepository.aggregateByCategory(eq(1L), eq(start), eq(end), isNull(), isNull(), eq(TransactionType.EXPENSE)))
                .thenReturn(catList);

        // Top transactions
        Transaction topTxn = new Transaction(testUser, testAccount, testExpenseCat, TransactionType.EXPENSE, 1_000_000L,
                LocalDate.of(2026, 9, 12), "Sắm áo sơ mi");
        topTxn.setId(1001L);
        when(transactionRepository.findTopTransactionsByType(
                eq(1L), eq(TransactionType.EXPENSE), eq(start), eq(end), isNull(), any(Pageable.class)))
                .thenReturn(List.of(topTxn));

        StatisticsOverviewResponse response = statisticsService.getStatisticsOverview(
                1L, "2026-09", null, null, null);

        assertNotNull(response);
        assertEquals(6_000_000L, response.getTotalIncome());
        assertEquals(1_090_000L, response.getTotalExpense());
        assertEquals(4_910_000L, response.getNetCashFlow());
        assertEquals(81.8, response.getSavingsRate());
        assertEquals(18.2, response.getExpenseRate());
        assertEquals(3L, response.getTransactionCount());
        assertEquals(LocalDate.of(2026, 9, 12), response.getHighestExpenseDate());
        assertEquals(1_000_000L, response.getHighestExpenseDayAmount());

        assertEquals(2, response.getCategoryBreakdown().size());
        assertEquals(91.7, response.getCategoryBreakdown().get(0).getPercentage());
        assertEquals(8.3, response.getCategoryBreakdown().get(1).getPercentage());

        assertEquals(1, response.getTopExpenses().size());
        assertEquals(1_000_000L, response.getTopExpenses().get(0).getAmount());
    }

    @Test
    @DisplayName("STATS_SRV_02: Lấy phân bổ danh mục theo tỷ lệ % chính xác")
    void testGetCategoryBreakdown_Success() {
        LocalDate start = LocalDate.of(2026, 9, 1);
        LocalDate end = LocalDate.of(2026, 9, 30);

        when(userRepository.existsById(1L)).thenReturn(true);

        List<CategoryAggregationResponse> catList = new ArrayList<>();
        catList.add(new CategoryAggregationResponse(101L, "Mua sắm", "shopping", TransactionType.EXPENSE, 300_000L, 2L));
        catList.add(new CategoryAggregationResponse(102L, "Ăn uống", "restaurant", TransactionType.EXPENSE, 700_000L, 5L));

        when(transactionRepository.aggregateByCategory(eq(1L), eq(start), eq(end), isNull(), isNull(), eq(TransactionType.EXPENSE)))
                .thenReturn(catList);

        List<CategoryAggregationResponse> result = statisticsService.getCategoryBreakdown(
                1L, "2026-09", null, null, null, TransactionType.EXPENSE);

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(30.0, result.get(0).getPercentage());
        assertEquals(70.0, result.get(1).getPercentage());
    }

    @Test
    @DisplayName("STATS_SRV_03: Ném ngoại lệ khi user không tồn tại")
    void testGetStatisticsOverview_UserNotFound() {
        when(userRepository.existsById(999L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () ->
                statisticsService.getStatisticsOverview(999L, "2026-09", null, null, null));
    }
}
