package com.finman.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;

/**
 * Thực thể lịch sử giá cổ phiếu theo ngày (EOD - End Of Day Price History).
 * Số liệu giá được lưu bằng BIGINT (VND nguyên vẹn).
 */
@Entity
@Table(
        name = "stock_price_history",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_stock_history_symbol_date", columnNames = {"symbol_id", "trade_date"})
        },
        indexes = {
                @Index(name = "idx_stock_price_history_symbol_date", columnList = "symbol_id, trade_date DESC")
        }
)
public class StockPriceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Mã cổ phiếu không được để trống")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "symbol_id", nullable = false)
    private StockSymbol stockSymbol;

    @NotNull(message = "Ngày giao dịch không được để trống")
    @Column(name = "trade_date", nullable = false)
    private LocalDate tradeDate;

    @NotNull(message = "Giá mở cửa không được để trống")
    @Column(name = "open_price", nullable = false)
    private Long openPrice;

    @NotNull(message = "Giá cao nhất không được để trống")
    @Column(name = "high_price", nullable = false)
    private Long highPrice;

    @NotNull(message = "Giá thấp nhất không được để trống")
    @Column(name = "low_price", nullable = false)
    private Long lowPrice;

    @NotNull(message = "Giá đóng cửa không được để trống")
    @Column(name = "close_price", nullable = false)
    private Long closePrice;

    @Column(name = "change_price")
    private Long changePrice = 0L;

    @Column(name = "percent_change", precision = 6, scale = 2)
    private BigDecimal percentChange = BigDecimal.ZERO;

    @Column(name = "volume")
    private Long volume = 0L;

    @Column(name = "total_value")
    private Long totalValue = 0L;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public StockPriceHistory() {
    }

    public StockPriceHistory(StockSymbol stockSymbol, LocalDate tradeDate, Long openPrice, Long highPrice, Long lowPrice, Long closePrice, Long changePrice, BigDecimal percentChange, Long volume, Long totalValue) {
        this.stockSymbol = stockSymbol;
        this.tradeDate = tradeDate;
        this.openPrice = openPrice;
        this.highPrice = highPrice;
        this.lowPrice = lowPrice;
        this.closePrice = closePrice;
        this.changePrice = changePrice;
        this.percentChange = percentChange;
        this.volume = volume;
        this.totalValue = totalValue;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public StockSymbol getStockSymbol() {
        return stockSymbol;
    }

    public void setStockSymbol(StockSymbol stockSymbol) {
        this.stockSymbol = stockSymbol;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        StockPriceHistory that = (StockPriceHistory) o;
        return Objects.equals(stockSymbol, that.stockSymbol) && Objects.equals(tradeDate, that.tradeDate);
    }

    @Override
    public int hashCode() {
        return Objects.hash(stockSymbol, tradeDate);
    }

    @Override
    public String toString() {
        return "StockPriceHistory{" +
                "id=" + id +
                ", tradeDate=" + tradeDate +
                ", openPrice=" + openPrice +
                ", highPrice=" + highPrice +
                ", lowPrice=" + lowPrice +
                ", closePrice=" + closePrice +
                ", changePrice=" + changePrice +
                ", percentChange=" + percentChange +
                ", volume=" + volume +
                '}';
    }
}

