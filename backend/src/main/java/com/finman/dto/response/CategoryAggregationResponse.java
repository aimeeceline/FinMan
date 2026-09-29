package com.finman.dto.response;

import com.finman.entity.enums.TransactionType;

public class CategoryAggregationResponse {

    private Long categoryId;
    private String categoryName;
    private String categoryIcon;
    private TransactionType type;
    private Long totalAmount;
    private Long transactionCount;
    private Double percentage;

    public CategoryAggregationResponse() {
    }

    public CategoryAggregationResponse(Long categoryId, String categoryName, String categoryIcon,
                                       TransactionType type, Long totalAmount, Long transactionCount) {
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.categoryIcon = categoryIcon;
        this.type = type;
        this.totalAmount = totalAmount != null ? totalAmount : 0L;
        this.transactionCount = transactionCount != null ? transactionCount : 0L;
        this.percentage = 0.0;
    }

    public CategoryAggregationResponse(Long categoryId, String categoryName, String categoryIcon,
                                       TransactionType type, Long totalAmount, Long transactionCount, Double percentage) {
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.categoryIcon = categoryIcon;
        this.type = type;
        this.totalAmount = totalAmount != null ? totalAmount : 0L;
        this.transactionCount = transactionCount != null ? transactionCount : 0L;
        this.percentage = percentage != null ? percentage : 0.0;
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

    public TransactionType getType() {
        return type;
    }

    public void setType(TransactionType type) {
        this.type = type;
    }

    public Long getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(Long totalAmount) {
        this.totalAmount = totalAmount;
    }

    public Long getTransactionCount() {
        return transactionCount;
    }

    public void setTransactionCount(Long transactionCount) {
        this.transactionCount = transactionCount;
    }

    public Double getPercentage() {
        return percentage;
    }

    public void setPercentage(Double percentage) {
        this.percentage = percentage;
    }
}
