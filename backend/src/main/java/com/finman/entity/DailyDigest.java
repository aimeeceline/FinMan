package com.finman.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;

@Entity
@Table(
        name = "daily_digests",
        indexes = {
                @Index(name = "idx_daily_digests_date", columnList = "digest_date", unique = true)
        }
)
public class DailyDigest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Ngày bản tin không được để trống")
    @Column(name = "digest_date", nullable = false, unique = true)
    private LocalDate digestDate;

    @Column(name = "ai_macro_summary", columnDefinition = "TEXT", nullable = false)
    private String aiMacroSummary;

    @Column(name = "market_pulse_json", columnDefinition = "TEXT", nullable = false)
    private String marketPulseJson;

    @Column(name = "top_headlines_json", columnDefinition = "TEXT", nullable = false)
    private String topHeadlinesJson;

    @Column(name = "key_takeaways_json", columnDefinition = "TEXT")
    private String keyTakeawaysJson;

    @Column(name = "suggested_prompts_json", columnDefinition = "TEXT")
    private String suggestedPromptsJson;

    @Column(name = "status", length = 20, nullable = false)
    private String status = "READY";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public DailyDigest() {
    }

    public DailyDigest(LocalDate digestDate, String aiMacroSummary, String marketPulseJson, String topHeadlinesJson) {
        this.digestDate = digestDate;
        this.aiMacroSummary = aiMacroSummary;
        this.marketPulseJson = marketPulseJson;
        this.topHeadlinesJson = topHeadlinesJson;
        this.status = "READY";
    }

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (status == null) {
            status = "READY";
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getDigestDate() {
        return digestDate;
    }

    public void setDigestDate(LocalDate digestDate) {
        this.digestDate = digestDate;
    }

    public String getAiMacroSummary() {
        return aiMacroSummary;
    }

    public void setAiMacroSummary(String aiMacroSummary) {
        this.aiMacroSummary = aiMacroSummary;
    }

    public String getMarketPulseJson() {
        return marketPulseJson;
    }

    public void setMarketPulseJson(String marketPulseJson) {
        this.marketPulseJson = marketPulseJson;
    }

    public String getTopHeadlinesJson() {
        return topHeadlinesJson;
    }

    public void setTopHeadlinesJson(String topHeadlinesJson) {
        this.topHeadlinesJson = topHeadlinesJson;
    }

    public String getKeyTakeawaysJson() {
        return keyTakeawaysJson;
    }

    public void setKeyTakeawaysJson(String keyTakeawaysJson) {
        this.keyTakeawaysJson = keyTakeawaysJson;
    }

    public String getSuggestedPromptsJson() {
        return suggestedPromptsJson;
    }

    public void setSuggestedPromptsJson(String suggestedPromptsJson) {
        this.suggestedPromptsJson = suggestedPromptsJson;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof DailyDigest that)) return false;
        return Objects.equals(id, that.id) && Objects.equals(digestDate, that.digestDate);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, digestDate);
    }

    @Override
    public String toString() {
        return "DailyDigest{" +
                "id=" + id +
                ", digestDate=" + digestDate +
                ", status='" + status + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}
