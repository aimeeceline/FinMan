package com.finman.dto.response;

public class TransactionSummaryResponse {

    private Long totalIncome;
    private Long totalExpense;
    private Long netCashFlow;
    private Long transactionCount;

    public TransactionSummaryResponse() {
    }

    public TransactionSummaryResponse(Long totalIncome, Long totalExpense, Long netCashFlow, Long transactionCount) {
        this.totalIncome = totalIncome != null ? totalIncome : 0L;
        this.totalExpense = totalExpense != null ? totalExpense : 0L;
        this.netCashFlow = netCashFlow != null ? netCashFlow : 0L;
        this.transactionCount = transactionCount != null ? transactionCount : 0L;
    }

    public Long getTotalIncome() {
        return totalIncome;
    }

    public void setTotalIncome(Long totalIncome) {
        this.totalIncome = totalIncome;
    }

    public Long getTotalExpense() {
        return totalExpense;
    }

    public void setTotalExpense(Long totalExpense) {
        this.totalExpense = totalExpense;
    }

    public Long getNetCashFlow() {
        return netCashFlow;
    }

    public void setNetCashFlow(Long netCashFlow) {
        this.netCashFlow = netCashFlow;
    }

    public Long getTransactionCount() {
        return transactionCount;
    }

    public void setTransactionCount(Long transactionCount) {
        this.transactionCount = transactionCount;
    }
}
