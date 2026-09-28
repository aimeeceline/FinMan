package com.finman.dto.response;

import com.finman.entity.enums.AccountType;
import com.finman.entity.enums.TransactionType;

import java.time.LocalDate;

/**
 * Đại diện cho một giao dịch riêng lẻ trong kịch bản nhận diện nhiều giao dịch từ 1 câu nói.
 */
public class AiQuickAddItem {

    private TransactionType type;
    private Long amount;
    private Long categoryId;
    private String categoryName;
    private String categoryIcon;
    private Long accountId;
    private String accountName;
    private AccountType accountType;
    private LocalDate transactionDate;
    private String note;
    private String source;

    public AiQuickAddItem() {
    }

    public AiQuickAddItem(TransactionType type, Long amount, Long categoryId, String categoryName,
                          String categoryIcon, Long accountId, String accountName,
                          AccountType accountType, LocalDate transactionDate, String note, String source) {
        this.type = type;
        this.amount = amount;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.categoryIcon = categoryIcon;
        this.accountId = accountId;
        this.accountName = accountName;
        this.accountType = accountType;
        this.transactionDate = transactionDate;
        this.note = note;
        this.source = source;
    }

    public TransactionType getType() {
        return type;
    }

    public void setType(TransactionType type) {
        this.type = type;
    }

    public Long getAmount() {
        return amount;
    }

    public void setAmount(Long amount) {
        this.amount = amount;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public String getCategoryIcon() {
        return categoryIcon;
    }

    public void setCategoryIcon(String categoryIcon) {
        this.categoryIcon = categoryIcon;
    }

    public Long getAccountId() {
        return accountId;
    }

    public void setAccountId(Long accountId) {
        this.accountId = accountId;
    }

    public String getAccountName() {
        return accountName;
    }

    public void setAccountName(String accountName) {
        this.accountName = accountName;
    }

    public AccountType getAccountType() {
        return accountType;
    }

    public void setAccountType(AccountType accountType) {
        this.accountType = accountType;
    }

    public LocalDate getTransactionDate() {
        return transactionDate;
    }

    public void setTransactionDate(LocalDate transactionDate) {
        this.transactionDate = transactionDate;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }
}
