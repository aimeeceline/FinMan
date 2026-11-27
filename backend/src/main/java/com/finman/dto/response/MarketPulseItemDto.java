package com.finman.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

@JsonIgnoreProperties(ignoreUnknown = true)
public class MarketPulseItemDto {

    private String code;
    private String name;
    private BigDecimal currentValue;
    private BigDecimal changeValue;
    private BigDecimal percentChange;
    private Long tradingVolume;
    private Long tradingValue;
    private String sessionStatus;

    @JsonProperty("isPositive")
    private boolean isPositive;

    public MarketPulseItemDto() {
    }

    public MarketPulseItemDto(String code, String name, BigDecimal currentValue, BigDecimal changeValue,
                              BigDecimal percentChange, Long tradingVolume, Long tradingValue,
                              String sessionStatus, boolean isPositive) {
        this.code = code;
        this.name = name;
        this.currentValue = currentValue;
        this.changeValue = changeValue;
        this.percentChange = percentChange;
        this.tradingVolume = tradingVolume;
        this.tradingValue = tradingValue;
        this.sessionStatus = sessionStatus;
        this.isPositive = isPositive;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getCurrentValue() {
        return currentValue;
    }

    public void setCurrentValue(BigDecimal currentValue) {
        this.currentValue = currentValue;
    }

    public BigDecimal getChangeValue() {
        return changeValue;
    }

    public void setChangeValue(BigDecimal changeValue) {
        this.changeValue = changeValue;
    }

    public BigDecimal getPercentChange() {
        return percentChange;
    }

    public void setPercentChange(BigDecimal percentChange) {
        this.percentChange = percentChange;
    }

    public Long getTradingVolume() {
        return tradingVolume;
    }

    public void setTradingVolume(Long tradingVolume) {
        this.tradingVolume = tradingVolume;
    }

    public Long getTradingValue() {
        return tradingValue;
    }

    public void setTradingValue(Long tradingValue) {
        this.tradingValue = tradingValue;
    }

    public String getSessionStatus() {
        return sessionStatus;
    }

    public void setSessionStatus(String sessionStatus) {
        this.sessionStatus = sessionStatus;
    }

    @JsonProperty("isPositive")
    public boolean isPositive() {
        return isPositive;
    }

    @JsonProperty("isPositive")
    public void setPositive(boolean positive) {
        isPositive = positive;
    }
}
