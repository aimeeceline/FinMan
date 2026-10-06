package com.finman.dto.response;

public class AiInsightsKeyMetrics {

    private Double savingsRate;
    private String highestExpenseCategory;
    private Long highestExpenseAmount;
    private Double highestExpensePercentage;
    private Double incomeChangePercentage;
    private Double expenseChangePercentage;
    private Double savingsChangePercentage;

    public AiInsightsKeyMetrics() {
    }

    public AiInsightsKeyMetrics(Double savingsRate,
                               String highestExpenseCategory,
                               Long highestExpenseAmount,
                               Double highestExpensePercentage,
                               Double incomeChangePercentage,
                               Double expenseChangePercentage,
                               Double savingsChangePercentage) {
        this.savingsRate = savingsRate;
        this.highestExpenseCategory = highestExpenseCategory;
        this.highestExpenseAmount = highestExpenseAmount;
        this.highestExpensePercentage = highestExpensePercentage;
        this.incomeChangePercentage = incomeChangePercentage;
        this.expenseChangePercentage = expenseChangePercentage;
        this.savingsChangePercentage = savingsChangePercentage;
    }

    public Double getSavingsRate() {
        return savingsRate;
    }

    public void setSavingsRate(Double savingsRate) {
        this.savingsRate = savingsRate;
    }

    public String getHighestExpenseCategory() {
        return highestExpenseCategory;
    }

    public void setHighestExpenseCategory(String highestExpenseCategory) {
        this.highestExpenseCategory = highestExpenseCategory;
    }

    public Long getHighestExpenseAmount() {
        return highestExpenseAmount;
    }

    public void setHighestExpenseAmount(Long highestExpenseAmount) {
        this.highestExpenseAmount = highestExpenseAmount;
    }

    public Double getHighestExpensePercentage() {
        return highestExpensePercentage;
    }

    public void setHighestExpensePercentage(Double highestExpensePercentage) {
        this.highestExpensePercentage = highestExpensePercentage;
    }

    public Double getIncomeChangePercentage() {
        return incomeChangePercentage;
    }

    public void setIncomeChangePercentage(Double incomeChangePercentage) {
        this.incomeChangePercentage = incomeChangePercentage;
    }

    public Double getExpenseChangePercentage() {
        return expenseChangePercentage;
    }

    public void setExpenseChangePercentage(Double expenseChangePercentage) {
        this.expenseChangePercentage = expenseChangePercentage;
    }

    public Double getSavingsChangePercentage() {
        return savingsChangePercentage;
    }

    public void setSavingsChangePercentage(Double savingsChangePercentage) {
        this.savingsChangePercentage = savingsChangePercentage;
    }
}
