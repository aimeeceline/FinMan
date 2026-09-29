package com.finman.dto.response;

import java.time.LocalDate;

public class DailyCashflowResponse {

    private LocalDate date;
    private Long income;
    private Long expense;
    private Long netCashFlow;

    public DailyCashflowResponse() {
    }

    public DailyCashflowResponse(LocalDate date, Long income, Long expense) {
        this.date = date;
        this.income = income != null ? income : 0L;
        this.expense = expense != null ? expense : 0L;
        this.netCashFlow = this.income - this.expense;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public Long getIncome() {
        return income;
    }

    public void setIncome(Long income) {
        this.income = income;
        this.netCashFlow = (this.income != null ? this.income : 0L) - (this.expense != null ? this.expense : 0L);
    }

    public Long getExpense() {
        return expense;
    }

    public void setExpense(Long expense) {
        this.expense = expense;
        this.netCashFlow = (this.income != null ? this.income : 0L) - (this.expense != null ? this.expense : 0L);
    }

    public Long getNetCashFlow() {
        return netCashFlow;
    }

    public void setNetCashFlow(Long netCashFlow) {
        this.netCashFlow = netCashFlow;
    }
}
