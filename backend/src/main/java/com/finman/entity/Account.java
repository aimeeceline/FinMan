package com.finman.entity;

import com.finman.entity.enums.AccountType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.Objects;

@Entity
@Table(
        name = "accounts",
        indexes = {
                @Index(name = "idx_accounts_user", columnList = "user_id"),
                @Index(name = "idx_accounts_user_archived", columnList = "user_id, is_archived")
        }
)
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Người dùng không được để trống")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank(message = "Tên tài khoản không được để trống")
    @Size(max = 50, message = "Tên tài khoản tối đa 50 ký tự")
    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @NotNull(message = "Loại tài khoản không được để trống")
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private AccountType type;

    @NotNull(message = "Số dư ban đầu không được để trống")
    @Column(name = "initial_balance", nullable = false)
    private Long initialBalance = 0L;

    @NotNull(message = "Số dư hiện tại không được để trống")
    @Column(name = "current_balance", nullable = false)
    private Long currentBalance = 0L;

    @Min(value = 0, message = "Hạn mức tín dụng không được âm")
    @Column(name = "credit_limit")
    private Long creditLimit = 0L;

    @NotNull
    @Column(name = "is_archived", nullable = false)
    private Boolean isArchived = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Account() {
    }

    public Account(User user, String name, AccountType type, Long initialBalance) {
        this.user = user;
        this.name = name;
        this.type = type;
        this.initialBalance = initialBalance != null ? initialBalance : 0L;
        this.currentBalance = this.initialBalance;
        this.creditLimit = 0L;
        this.isArchived = false;
    }

    public Account(Long id, User user, String name, AccountType type, Long initialBalance, Long currentBalance, Long creditLimit, Boolean isArchived) {
        this.id = id;
        this.user = user;
        this.name = name;
        this.type = type;
        this.initialBalance = initialBalance != null ? initialBalance : 0L;
        this.currentBalance = currentBalance != null ? currentBalance : 0L;
        this.creditLimit = creditLimit != null ? creditLimit : 0L;
        this.isArchived = isArchived != null ? isArchived : false;
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.initialBalance == null) {
            this.initialBalance = 0L;
        }
        if (this.currentBalance == null) {
            this.currentBalance = this.initialBalance;
        }
        if (this.creditLimit == null) {
            this.creditLimit = 0L;
        }
        if (this.isArchived == null) {
            this.isArchived = false;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public AccountType getType() {
        return type;
    }

    public void setType(AccountType type) {
        this.type = type;
    }

    public Long getInitialBalance() {
        return initialBalance;
    }

    public void setInitialBalance(Long initialBalance) {
        this.initialBalance = initialBalance;
    }

    public Long getCurrentBalance() {
        return currentBalance;
    }

    public void setCurrentBalance(Long currentBalance) {
        this.currentBalance = currentBalance;
    }

    public Long getCreditLimit() {
        return creditLimit;
    }

    public void setCreditLimit(Long creditLimit) {
        this.creditLimit = creditLimit;
    }

    public Boolean getIsArchived() {
        return isArchived;
    }

    public void setIsArchived(Boolean archived) {
        isArchived = archived;
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
        Account account = (Account) o;
        return Objects.equals(id, account.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Account{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", type=" + type +
                ", initialBalance=" + initialBalance +
                ", currentBalance=" + currentBalance +
                ", creditLimit=" + creditLimit +
                ", isArchived=" + isArchived +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}
