package com.finman.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

/**
 * Thực thể mã chứng khoán (Stock Symbol).
 * Lưu ý theo DoD: Số liệu giá cổ phiếu được lưu trữ bằng BIGINT (VND nguyên vẹn).
 * Ví dụ: Giá 138,500 VND được lưu là 138500L.
 */
@Entity
@Table(
        name = "stock_symbols",
        indexes = {
                @Index(name = "idx_stock_symbols_symbol", columnList = "symbol", unique = true),
                @Index(name = "idx_stock_symbols_exchange", columnList = "exchange"),
                @Index(name = "idx_stock_symbols_sector", columnList = "sector")
        }
)
public class StockSymbol {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Mã cổ phiếu không được để trống")
    @Size(max = 20, message = "Mã cổ phiếu tối đa 20 ký tự")
    @Column(name = "symbol", nullable = false, unique = true, length = 20)
    private String symbol;

    @NotBlank(message = "Tên công ty không được để trống")
    @Size(max = 255, message = "Tên công ty tối đa 255 ký tự")
    @Column(name = "company_name", nullable = false, length = 255)
    private String companyName;

    @NotBlank(message = "Sàn giao dịch không được để trống")
    @Size(max = 20, message = "Sàn giao dịch tối đa 20 ký tự")
    @Column(name = "exchange", nullable = false, length = 20)
    private String exchange = "HOSE";

    @Size(max = 100, message = "Ngành nghề tối đa 100 ký tự")
    @Column(name = "sector", length = 100)
    private String sector;

    @NotNull(message = "Giá hiện tại không được để trống")
    @Column(name = "current_price", nullable = false)
    private Long currentPrice = 0L;

    @NotNull(message = "Biến động giá không được để trống")
    @Column(name = "change_price", nullable = false)
    private Long changePrice = 0L;

    @NotNull(message = "Biến động phần trăm không được để trống")
    @Column(name = "percent_change", nullable = false, precision = 6, scale = 2)
    private BigDecimal percentChange = BigDecimal.ZERO;

    @Column(name = "reference_price")
    private Long referencePrice = 0L;

    @Column(name = "ceiling_price")
    private Long ceilingPrice = 0L;

    @Column(name = "floor_price")
    private Long floorPrice = 0L;

    @Column(name = "open_price")
    private Long openPrice = 0L;

    @Column(name = "high_price")
    private Long highPrice = 0L;

    @Column(name = "low_price")
    private Long lowPrice = 0L;

    @Column(name = "total_volume")
    private Long totalVolume = 0L;

    @Column(name = "total_value")
    private Long totalValue = 0L;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public StockSymbol() {
    }

    public StockSymbol(String symbol, String companyName, String exchange, String sector, Long currentPrice, Long changePrice, BigDecimal percentChange) {
        this.symbol = symbol;
        this.companyName = companyName;
        this.exchange = exchange;
        this.sector = sector;
        this.currentPrice = currentPrice;
        this.changePrice = changePrice;
        this.percentChange = percentChange;
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        StockSymbol that = (StockSymbol) o;
        return Objects.equals(symbol, that.symbol);
    }

    @Override
    public int hashCode() {
        return Objects.hash(symbol);
    }

    @Override
    public String toString() {
        return "StockSymbol{" +
                "id=" + id +
                ", symbol='" + symbol + '\'' +
                ", companyName='" + companyName + '\'' +
                ", exchange='" + exchange + '\'' +
                ", currentPrice=" + currentPrice +
                ", changePrice=" + changePrice +
                ", percentChange=" + percentChange +
                '}';
    }
}

