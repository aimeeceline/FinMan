package com.finman.dto.response;

import java.util.ArrayList;
import java.util.List;

public class AccountSummaryResponse {

    private Long totalAssets = 0L;
    private Long totalLiabilities = 0L;
    private Long netWorth = 0L;
    private List<AccountResponse> accounts = new ArrayList<>();

    public AccountSummaryResponse() {
    }

    public AccountSummaryResponse(Long totalAssets, Long totalLiabilities, Long netWorth, List<AccountResponse> accounts) {
        this.totalAssets = totalAssets != null ? totalAssets : 0L;
        this.totalLiabilities = totalLiabilities != null ? totalLiabilities : 0L;
        this.netWorth = netWorth != null ? netWorth : 0L;
        this.accounts = accounts != null ? accounts : new ArrayList<>();
    }

    public Long getTotalAssets() {
        return totalAssets;
    }

    public void setTotalAssets(Long totalAssets) {
        this.totalAssets = totalAssets;
    }

    public Long getTotalLiabilities() {
        return totalLiabilities;
    }

    public void setTotalLiabilities(Long totalLiabilities) {
        this.totalLiabilities = totalLiabilities;
    }

    public Long getNetWorth() {
        return netWorth;
    }

    public void setNetWorth(Long netWorth) {
        this.netWorth = netWorth;
    }

    public List<AccountResponse> getAccounts() {
        return accounts;
    }

    public void setAccounts(List<AccountResponse> accounts) {
        this.accounts = accounts;
    }
}
