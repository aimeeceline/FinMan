package com.finman.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@JsonIgnoreProperties(ignoreUnknown = true)
public class AccountUpdateRequest {

    @NotBlank(message = "Tên tài khoản không được để trống")
    @Size(max = 50, message = "Tên tài khoản tối đa 50 ký tự")
    private String name;

    @Min(value = 0, message = "Hạn mức tín dụng không được âm")
    private Long creditLimit;

    private Boolean isArchived;

    @Size(max = 50, message = "Số tài khoản tối đa 50 ký tự")
    private String accountNumber;

    public AccountUpdateRequest() {
    }

    public AccountUpdateRequest(String name, Long creditLimit, Boolean isArchived) {
        this.name = name;
        this.creditLimit = creditLimit;
        this.isArchived = isArchived;
    }

    public AccountUpdateRequest(String name, Long creditLimit, Boolean isArchived, String accountNumber) {
        this.name = name;
        this.creditLimit = creditLimit;
        this.isArchived = isArchived;
        this.accountNumber = accountNumber;
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
}
