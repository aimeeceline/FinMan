package com.finman.dto.response;

import com.finman.entity.Account;
import com.finman.entity.enums.AccountType;

import java.time.Instant;

public class AccountResponse {

    private Long id;
    private String name;
    private AccountType type;
    private Long initialBalance;
    private Long currentBalance;
    private Long creditLimit;
    private Boolean isArchived;
    private Instant createdAt;
    private Instant updatedAt;

    public AccountResponse() {
    }

    public AccountResponse(Long id, String name, AccountType type, Long initialBalance, Long currentBalance, Long creditLimit, Boolean isArchived, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.initialBalance = initialBalance;
        this.currentBalance = currentBalance;
        this.creditLimit = creditLimit;
        this.isArchived = isArchived;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static AccountResponse from(Account account) {
        if (account == null) {
            return null;
        }
        return new AccountResponse(
                account.getId(),
                account.getName(),
                account.getType(),
                account.getInitialBalance(),
                account.getCurrentBalance(),
                account.getCreditLimit(),
                account.getIsArchived(),
                account.getCreatedAt(),
                account.getUpdatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public void setIsArchived(Boolean isArchived) {
        this.isArchived = isArchived;
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
}
