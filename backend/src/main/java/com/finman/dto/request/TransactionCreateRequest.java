package com.finman.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.finman.entity.enums.TransactionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

@JsonIgnoreProperties(ignoreUnknown = true)
public class TransactionCreateRequest {

    @NotNull(message = "Tài khoản không được để trống")
    private Long accountId;

    @NotNull(message = "Danh mục không được để trống")
    private Long categoryId;

    @NotNull(message = "Loại giao dịch không được để trống")
    private TransactionType type;

    @NotNull(message = "Số tiền không được để trống")
    @Positive(message = "Số tiền giao dịch phải lớn hơn 0")
    private Long amount;

    @NotNull(message = "Ngày giao dịch không được để trống")
    private LocalDate transactionDate;

    @Size(max = 255, message = "Ghi chú không được vượt quá 255 ký tự")
    private String note;

    public TransactionCreateRequest() {
    }

    public TransactionCreateRequest(Long accountId, Long categoryId, TransactionType type, Long amount, LocalDate transactionDate, String note) {
        this.accountId = accountId;
        this.categoryId = categoryId;
        this.type = type;
        this.amount = amount;
        this.transactionDate = transactionDate;
        this.note = note;
    }

    public Long getAccountId() {
        return accountId;
    }

    public void setAccountId(Long accountId) {
        this.accountId = accountId;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
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
}
