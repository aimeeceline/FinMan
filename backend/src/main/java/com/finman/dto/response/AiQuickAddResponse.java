package com.finman.dto.response;

import com.finman.entity.enums.AccountType;
import com.finman.entity.enums.TransactionType;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class AiQuickAddResponse {

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
    private String rawText;
    private String source;
    private List<AiQuickAddItem> items = new ArrayList<>();

    public AiQuickAddResponse() {
    }

    public AiQuickAddResponse(TransactionType type, Long amount, Long categoryId, String categoryName,
                              String categoryIcon, Long accountId, String accountName,
                              AccountType accountType, LocalDate transactionDate, String note, String rawText) {
        this(type, amount, categoryId, categoryName, categoryIcon, accountId, accountName, accountType, transactionDate, note, rawText, "LOCAL_FALLBACK");
    }

    public AiQuickAddResponse(TransactionType type, Long amount, Long categoryId, String categoryName,
                              String categoryIcon, Long accountId, String accountName,
                              AccountType accountType, LocalDate transactionDate, String note, String rawText, String source) {
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
        this.rawText = rawText;
        this.source = source;
        if (amount != null && amount > 0) {
            this.items.add(new AiQuickAddItem(type, amount, categoryId, categoryName, categoryIcon, accountId, accountName, accountType, transactionDate, note, source));
        }
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

    public String getRawText() {
        return rawText;
    }

    public void setRawText(String rawText) {
        this.rawText = rawText;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public List<AiQuickAddItem> getItems() {
        return items;
    }

    public void setItems(List<AiQuickAddItem> items) {
        this.items = items != null ? items : new ArrayList<>();
        if (!this.items.isEmpty()) {
            AiQuickAddItem first = this.items.get(0);
            this.type = first.getType();
            this.amount = first.getAmount();
            this.categoryId = first.getCategoryId();
            this.categoryName = first.getCategoryName();
            this.categoryIcon = first.getCategoryIcon();
            this.accountId = first.getAccountId();
            this.accountName = first.getAccountName();
            this.accountType = first.getAccountType();
            this.transactionDate = first.getTransactionDate();
            this.note = first.getNote();
            this.source = first.getSource();
        }
    }

    public void addItem(AiQuickAddItem item) {
        if (item != null) {
            if (this.items.isEmpty()) {
                this.type = item.getType();
                this.amount = item.getAmount();
                this.categoryId = item.getCategoryId();
                this.categoryName = item.getCategoryName();
                this.categoryIcon = item.getCategoryIcon();
                this.accountId = item.getAccountId();
                this.accountName = item.getAccountName();
                this.accountType = item.getAccountType();
                this.transactionDate = item.getTransactionDate();
                this.note = item.getNote();
                this.source = item.getSource();
            }
            this.items.add(item);
        }
    }
}
