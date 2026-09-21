package com.finman.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AccountUpdateRequest {

    @NotBlank(message = "Tên tài khoản không được để trống")
    @Size(max = 50, message = "Tên tài khoản tối đa 50 ký tự")
    private String name;

    @Min(value = 0, message = "Hạn mức tín dụng không được âm")
    private Long creditLimit;

    private Boolean isArchived;

    public AccountUpdateRequest() {
    }

    public AccountUpdateRequest(String name, Long creditLimit, Boolean isArchived) {
        this.name = name;
        this.creditLimit = creditLimit;
        this.isArchived = isArchived;
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
