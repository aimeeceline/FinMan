package com.finman.dto.request;

import jakarta.validation.constraints.Pattern;

public class AiInsightsRequest {

    @Pattern(regexp = "^\\d{4}-\\d{2}$", message = "Định dạng tháng không hợp lệ (yêu cầu YYYY-MM)")
    private String month;

    public AiInsightsRequest() {
    }

    public AiInsightsRequest(String month) {
        this.month = month;
    }

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }
}
