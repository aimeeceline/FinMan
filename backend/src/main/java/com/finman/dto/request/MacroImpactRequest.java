package com.finman.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class MacroImpactRequest {

    @NotBlank(message = "Chủ đề vĩ mô không được để trống")
    private String macroTopic;

    @NotNull(message = "Tỷ lệ biến động ước tính không được để trống")
    private Double estimatedChangePct;

    public MacroImpactRequest() {
    }

    public MacroImpactRequest(String macroTopic, Double estimatedChangePct) {
        this.macroTopic = macroTopic;
        this.estimatedChangePct = estimatedChangePct;
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
}

