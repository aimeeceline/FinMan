package com.finman.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.finman.entity.enums.AccountType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@JsonIgnoreProperties(ignoreUnknown = true)
public class AccountCreateRequest {

    @NotBlank(message = "Tên tài khoản không được để trống")
    @Size(max = 50, message = "Tên tài khoản tối đa 50 ký tự")
    private String name;

    @NotNull(message = "Loại tài khoản không được để trống")
    private AccountType type;

    @NotNull(message = "Số dư ban đầu không được để trống")
    private Long initialBalance = 0L;

    @Min(value = 0, message = "Hạn mức tín dụng không được âm")
    private Long creditLimit = 0L;

    @Size(max = 50, message = "Số tài khoản tối đa 50 ký tự")
    private String accountNumber;

    @Size(max = 255, message = "Ghi chú tài khoản tối đa 255 ký tự")
    private String note;

    private Integer statementDay;

    private Integer paymentDueDay;

    private Long paymentAccountId;

    private Boolean isAutoPayment;

    public AccountCreateRequest() {
    }

    public AccountCreateRequest(String name, AccountType type, Long initialBalance, Long creditLimit) {
        this.name = name;
        this.type = type;
        this.initialBalance = initialBalance != null ? initialBalance : 0L;
        this.creditLimit = creditLimit != null ? creditLimit : 0L;
    }

    public AccountCreateRequest(String name, AccountType type, Long initialBalance, Long creditLimit, String accountNumber) {
        this.name = name;
        this.type = type;
        this.initialBalance = initialBalance != null ? initialBalance : 0L;
        this.creditLimit = creditLimit != null ? creditLimit : 0L;
        this.accountNumber = accountNumber;
    }

    public AccountCreateRequest(String name, AccountType type, Long initialBalance, Long creditLimit, String accountNumber, String note) {
        this(name, type, initialBalance, creditLimit, accountNumber);
        this.note = note;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
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

    public Long getCreditLimit() {
        return creditLimit;
    }

    public void setCreditLimit(Long creditLimit) {
        this.creditLimit = creditLimit;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public Integer getStatementDay() {
        return statementDay;
    }

    public void setStatementDay(Integer statementDay) {
        this.statementDay = statementDay;
    }

    public Integer getPaymentDueDay() {
        return paymentDueDay;
    }

    public void setPaymentDueDay(Integer paymentDueDay) {
        this.paymentDueDay = paymentDueDay;
    }

    public Long getPaymentAccountId() {
        return paymentAccountId;
    }

    public void setPaymentAccountId(Long paymentAccountId) {
        this.paymentAccountId = paymentAccountId;
    }

    public Boolean getIsAutoPayment() {
        return isAutoPayment;
    }

    public void setIsAutoPayment(Boolean autoPayment) {
        isAutoPayment = autoPayment;
    }
}
