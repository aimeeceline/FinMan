package com.finman.dto.response;

import java.time.LocalDateTime;

public class MacroImpactEvaluationResponse {

    private String macroTopic;
    private Double estimatedChangePct;
    private Long affectedBalanceVnd;
    private Long annualImpactVnd;
    private Long monthlyImpactVnd;
    private String calculationFormula;
    private String impactDescription;
    private String recommendation;
    private String disclaimer;
    private LocalDateTime calculatedAt;

    public MacroImpactEvaluationResponse() {
        this.calculatedAt = LocalDateTime.now();
    }

    public String getMacroTopic() {
        return macroTopic;
    }

    public void setMacroTopic(String macroTopic) {
        this.macroTopic = macroTopic;
    }

    public Double getEstimatedChangePct() {
        return estimatedChangePct;
    }

    public void setEstimatedChangePct(Double estimatedChangePct) {
        this.estimatedChangePct = estimatedChangePct;
    }

    public Long getAffectedBalanceVnd() {
        return affectedBalanceVnd;
    }

    public void setAffectedBalanceVnd(Long affectedBalanceVnd) {
        this.affectedBalanceVnd = affectedBalanceVnd;
    }

    public Long getAnnualImpactVnd() {
        return annualImpactVnd;
    }

    public void setAnnualImpactVnd(Long annualImpactVnd) {
        this.annualImpactVnd = annualImpactVnd;
    }

    public Long getMonthlyImpactVnd() {
        return monthlyImpactVnd;
    }

    public void setMonthlyImpactVnd(Long monthlyImpactVnd) {
        this.monthlyImpactVnd = monthlyImpactVnd;
    }

    public String getCalculationFormula() {
        return calculationFormula;
    }

    public void setCalculationFormula(String calculationFormula) {
        this.calculationFormula = calculationFormula;
    }

    public String getImpactDescription() {
        return impactDescription;
    }

    public void setImpactDescription(String impactDescription) {
        this.impactDescription = impactDescription;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public void setRecommendation(String recommendation) {
        this.recommendation = recommendation;
    }

    public String getDisclaimer() {
        return disclaimer;
    }

    public void setDisclaimer(String disclaimer) {
        this.disclaimer = disclaimer;
    }

    public LocalDateTime getCalculatedAt() {
        return calculatedAt;
    }

    public void setCalculatedAt(LocalDateTime calculatedAt) {
        this.calculatedAt = calculatedAt;
    }
}

