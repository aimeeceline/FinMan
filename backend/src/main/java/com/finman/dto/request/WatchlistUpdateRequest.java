package com.finman.dto.request;

import jakarta.validation.constraints.Size;

public class WatchlistUpdateRequest {

    @Size(max = 255, message = "Ghi chú tối đa 255 ký tự")
    private String note;

    private Long targetPrice;

    private Boolean alertEnabled;

    private Integer displayOrder;

    public WatchlistUpdateRequest() {
    }

    public WatchlistUpdateRequest(String note, Long targetPrice, Boolean alertEnabled, Integer displayOrder) {
        this.note = note;
        this.targetPrice = targetPrice;
        this.alertEnabled = alertEnabled;
        this.displayOrder = displayOrder;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public Long getTargetPrice() {
        return targetPrice;
    }

    public void setTargetPrice(Long targetPrice) {
        this.targetPrice = targetPrice;
    }

    public Boolean getAlertEnabled() {
        return alertEnabled;
    }

    public void setAlertEnabled(Boolean alertEnabled) {
        this.alertEnabled = alertEnabled;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }
}

