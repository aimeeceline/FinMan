package com.finman.dto.response;

import com.finman.entity.StockSymbol;

import java.math.BigDecimal;
import java.time.Instant;

public class StockQuoteResponse {

    private Long id;
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
    private Long openPrice;
    private Long highPrice;
    private Long lowPrice;
    private Long totalVolume;
    private Long totalValue;
    private Boolean isActive;
    private Instant updatedAt;

    public StockQuoteResponse() {
    }

    public static StockQuoteResponse fromEntity(StockSymbol s) {
        if (s == null) return null;
        StockQuoteResponse res = new StockQuoteResponse();
        res.setId(s.getId());
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
        res.setOpenPrice(s.getOpenPrice());
        res.setHighPrice(s.getHighPrice());
        res.setLowPrice(s.getLowPrice());
        res.setTotalVolume(s.getTotalVolume());
        res.setTotalValue(s.getTotalValue());
        res.setIsActive(s.getIsActive());
        res.setUpdatedAt(s.getUpdatedAt());
        return res;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Long getOpenPrice() {
        return openPrice;
    }

    public void setOpenPrice(Long openPrice) {
        this.openPrice = openPrice;
    }

    public Long getHighPrice() {
        return highPrice;
    }

    public void setHighPrice(Long highPrice) {
        this.highPrice = highPrice;
    }

    public Long getLowPrice() {
        return lowPrice;
    }

    public void setLowPrice(Long lowPrice) {
        this.lowPrice = lowPrice;
    }

    public Long getTotalVolume() {
        return totalVolume;
    }

    public void setTotalVolume(Long totalVolume) {
        this.totalVolume = totalVolume;
    }

    public Long getTotalValue() {
        return totalValue;
    }

    public void setTotalValue(Long totalValue) {
        this.totalValue = totalValue;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

