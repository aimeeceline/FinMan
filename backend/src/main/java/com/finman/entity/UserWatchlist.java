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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.Objects;

/**
 * Thực thể danh sách cổ phiếu theo dõi cá nhân của người dùng (User Watchlist).
 */
@Entity
@Table(
        name = "user_watchlists",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_user_watchlists_user_symbol", columnNames = {"user_id", "symbol_id"})
        },
        indexes = {
                @Index(name = "idx_user_watchlists_user", columnList = "user_id, display_order ASC, created_at DESC"),
                @Index(name = "idx_user_watchlists_symbol", columnList = "symbol_id")
        }
)
public class UserWatchlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Người dùng không được để trống")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotNull(message = "Mã cổ phiếu không được để trống")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "symbol_id", nullable = false)
    private StockSymbol stockSymbol;

    @Size(max = 255, message = "Ghi chú tối đa 255 ký tự")
    @Column(name = "note", length = 255)
    private String note;

    @Column(name = "target_price")
    private Long targetPrice;

    @Column(name = "alert_enabled", nullable = false)
    private Boolean alertEnabled = false;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public UserWatchlist() {
    }

    public UserWatchlist(User user, StockSymbol stockSymbol) {
        this.user = user;
        this.stockSymbol = stockSymbol;
    }

    public UserWatchlist(User user, StockSymbol stockSymbol, String note, Long targetPrice) {
        this.user = user;
        this.stockSymbol = stockSymbol;
        this.note = note;
        this.targetPrice = targetPrice;
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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public StockSymbol getStockSymbol() {
        return stockSymbol;
    }

    public void setStockSymbol(StockSymbol stockSymbol) {
        this.stockSymbol = stockSymbol;
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
        UserWatchlist that = (UserWatchlist) o;
        return Objects.equals(user, that.user) && Objects.equals(stockSymbol, that.stockSymbol);
    }

    @Override
    public int hashCode() {
        return Objects.hash(user, stockSymbol);
    }

    @Override
    public String toString() {
        return "UserWatchlist{" +
                "id=" + id +
                ", user=" + (user != null ? user.getId() : null) +
                ", stockSymbol=" + (stockSymbol != null ? stockSymbol.getSymbol() : null) +
                ", note='" + note + '\'' +
                ", targetPrice=" + targetPrice +
                ", alertEnabled=" + alertEnabled +
                ", displayOrder=" + displayOrder +
                '}';
    }
}

