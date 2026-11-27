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

@Entity
@Table(
        name = "market_indices",
        indexes = {
                @Index(name = "idx_market_indices_code", columnList = "code", unique = true)
        }
)
public class MarketIndex {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Mã chỉ số không được để trống")
    @Size(max = 20, message = "Mã chỉ số tối đa 20 ký tự")
    @Column(name = "code", nullable = false, unique = true, length = 20)
    private String code;

    @NotBlank(message = "Tên chỉ số không được để trống")
    @Size(max = 100, message = "Tên chỉ số tối đa 100 ký tự")
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Size(max = 255, message = "Mô tả tối đa 255 ký tự")
    @Column(name = "description", length = 255)
    private String description;

    @NotNull(message = "Điểm số chỉ số không được để trống")
    @Column(name = "current_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal currentValue = BigDecimal.ZERO;

    @NotNull(message = "Biến động điểm không được để trống")
    @Column(name = "change_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal changeValue = BigDecimal.ZERO;

    @NotNull(message = "Biến động phần trăm không được để trống")
    @Column(name = "percent_change", nullable = false, precision = 6, scale = 2)
    private BigDecimal percentChange = BigDecimal.ZERO;

    @Column(name = "trading_volume")
    private Long tradingVolume = 0L;

    @Column(name = "trading_value")
    private Long tradingValue = 0L;

    @Column(name = "session_status", length = 20)
    private String sessionStatus = "CLOSED";

    @Column(name = "last_updated_at")
    private Instant lastUpdatedAt;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public MarketIndex() {
    }

    public MarketIndex(String code, String name, String description, BigDecimal currentValue, BigDecimal changeValue, BigDecimal percentChange) {
        this.code = code;
        this.name = name;
        this.description = description;
        this.currentValue = currentValue;
        this.changeValue = changeValue;
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
        if (this.lastUpdatedAt == null) {
            this.lastUpdatedAt = now;
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
        MarketIndex that = (MarketIndex) o;
        return Objects.equals(code, that.code);
    }

    @Override
    public int hashCode() {
        return Objects.hash(code);
    }

    @Override
    public String toString() {
        return "MarketIndex{" +
                "id=" + id +
                ", code='" + code + '\'' +
                ", name='" + name + '\'' +
                ", currentValue=" + currentValue +
                ", changeValue=" + changeValue +
                ", percentChange=" + percentChange +
                '}';
    }
}

