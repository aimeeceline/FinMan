package com.finman.dto.response;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

public class RecycleBinItemResponse {
    private Long id;
    private String type; // TRANSACTION, CATEGORY, BUDGET, ACCOUNT
    private String title;
    private String subtitle;
    private Long amount;
    private String icon;
    private Instant deletedAt;
    private long daysRemaining;
    private String extraInfo;

    public RecycleBinItemResponse() {
    }

    public RecycleBinItemResponse(Long id, String type, String title, String subtitle, Long amount, String icon, Instant deletedAt, String extraInfo) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.subtitle = subtitle;
        this.amount = amount;
        this.icon = icon;
        this.deletedAt = deletedAt;
        this.extraInfo = extraInfo;

        if (deletedAt != null) {
            long daysPassed = ChronoUnit.DAYS.between(deletedAt, Instant.now());
            this.daysRemaining = Math.max(0, 15 - daysPassed);
        } else {
            this.daysRemaining = 15;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSubtitle() {
        return subtitle;
    }

    public void setSubtitle(String subtitle) {
        this.subtitle = subtitle;
    }

    public Long getAmount() {
        return amount;
    }

    public void setAmount(Long amount) {
        this.amount = amount;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public Instant getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(Instant deletedAt) {
        this.deletedAt = deletedAt;
        if (deletedAt != null) {
            long daysPassed = ChronoUnit.DAYS.between(deletedAt, Instant.now());
            this.daysRemaining = Math.max(0, 15 - daysPassed);
        } else {
            this.daysRemaining = 15;
        }
    }

    public long getDaysRemaining() {
        return daysRemaining;
    }

    public void setDaysRemaining(long daysRemaining) {
        this.daysRemaining = daysRemaining;
    }

    public String getExtraInfo() {
        return extraInfo;
    }

    public void setExtraInfo(String extraInfo) {
        this.extraInfo = extraInfo;
    }
}
