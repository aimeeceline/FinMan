package com.finman.dto.response;

import com.finman.entity.Budget;
import com.finman.entity.enums.BudgetStatus;

import java.time.Instant;

public class BudgetResponse {

    private Long id;
    private CategoryResponse category;
    private String month;
    private Long amount;
    private Long allocatedAmount;
    private Long spentAmount;
    private Long remainingAmount;
    private Long overspentAmount;
    private Double percentage;
    private BudgetStatus status;
    private Instant createdAt;
    private Instant updatedAt;

    public BudgetResponse() {
    }

    public BudgetResponse(Long id, CategoryResponse category, String month, Long amount,
                          Long allocatedAmount, Long spentAmount, Long remainingAmount,
                          Long overspentAmount, Double percentage, BudgetStatus status,
                          Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.category = category;
        this.month = month;
        this.amount = amount;
        this.allocatedAmount = allocatedAmount;
        this.spentAmount = spentAmount;
        this.remainingAmount = remainingAmount;
        this.overspentAmount = overspentAmount;
        this.percentage = percentage;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static BudgetResponse of(Budget budget, Long spentAmount) {
        if (budget == null) {
            return null;
        }

        long actualSpent = (spentAmount != null) ? spentAmount : 0L;
        long allocated = (budget.getAmount() != null) ? budget.getAmount() : 0L;
        long remaining = Math.max(0L, allocated - actualSpent);
        long overspent = Math.max(0L, actualSpent - allocated);

        double rawPercentage = (allocated > 0) ? ((double) actualSpent / allocated) * 100.0 : 0.0;
        double roundedPercentage = Math.round(rawPercentage * 10.0) / 10.0;

        BudgetStatus status;
        if (rawPercentage > 100.0) {
            status = BudgetStatus.OVERBUDGET;
        } else if (rawPercentage >= 80.0) {
            status = BudgetStatus.WARNING;
        } else {
            status = BudgetStatus.NORMAL;
        }

        return new BudgetResponse(
                budget.getId(),
                CategoryResponse.from(budget.getCategory()),
                budget.getMonth(),
                allocated,
                allocated,
                actualSpent,
                remaining,
                overspent,
                roundedPercentage,
                status,
                budget.getCreatedAt(),
                budget.getUpdatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public CategoryResponse getCategory() {
        return category;
    }

    public void setCategory(CategoryResponse category) {
        this.category = category;
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

    public Long getAllocatedAmount() {
        return allocatedAmount;
    }

    public void setAllocatedAmount(Long allocatedAmount) {
        this.allocatedAmount = allocatedAmount;
    }

    public Long getSpentAmount() {
        return spentAmount;
    }

    public void setSpentAmount(Long spentAmount) {
        this.spentAmount = spentAmount;
    }

    public Long getRemainingAmount() {
        return remainingAmount;
    }

    public void setRemainingAmount(Long remainingAmount) {
        this.remainingAmount = remainingAmount;
    }

    public Long getOverspentAmount() {
        return overspentAmount;
    }

    public void setOverspentAmount(Long overspentAmount) {
        this.overspentAmount = overspentAmount;
    }

    public Double getPercentage() {
        return percentage;
    }

    public void setPercentage(Double percentage) {
        this.percentage = percentage;
    }

    public BudgetStatus getStatus() {
        return status;
    }

    public void setStatus(BudgetStatus status) {
        this.status = status;
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
}
