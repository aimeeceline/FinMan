package com.finman.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class DailyIntelligenceResponse {

    private Long id;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate digestDate;
    private String aiMacroSummary;
    private List<MarketPulseItemDto> marketPulse = new ArrayList<>();
    private List<HeadlineItemDto> topHeadlines = new ArrayList<>();
    private List<String> keyTakeaways = new ArrayList<>();
    private List<String> suggestedPrompts = new ArrayList<>();
    private PersonalFinancialAlertDto personalAlert;
    private String status;
    private Instant createdAt;

    public DailyIntelligenceResponse() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getDigestDate() {
        return digestDate;
    }

    public void setDigestDate(LocalDate digestDate) {
        this.digestDate = digestDate;
    }

    public String getAiMacroSummary() {
        return aiMacroSummary;
    }

    public void setAiMacroSummary(String aiMacroSummary) {
        this.aiMacroSummary = aiMacroSummary;
    }

    public List<MarketPulseItemDto> getMarketPulse() {
        return marketPulse;
    }

    public void setMarketPulse(List<MarketPulseItemDto> marketPulse) {
        this.marketPulse = marketPulse;
    }

    public List<HeadlineItemDto> getTopHeadlines() {
        return topHeadlines;
    }

    public void setTopHeadlines(List<HeadlineItemDto> topHeadlines) {
        this.topHeadlines = topHeadlines;
    }

    public List<String> getKeyTakeaways() {
        return keyTakeaways;
    }

    public void setKeyTakeaways(List<String> keyTakeaways) {
        this.keyTakeaways = keyTakeaways;
    }

    public List<String> getSuggestedPrompts() {
        return suggestedPrompts;
    }

    public void setSuggestedPrompts(List<String> suggestedPrompts) {
        this.suggestedPrompts = suggestedPrompts;
    }

    public PersonalFinancialAlertDto getPersonalAlert() {
        return personalAlert;
    }

    public void setPersonalAlert(PersonalFinancialAlertDto personalAlert) {
        this.personalAlert = personalAlert;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
