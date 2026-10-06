package com.finman.dto.response;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class AiInsightsResponse {

    private String month;
    private String overview;
    private List<String> recommendations = new ArrayList<>();
    private Long totalIncome;
    private Long totalExpense;
    private Long netSavings;
    private Double savingsRate;
    private AiInsightsKeyMetrics keyMetrics;
    private List<CategorySpendingItem> topExpenseCategories = new ArrayList<>();
    private List<String> alerts = new ArrayList<>();
    private LocalDateTime generatedAt;

    public AiInsightsResponse() {
    }

    public AiInsightsResponse(String month, String overview, List<String> recommendations,
                              Long totalIncome, Long totalExpense, Long netSavings, LocalDateTime generatedAt) {
        this.month = month;
        this.overview = overview;
        this.recommendations = recommendations != null ? recommendations : new ArrayList<>();
        this.totalIncome = totalIncome;
        this.totalExpense = totalExpense;
        this.netSavings = netSavings;
        this.generatedAt = generatedAt;
        if (totalIncome != null && totalIncome > 0 && netSavings != null) {
            this.savingsRate = Math.round(((double) netSavings / totalIncome * 100.0) * 10.0) / 10.0;
        } else {
            this.savingsRate = 0.0;
        }
    }

    public AiInsightsResponse(String month, String overview, List<String> recommendations,
                              Long totalIncome, Long totalExpense, Long netSavings, Double savingsRate,
                              AiInsightsKeyMetrics keyMetrics, List<CategorySpendingItem> topExpenseCategories,
                              List<String> alerts, LocalDateTime generatedAt) {
        this.month = month;
        this.overview = overview;
        this.recommendations = recommendations != null ? recommendations : new ArrayList<>();
        this.totalIncome = totalIncome;
        this.totalExpense = totalExpense;
        this.netSavings = netSavings;
        this.savingsRate = savingsRate;
        this.keyMetrics = keyMetrics;
        this.topExpenseCategories = topExpenseCategories != null ? topExpenseCategories : new ArrayList<>();
        this.alerts = alerts != null ? alerts : new ArrayList<>();
        this.generatedAt = generatedAt;
    }

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }

    public String getOverview() {
        return overview;
    }

    public void setOverview(String overview) {
        this.overview = overview;
    }

    public List<String> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<String> recommendations) {
        this.recommendations = recommendations;
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

    public Long getNetSavings() {
        return netSavings;
    }

    public void setNetSavings(Long netSavings) {
        this.netSavings = netSavings;
    }

    public Double getSavingsRate() {
        return savingsRate;
    }

    public void setSavingsRate(Double savingsRate) {
        this.savingsRate = savingsRate;
    }

    public AiInsightsKeyMetrics getKeyMetrics() {
        return keyMetrics;
    }

    public void setKeyMetrics(AiInsightsKeyMetrics keyMetrics) {
        this.keyMetrics = keyMetrics;
    }

    public List<CategorySpendingItem> getTopExpenseCategories() {
        return topExpenseCategories;
    }

    public void setTopExpenseCategories(List<CategorySpendingItem> topExpenseCategories) {
        this.topExpenseCategories = topExpenseCategories;
    }

    public List<String> getAlerts() {
        return alerts;
    }

    public void setAlerts(List<String> alerts) {
        this.alerts = alerts;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }
}
