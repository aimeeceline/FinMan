package com.finman.dto.response;

import com.finman.entity.StockPriceHistory;

import java.math.BigDecimal;
import java.time.LocalDate;

public class StockPriceHistoryResponse {

    private Long id;
    private String symbol;
    private LocalDate tradeDate;
    private Long openPrice;
    private Long highPrice;
    private Long lowPrice;
    private Long closePrice;
    private Long changePrice;
    private BigDecimal percentChange;
    private Long volume;
    private Long totalValue;

    public StockPriceHistoryResponse() {
    }

    public static StockPriceHistoryResponse fromEntity(StockPriceHistory h) {
        if (h == null) return null;
        StockPriceHistoryResponse res = new StockPriceHistoryResponse();
        res.setId(h.getId());
        res.setSymbol(h.getStockSymbol() != null ? h.getStockSymbol().getSymbol() : null);
        res.setTradeDate(h.getTradeDate());
        res.setOpenPrice(h.getOpenPrice());
        res.setHighPrice(h.getHighPrice());
        res.setLowPrice(h.getLowPrice());
        res.setClosePrice(h.getClosePrice());
        res.setChangePrice(h.getChangePrice());
        res.setPercentChange(h.getPercentChange());
        res.setVolume(h.getVolume());
        res.setTotalValue(h.getTotalValue());
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

    public LocalDate getTradeDate() {
        return tradeDate;
    }

    public void setTradeDate(LocalDate tradeDate) {
        this.tradeDate = tradeDate;
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

    public Long getClosePrice() {
        return closePrice;
    }

    public void setClosePrice(Long closePrice) {
        this.closePrice = closePrice;
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

    public Long getVolume() {
        return volume;
    }

    public void setVolume(Long volume) {
        this.volume = volume;
    }

    public Long getTotalValue() {
        return totalValue;
    }

    public void setTotalValue(Long totalValue) {
        this.totalValue = totalValue;
    }
}

