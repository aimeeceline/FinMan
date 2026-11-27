package com.finman.dto.response;

import java.util.ArrayList;
import java.util.List;

public class PersonalizedInsightItem {

    private String topic;
    private String macroTitle;
    private String impactType; // POSITIVE, NEGATIVE, NEUTRAL, WARNING
    private String personalSituation;
    private String quantitativeCalculation;
    private Long estimatedFinancialImpactVnd;
    private String recommendedAction;
    private List<Integer> citationIndices = new ArrayList<>();

    public PersonalizedInsightItem() {
    }

    public PersonalizedInsightItem(String topic, String macroTitle, String impactType,
                                   String personalSituation, String quantitativeCalculation,
                                   Long estimatedFinancialImpactVnd, String recommendedAction,
                                   List<Integer> citationIndices) {
        this.topic = topic;
        this.macroTitle = macroTitle;
        this.impactType = impactType;
        this.personalSituation = personalSituation;
        this.quantitativeCalculation = quantitativeCalculation;
        this.estimatedFinancialImpactVnd = estimatedFinancialImpactVnd;
        this.recommendedAction = recommendedAction;
        this.citationIndices = citationIndices != null ? citationIndices : new ArrayList<>();
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public String getMacroTitle() {
        return macroTitle;
    }

    public void setMacroTitle(String macroTitle) {
        this.macroTitle = macroTitle;
    }

    public String getImpactType() {
        return impactType;
    }

    public void setImpactType(String impactType) {
        this.impactType = impactType;
    }

    public String getPersonalSituation() {
        return personalSituation;
    }

    public void setPersonalSituation(String personalSituation) {
        this.personalSituation = personalSituation;
    }

    public String getQuantitativeCalculation() {
        return quantitativeCalculation;
    }

    public void setQuantitativeCalculation(String quantitativeCalculation) {
        this.quantitativeCalculation = quantitativeCalculation;
    }

    public Long getEstimatedFinancialImpactVnd() {
        return estimatedFinancialImpactVnd;
    }

    public void setEstimatedFinancialImpactVnd(Long estimatedFinancialImpactVnd) {
        this.estimatedFinancialImpactVnd = estimatedFinancialImpactVnd;
    }

    public String getRecommendedAction() {
        return recommendedAction;
    }

    public void setRecommendedAction(String recommendedAction) {
        this.recommendedAction = recommendedAction;
    }

    public List<Integer> getCitationIndices() {
        return citationIndices;
    }

    public void setCitationIndices(List<Integer> citationIndices) {
        this.citationIndices = citationIndices != null ? citationIndices : new ArrayList<>();
    }
}

