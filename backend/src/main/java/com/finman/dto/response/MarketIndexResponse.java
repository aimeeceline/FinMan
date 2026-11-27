package com.finman.dto.response;

import com.finman.entity.MarketIndex;

import java.math.BigDecimal;
import java.time.Instant;

public class MarketIndexResponse {

    private Long id;
    private String code;
    private String name;
    private String description;
    private BigDecimal currentValue;
    private BigDecimal changeValue;
    private BigDecimal percentChange;
    private Long tradingVolume;
    private Long tradingValue;
    private String sessionStatus;
    private Instant lastUpdatedAt;

    public MarketIndexResponse() {
    }

    public static MarketIndexResponse fromEntity(MarketIndex index) {
        if (index == null) return null;
        MarketIndexResponse res = new MarketIndexResponse();
        res.setId(index.getId());
        res.setCode(index.getCode());
        res.setName(index.getName());
        res.setDescription(index.getDescription());
        res.setCurrentValue(index.getCurrentValue());
        res.setChangeValue(index.getChangeValue());
        res.setPercentChange(index.getPercentChange());
        res.setTradingVolume(index.getTradingVolume());
        res.setTradingValue(index.getTradingValue());
        res.setSessionStatus(index.getSessionStatus());
        res.setLastUpdatedAt(index.getLastUpdatedAt());
        return res;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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

    public Instant getLastUpdatedAt() {
        return lastUpdatedAt;
    }

    public void setLastUpdatedAt(Instant lastUpdatedAt) {
        this.lastUpdatedAt = lastUpdatedAt;
    }
}

