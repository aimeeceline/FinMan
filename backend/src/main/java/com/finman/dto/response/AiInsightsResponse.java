package com.finman.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public class AiInsightsResponse {

    private String month;
    private String overview;
    private List<String> recommendations;
    private Long totalIncome;
    private Long totalExpense;
    private Long netSavings;
    private LocalDateTime generatedAt;

    public AiInsightsResponse() {
    }

    public AiInsightsResponse(String month, String overview, List<String> recommendations,
                              Long totalIncome, Long totalExpense, Long netSavings, LocalDateTime generatedAt) {
        this.month = month;
        this.overview = overview;
        this.recommendations = recommendations;
        this.totalIncome = totalIncome;
        this.totalExpense = totalExpense;
        this.netSavings = netSavings;
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

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }
}
