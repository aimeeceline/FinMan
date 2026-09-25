package com.finman.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

public class BudgetRequest {

    @NotNull(message = "Danh mục không được để trống")
    private Long categoryId;

    @NotBlank(message = "Tháng ngân sách không được để trống")
    @Pattern(regexp = "^\\d{4}-(0[1-9]|1[0-2])$", message = "Tháng phải có định dạng YYYY-MM")
    private String month;

    @NotNull(message = "Hạn mức ngân sách không được để trống")
    @Positive(message = "Hạn mức ngân sách phải lớn hơn 0")
    private Long amount;

    public BudgetRequest() {
    }

    public BudgetRequest(Long categoryId, String month, Long amount) {
        this.categoryId = categoryId;
        this.month = month;
        this.amount = amount;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }

    public Long getAmount() {
        return amount;
    }

    public void setAmount(Long amount) {
        this.amount = amount;
    }
}
