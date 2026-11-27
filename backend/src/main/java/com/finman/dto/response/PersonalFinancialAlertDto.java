package com.finman.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class PersonalFinancialAlertDto {

    private int dayOfMonth;
    private int daysInMonth;
    private double monthProgressPercent;
    private Long totalBudget;
    private Long totalSpent;
    private Long totalRemaining;
    private double spentPercentage;
    private String alertLevel; // "SAFE", "WARNING", "DANGER", "INFO"
    private String title;
    private String message;
    private String recommendation;
    private String highestCategoryName;
    private double highestCategoryPercent;

    public PersonalFinancialAlertDto() {
    }

    public PersonalFinancialAlertDto(int dayOfMonth, int daysInMonth, double monthProgressPercent,
                                     Long totalBudget, Long totalSpent, Long totalRemaining,
                                     double spentPercentage, String alertLevel, String title,
                                     String message, String recommendation, String highestCategoryName,
                                     double highestCategoryPercent) {
        this.dayOfMonth = dayOfMonth;
        this.daysInMonth = daysInMonth;
        this.monthProgressPercent = monthProgressPercent;
        this.totalBudget = totalBudget;
        this.totalSpent = totalSpent;
        this.totalRemaining = totalRemaining;
        this.spentPercentage = spentPercentage;
        this.alertLevel = alertLevel;
        this.title = title;
        this.message = message;
        this.recommendation = recommendation;
        this.highestCategoryName = highestCategoryName;
        this.highestCategoryPercent = highestCategoryPercent;
    }

    public int getDayOfMonth() {
        return dayOfMonth;
    }

    public void setDayOfMonth(int dayOfMonth) {
        this.dayOfMonth = dayOfMonth;
    }

    public int getDaysInMonth() {
        return daysInMonth;
    }

    public void setDaysInMonth(int daysInMonth) {
        this.daysInMonth = daysInMonth;
    }

    public double getMonthProgressPercent() {
        return monthProgressPercent;
    }

    public void setMonthProgressPercent(double monthProgressPercent) {
        this.monthProgressPercent = monthProgressPercent;
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

    public double getSpentPercentage() {
        return spentPercentage;
    }

    public void setSpentPercentage(double spentPercentage) {
        this.spentPercentage = spentPercentage;
    }

    public String getAlertLevel() {
        return alertLevel;
    }

    public void setAlertLevel(String alertLevel) {
        this.alertLevel = alertLevel;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public void setRecommendation(String recommendation) {
        this.recommendation = recommendation;
    }

    public String getHighestCategoryName() {
        return highestCategoryName;
    }

    public void setHighestCategoryName(String highestCategoryName) {
        this.highestCategoryName = highestCategoryName;
    }

    public double getHighestCategoryPercent() {
        return highestCategoryPercent;
    }

    public void setHighestCategoryPercent(double highestCategoryPercent) {
        this.highestCategoryPercent = highestCategoryPercent;
    }
}
