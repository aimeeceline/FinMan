package com.finman.service;

import com.finman.dto.response.CategoryAggregationResponse;
import com.finman.dto.response.DailyCashflowResponse;
import com.finman.dto.response.StatisticsOverviewResponse;
import com.finman.dto.response.TransactionResponse;
import com.finman.entity.Transaction;
import com.finman.entity.enums.TransactionType;
import com.finman.exception.ResourceNotFoundException;
import com.finman.repository.TransactionRepository;
import com.finman.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class StatisticsService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public StatisticsService(TransactionRepository transactionRepository, UserRepository userRepository) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    /**
     * Lấy tổng quan số liệu thống kê thu/chi, tỷ lệ thặng dư, xu hướng ngày, phân bổ danh mục và top chi tiêu.
     */
    @Transactional(readOnly = true)
    public StatisticsOverviewResponse getStatisticsOverview(
            Long userId,
            String month,
            LocalDate startDate,
            LocalDate endDate,
            Long accountId) {

        validateUserExists(userId);
        DateRange range = resolveDateRange(month, startDate, endDate);

        Long totalIncome;
        Long totalExpense;
        Long transactionCount;

        if (accountId != null) {
            totalIncome = transactionRepository.sumAmountByUserIdAndAccountIdAndTypeAndDateBetween(
                    userId, accountId, TransactionType.INCOME, range.startDate, range.endDate);
            totalExpense = transactionRepository.sumAmountByUserIdAndAccountIdAndTypeAndDateBetween(
                    userId, accountId, TransactionType.EXPENSE, range.startDate, range.endDate);
            transactionCount = transactionRepository.countByUserIdAndAccountIdAndDateBetween(
                    userId, accountId, range.startDate, range.endDate);
        } else {
            totalIncome = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                    userId, TransactionType.INCOME, range.startDate, range.endDate);
            totalExpense = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                    userId, TransactionType.EXPENSE, range.startDate, range.endDate);
            transactionCount = transactionRepository.countByUserIdAndDateBetween(
                    userId, range.startDate, range.endDate);
        }

        totalIncome = totalIncome != null ? totalIncome : 0L;
        totalExpense = totalExpense != null ? totalExpense : 0L;
        transactionCount = transactionCount != null ? transactionCount : 0L;

        long netCashFlow = totalIncome - totalExpense;
        double savingsRate = totalIncome > 0
                ? Math.round(((double) netCashFlow / totalIncome) * 1000.0) / 10.0
                : 0.0;
        double expenseRate = totalIncome > 0
                ? Math.round(((double) totalExpense / totalIncome) * 1000.0) / 10.0
                : 0.0;

        // Tính số ngày và chi tiêu bình quân mỗi ngày
        long days = ChronoUnit.DAYS.between(range.startDate, range.endDate) + 1;
        LocalDate today = LocalDate.now();
        if (range.endDate.isAfter(today) && !range.startDate.isAfter(today)) {
            long daysElapsed = ChronoUnit.DAYS.between(range.startDate, today) + 1;
            days = Math.max(1, daysElapsed);
        }
        long averageDailyExpense = days > 0 ? Math.round((double) totalExpense / days) : totalExpense;

        // Xu hướng dòng tiền theo ngày
        List<DailyCashflowResponse> dailyTrends = getDailyTrends(userId, month, range.startDate, range.endDate, accountId);

        // Tìm ngày chi tiêu cao nhất (Peak Day)
        LocalDate highestExpenseDate = null;
        long highestExpenseAmount = 0L;
        for (DailyCashflowResponse daily : dailyTrends) {
            if (daily.getExpense() != null && daily.getExpense() > highestExpenseAmount) {
                highestExpenseAmount = daily.getExpense();
                highestExpenseDate = daily.getDate();
            }
        }

        // Tỷ trọng danh mục chi tiêu
        List<CategoryAggregationResponse> categoryBreakdown = getCategoryBreakdown(
                userId, month, range.startDate, range.endDate, accountId, TransactionType.EXPENSE);

        // Top 5 khoản chi tiêu lớn nhất trong kỳ
        List<Transaction> topExpenseEntities = transactionRepository.findTopTransactionsByType(
                userId, TransactionType.EXPENSE, range.startDate, range.endDate, accountId, PageRequest.of(0, 5));
        List<TransactionResponse> topExpenses = topExpenseEntities.stream()
                .map(TransactionResponse::from)
                .toList();

        StatisticsOverviewResponse response = new StatisticsOverviewResponse(
                totalIncome, totalExpense, netCashFlow, savingsRate, expenseRate, transactionCount);
        response.setAverageDailyExpense(averageDailyExpense);
        response.setHighestExpenseDate(highestExpenseDate);
        response.setHighestExpenseDayAmount(highestExpenseAmount);
        response.setCategoryBreakdown(categoryBreakdown);
        response.setDailyTrends(dailyTrends);
        response.setTopExpenses(topExpenses);

        return response;
    }

    /**
     * Lấy phân bổ danh mục theo loại (EXPENSE / INCOME) kèm tỷ lệ % chính xác.
     */
    @Transactional(readOnly = true)
    public List<CategoryAggregationResponse> getCategoryBreakdown(
            Long userId,
            String month,
            LocalDate startDate,
            LocalDate endDate,
            Long accountId,
            TransactionType type) {

        validateUserExists(userId);
        DateRange range = resolveDateRange(month, startDate, endDate);
        TransactionType effectiveType = type != null ? type : TransactionType.EXPENSE;

        List<CategoryAggregationResponse> aggregations = transactionRepository.aggregateByCategory(
                userId, range.startDate, range.endDate, accountId, null, effectiveType);

        long totalAmount = aggregations.stream()
                .mapToLong(CategoryAggregationResponse::getTotalAmount)
                .sum();

        for (CategoryAggregationResponse agg : aggregations) {
            double pct = totalAmount > 0
                    ? Math.round(((double) agg.getTotalAmount() / totalAmount) * 1000.0) / 10.0
                    : 0.0;
            agg.setPercentage(pct);
        }

        return aggregations;
    }

    /**
     * Lấy dữ liệu dòng tiền thu/chi theo từng ngày trong khoảng thời gian.
     */
    @Transactional(readOnly = true)
    public List<DailyCashflowResponse> getDailyTrends(
            Long userId,
            String month,
            LocalDate startDate,
            LocalDate endDate,
            Long accountId) {

        validateUserExists(userId);
        DateRange range = resolveDateRange(month, startDate, endDate);

        List<Object[]> rawDaily = transactionRepository.aggregateDailyCashflow(
                userId, range.startDate, range.endDate, accountId);

        Map<LocalDate, DailyCashflowResponse> dailyMap = new HashMap<>();

        for (Object[] row : rawDaily) {
            LocalDate date = (LocalDate) row[0];
            TransactionType type = (TransactionType) row[1];
            Long amount = (Long) row[2];

            DailyCashflowResponse item = dailyMap.computeIfAbsent(date, d -> new DailyCashflowResponse(d, 0L, 0L));
            if (type == TransactionType.INCOME) {
                item.setIncome(amount != null ? amount : 0L);
            } else if (type == TransactionType.EXPENSE) {
                item.setExpense(amount != null ? amount : 0L);
            }
        }

        List<DailyCashflowResponse> result = new ArrayList<>(dailyMap.values());
        result.sort(Comparator.comparing(DailyCashflowResponse::getDate));
        return result;
    }

    private void validateUserExists(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("Người dùng không tồn tại");
        }
    }

    private DateRange resolveDateRange(String month, LocalDate startDate, LocalDate endDate) {
        LocalDate resolvedStart = startDate;
        LocalDate resolvedEnd = endDate;

        if (month != null && !month.isBlank()) {
            try {
                YearMonth ym = YearMonth.parse(month.trim());
                if (resolvedStart == null) {
                    resolvedStart = ym.atDay(1);
                }
                if (resolvedEnd == null) {
                    resolvedEnd = ym.atEndOfMonth();
                }
            } catch (Exception ignored) {
            }
        }

        if (resolvedStart == null && resolvedEnd == null) {
            YearMonth now = YearMonth.now();
            resolvedStart = now.atDay(1);
            resolvedEnd = now.atEndOfMonth();
        } else {
            if (resolvedStart == null) {
                resolvedStart = LocalDate.of(1970, 1, 1);
            }
            if (resolvedEnd == null) {
                resolvedEnd = LocalDate.of(2099, 12, 31);
            }
        }

        return new DateRange(resolvedStart, resolvedEnd);
    }

    private static class DateRange {
        final LocalDate startDate;
        final LocalDate endDate;

        DateRange(LocalDate startDate, LocalDate endDate) {
            this.startDate = startDate;
            this.endDate = endDate;
        }
    }
}
