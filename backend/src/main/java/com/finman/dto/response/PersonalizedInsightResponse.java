package com.finman.dto.response;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class PersonalizedInsightResponse {

    private String summary;
    private Long netWorthVnd;
    private Long liquidAssetsVnd;
    private Double cashRunwayMonths;
    private String runwayAssessment; // AN TOÀN, CẦN TĂNG DỰ PHÒNG, THỪA THANH KHOẢN
    private List<PersonalizedInsightItem> insights = new ArrayList<>();
    private List<HybridFinancialContext.RetrievedNewsItem> retrievedNews = new ArrayList<>();
    private String disclaimer;
    private String modelVersion;
    private LocalDateTime generatedAt;

    public PersonalizedInsightResponse() {
        this.generatedAt = LocalDateTime.now();
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public Long getNetWorthVnd() {
        return netWorthVnd;
    }

    public void setNetWorthVnd(Long netWorthVnd) {
        this.netWorthVnd = netWorthVnd;
    }

    public Long getLiquidAssetsVnd() {
        return liquidAssetsVnd;
    }

    public void setLiquidAssetsVnd(Long liquidAssetsVnd) {
        this.liquidAssetsVnd = liquidAssetsVnd;
    }

    public Double getCashRunwayMonths() {
        return cashRunwayMonths;
    }

    public void setCashRunwayMonths(Double cashRunwayMonths) {
        this.cashRunwayMonths = cashRunwayMonths;
    }

    public String getRunwayAssessment() {
        return runwayAssessment;
    }

    public void setRunwayAssessment(String runwayAssessment) {
        this.runwayAssessment = runwayAssessment;
    }

    public List<PersonalizedInsightItem> getInsights() {
        return insights;
    }

    public void setInsights(List<PersonalizedInsightItem> insights) {
        this.insights = insights != null ? insights : new ArrayList<>();
    }

    public List<HybridFinancialContext.RetrievedNewsItem> getRetrievedNews() {
        return retrievedNews;
    }

    public void setRetrievedNews(List<HybridFinancialContext.RetrievedNewsItem> retrievedNews) {
        this.retrievedNews = retrievedNews != null ? retrievedNews : new ArrayList<>();
    }

    public String getDisclaimer() {
        return disclaimer;
    }

    public void setDisclaimer(String disclaimer) {
        this.disclaimer = disclaimer;
    }

    public String getModelVersion() {
        return modelVersion;
    }

    public void setModelVersion(String modelVersion) {
        this.modelVersion = modelVersion;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }
}

