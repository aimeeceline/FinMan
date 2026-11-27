package com.finman.dto.response;

import com.finman.entity.StockSymbol;
import com.finman.entity.UserWatchlist;

import java.math.BigDecimal;
import java.time.Instant;

public class UserWatchlistResponse {

    private Long id;
    private Long userId;
    private Long symbolId;
    private String symbol;
    private String companyName;
    private String exchange;
    private String sector;
    private Long currentPrice;
    private Long changePrice;
    private BigDecimal percentChange;
    private Long referencePrice;
    private Long ceilingPrice;
    private Long floorPrice;
    private Long totalVolume;
    private String note;
    private Long targetPrice;
    private Boolean alertEnabled;
    private Integer displayOrder;
    private Instant createdAt;

    public UserWatchlistResponse() {
    }

    public static UserWatchlistResponse fromEntity(UserWatchlist w) {
        if (w == null) return null;
        UserWatchlistResponse res = new UserWatchlistResponse();
        res.setId(w.getId());
        res.setUserId(w.getUser() != null ? w.getUser().getId() : null);
        res.setNote(w.getNote());
        res.setTargetPrice(w.getTargetPrice());
        res.setAlertEnabled(w.getAlertEnabled());
        res.setDisplayOrder(w.getDisplayOrder());
        res.setCreatedAt(w.getCreatedAt());

        StockSymbol s = w.getStockSymbol();
        if (s != null) {
            res.setSymbolId(s.getId());
            res.setSymbol(s.getSymbol());
            res.setCompanyName(s.getCompanyName());
            res.setExchange(s.getExchange());
            res.setSector(s.getSector());
            res.setCurrentPrice(s.getCurrentPrice());
            res.setChangePrice(s.getChangePrice());
            res.setPercentChange(s.getPercentChange());
            res.setReferencePrice(s.getReferencePrice());
            res.setCeilingPrice(s.getCeilingPrice());
            res.setFloorPrice(s.getFloorPrice());
            res.setTotalVolume(s.getTotalVolume());
        }
        return res;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getSymbolId() {
        return symbolId;
    }

    public void setSymbolId(Long symbolId) {
        this.symbolId = symbolId;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getExchange() {
        return exchange;
    }

    public void setExchange(String exchange) {
        this.exchange = exchange;
    }

    public String getSector() {
        return sector;
    }

    public void setSector(String sector) {
        this.sector = sector;
    }

    public Long getCurrentPrice() {
        return currentPrice;
    }

    public void setCurrentPrice(Long currentPrice) {
        this.currentPrice = currentPrice;
    }

    public Long getChangePrice() {
        return changePrice;
    }

    public void setChangePrice(Long changePrice) {
        this.changePrice = changePrice;
    }

    public BigDecimal getPercentChange() {
        return percentChange;
    }

    public void setPercentChange(BigDecimal percentChange) {
        this.percentChange = percentChange;
    }

    public Long getReferencePrice() {
        return referencePrice;
    }

    public void setReferencePrice(Long referencePrice) {
        this.referencePrice = referencePrice;
    }

    public Long getCeilingPrice() {
        return ceilingPrice;
    }

    public void setCeilingPrice(Long ceilingPrice) {
        this.ceilingPrice = ceilingPrice;
    }

    public Long getFloorPrice() {
        return floorPrice;
    }

    public void setFloorPrice(Long floorPrice) {
        this.floorPrice = floorPrice;
    }

    public Long getTotalVolume() {
        return totalVolume;
    }

    public void setTotalVolume(Long totalVolume) {
        this.totalVolume = totalVolume;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}

