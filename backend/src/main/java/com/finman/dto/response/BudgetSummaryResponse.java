package com.finman.dto.response;

import java.util.List;

public class BudgetSummaryResponse {

    private String month;
    private Long totalBudget;
    private Long totalSpent;
    private Long totalRemaining;
    private Long totalOverspent;
    private Double overallPercentage;
    private List<BudgetResponse> budgets;

    public BudgetSummaryResponse() {
    }

    public BudgetSummaryResponse(String month, Long totalBudget, Long totalSpent,
                                 Long totalRemaining, Long totalOverspent,
                                 Double overallPercentage, List<BudgetResponse> budgets) {
        this.month = month;
        this.totalBudget = totalBudget;
        this.totalSpent = totalSpent;
        this.totalRemaining = totalRemaining;
        this.totalOverspent = totalOverspent;
        this.overallPercentage = overallPercentage;
        this.budgets = budgets;
    }

    public static BudgetSummaryResponse of(String month, List<BudgetResponse> budgets) {
        long totalBudget = 0L;
        long totalSpent = 0L;

        if (budgets != null) {
            for (BudgetResponse b : budgets) {
                totalBudget += (b.getAmount() != null ? b.getAmount() : 0L);
                totalSpent += (b.getSpentAmount() != null ? b.getSpentAmount() : 0L);
            }
        }

        long totalRemaining = Math.max(0L, totalBudget - totalSpent);
        long totalOverspent = Math.max(0L, totalSpent - totalBudget);

        double rawPercentage = (totalBudget > 0) ? ((double) totalSpent / totalBudget) * 100.0 : 0.0;
        double roundedPercentage = Math.round(rawPercentage * 10.0) / 10.0;

        return new BudgetSummaryResponse(
                month,
                totalBudget,
                totalSpent,
                totalRemaining,
                totalOverspent,
                roundedPercentage,
                budgets
        );
    }

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }

    public Long getTotalBudget() {
        return totalBudget;
    }

    public void setTotalBudget(Long totalBudget) {
        this.totalBudget = totalBudget;
    }

    public Long getTotalSpent() {
        return totalSpent;
    }

    public void setTotalSpent(Long totalSpent) {
        this.totalSpent = totalSpent;
    }

    public Long getTotalRemaining() {
        return totalRemaining;
    }

    public void setTotalRemaining(Long totalRemaining) {
        this.totalRemaining = totalRemaining;
    }

    public Long getTotalOverspent() {
        return totalOverspent;
    }

    public void setTotalOverspent(Long totalOverspent) {
        this.totalOverspent = totalOverspent;
    }

    public Double getOverallPercentage() {
        return overallPercentage;
    }

    public void setOverallPercentage(Double overallPercentage) {
        this.overallPercentage = overallPercentage;
    }

    public List<BudgetResponse> getBudgets() {
        return budgets;
    }

    public void setBudgets(List<BudgetResponse> budgets) {
        this.budgets = budgets;
    }
}
