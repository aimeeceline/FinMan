package com.finman.dto.response;

import com.finman.entity.Account;
import com.finman.entity.Category;
import com.finman.entity.Transaction;
import com.finman.entity.enums.AccountType;
import com.finman.entity.enums.TransactionType;

import java.time.Instant;
import java.time.LocalDate;

public class TransactionResponse {

    private Long id;
    private Long amount;
    private TransactionType type;
    private LocalDate transactionDate;
    private String note;
    private AccountInfo account;
    private CategoryInfo category;
    private Instant createdAt;
    private Instant updatedAt;

    public TransactionResponse() {
    }

    public TransactionResponse(Long id, Long amount, TransactionType type, LocalDate transactionDate, String note, AccountInfo account, CategoryInfo category, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.amount = amount;
        this.type = type;
        this.transactionDate = transactionDate;
        this.note = note;
        this.account = account;
        this.category = category;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static TransactionResponse from(Transaction transaction) {
        if (transaction == null) {
            return null;
        }

        AccountInfo accInfo = null;
        if (transaction.getAccount() != null) {
            Account acc = transaction.getAccount();
            accInfo = new AccountInfo(acc.getId(), acc.getName(), acc.getType(), acc.getAccountNumber());
        }

        CategoryInfo catInfo = null;
        if (transaction.getCategory() != null) {
            Category cat = transaction.getCategory();
            catInfo = new CategoryInfo(cat.getId(), cat.getName(), cat.getType(), cat.getIcon(), null);
        }

        return new TransactionResponse(
                transaction.getId(),
                transaction.getAmount(),
                transaction.getType(),
                transaction.getTransactionDate(),
                transaction.getNote(),
                accInfo,
                catInfo,
                transaction.getCreatedAt(),
                transaction.getUpdatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getAmount() {
        return amount;
    }

    public void setAmount(Long amount) {
        this.amount = amount;
    }

    public TransactionType getType() {
        return type;
    }

    public void setType(TransactionType type) {
        this.type = type;
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

    public AccountInfo getAccount() {
        return account;
    }

    public void setAccount(AccountInfo account) {
        this.account = account;
    }

    public CategoryInfo getCategory() {
        return category;
    }

    public void setCategory(CategoryInfo category) {
        this.category = category;
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

    public static class AccountInfo {
        private Long id;
        private String name;
        private AccountType type;
        private String accountNumber;

        public AccountInfo() {
        }

        public AccountInfo(Long id, String name, AccountType type, String accountNumber) {
            this.id = id;
            this.name = name;
            this.type = type;
            this.accountNumber = accountNumber;
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

        public String getAccountNumber() {
            return accountNumber;
        }

        public void setAccountNumber(String accountNumber) {
            this.accountNumber = accountNumber;
        }
    }

    public static class CategoryInfo {
        private Long id;
        private String name;
        private com.finman.entity.enums.CategoryType type;
        private String icon;
        private String color;

        public CategoryInfo() {
        }

        public CategoryInfo(Long id, String name, com.finman.entity.enums.CategoryType type, String icon, String color) {
            this.id = id;
            this.name = name;
            this.type = type;
            this.icon = icon;
            this.color = color;
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

        public com.finman.entity.enums.CategoryType getType() {
            return type;
        }

        public void setType(com.finman.entity.enums.CategoryType type) {
            this.type = type;
        }

        public String getIcon() {
            return icon;
        }

        public void setIcon(String icon) {
            this.icon = icon;
        }

        public String getColor() {
            return color;
        }

        public void setColor(String color) {
            this.color = color;
        }
    }
}
