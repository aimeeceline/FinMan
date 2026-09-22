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

    public AccountCreateRequest() {
    }

    public AccountCreateRequest(String name, AccountType type, Long initialBalance, Long creditLimit) {
        this.name = name;
        this.type = type;
        this.initialBalance = initialBalance != null ? initialBalance : 0L;
        this.creditLimit = creditLimit != null ? creditLimit : 0L;
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
}
