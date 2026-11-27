package com.finman.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class WatchlistAddRequest {

    @NotBlank(message = "Mã cổ phiếu không được để trống")
    @Size(max = 20, message = "Mã cổ phiếu tối đa 20 ký tự")
    private String symbol;

    @Size(max = 255, message = "Ghi chú tối đa 255 ký tự")
    private String note;

    private Long targetPrice;

    private Boolean alertEnabled = false;

    public WatchlistAddRequest() {
    }

    public WatchlistAddRequest(String symbol, String note, Long targetPrice) {
        this.symbol = symbol;
        this.note = note;
        this.targetPrice = targetPrice;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
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
}

