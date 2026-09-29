package com.finman.dto.response;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class StatisticsOverviewResponse {

    private Long totalIncome;
    private Long totalExpense;
    private Long netCashFlow;
    private Double savingsRate;
    private Double expenseRate;
    private Long transactionCount;
    private Long averageDailyExpense;
    private LocalDate highestExpenseDate;
    private Long highestExpenseDayAmount;
    private List<CategoryAggregationResponse> categoryBreakdown = new ArrayList<>();
    private List<DailyCashflowResponse> dailyTrends = new ArrayList<>();
    private List<TransactionResponse> topExpenses = new ArrayList<>();

    public StatisticsOverviewResponse() {
    }

    public StatisticsOverviewResponse(Long totalIncome, Long totalExpense, Long netCashFlow,
                                      Double savingsRate, Double expenseRate, Long transactionCount) {
        this.totalIncome = totalIncome != null ? totalIncome : 0L;
        this.totalExpense = totalExpense != null ? totalExpense : 0L;
        this.netCashFlow = netCashFlow != null ? netCashFlow : 0L;
        this.savingsRate = savingsRate != null ? savingsRate : 0.0;
        this.expenseRate = expenseRate != null ? expenseRate : 0.0;
        this.transactionCount = transactionCount != null ? transactionCount : 0L;
    }

    public Long getTotalIncome() {
        return totalIncome;
    }

    public void setTotalIncome(Long totalIncome) {
        this.totalIncome = totalIncome;
    }

    public Long getTotalExpense() {
        return totalExpense;
    }

    public void setTotalExpense(Long totalExpense) {
        this.totalExpense = totalExpense;
    }

    public Long getNetCashFlow() {
        return netCashFlow;
    }

    public void setNetCashFlow(Long netCashFlow) {
        this.netCashFlow = netCashFlow;
    }

    public Double getSavingsRate() {
        return savingsRate;
    }

    public void setSavingsRate(Double savingsRate) {
        this.savingsRate = savingsRate;
    }

    public Double getExpenseRate() {
        return expenseRate;
    }

    public void setExpenseRate(Double expenseRate) {
        this.expenseRate = expenseRate;
    }

    public Long getTransactionCount() {
        return transactionCount;
    }

    public void setTransactionCount(Long transactionCount) {
        this.transactionCount = transactionCount;
    }

    public Long getAverageDailyExpense() {
        return averageDailyExpense;
    }

    public void setAverageDailyExpense(Long averageDailyExpense) {
        this.averageDailyExpense = averageDailyExpense;
    }

    public LocalDate getHighestExpenseDate() {
        return highestExpenseDate;
    }

    public void setHighestExpenseDate(LocalDate highestExpenseDate) {
        this.highestExpenseDate = highestExpenseDate;
    }

    public Long getHighestExpenseDayAmount() {
        return highestExpenseDayAmount;
    }

    public void setHighestExpenseDayAmount(Long highestExpenseDayAmount) {
        this.highestExpenseDayAmount = highestExpenseDayAmount;
    }

    public List<CategoryAggregationResponse> getCategoryBreakdown() {
        return categoryBreakdown;
    }

    public void setCategoryBreakdown(List<CategoryAggregationResponse> categoryBreakdown) {
        this.categoryBreakdown = categoryBreakdown;
    }

    public List<DailyCashflowResponse> getDailyTrends() {
        return dailyTrends;
    }

    public void setDailyTrends(List<DailyCashflowResponse> dailyTrends) {
        this.dailyTrends = dailyTrends;
    }

    public List<TransactionResponse> getTopExpenses() {
        return topExpenses;
    }

    public void setTopExpenses(List<TransactionResponse> topExpenses) {
        this.topExpenses = topExpenses;
    }
}
