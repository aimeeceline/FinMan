package com.finman.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.Objects;

@Entity
@Table(
        name = "news_summaries",
        indexes = {
                @Index(name = "idx_news_summaries_article_id", columnList = "article_id", unique = true),
                @Index(name = "idx_news_summaries_sentiment", columnList = "sentiment, created_at"),
                @Index(name = "idx_news_summaries_tickers", columnList = "related_tickers")
        }
)
public class NewsSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Bài viết liên kết không được để trống")
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "article_id", nullable = false, unique = true)
    private NewsArticle article;

    @NotBlank(message = "Nội dung tóm tắt 3 ý không được để trống")
    @Column(name = "bullet_points", nullable = false, columnDefinition = "TEXT")
    private String bulletPoints;

    @NotBlank(message = "Sắc thái bài viết không được để trống")
    @Size(max = 20, message = "Sắc thái tối đa 20 ký tự")
    @Column(name = "sentiment", nullable = false, length = 20)
    private String sentiment;

    @NotBlank(message = "Lý do phân loại sắc thái không được để trống")
    @Column(name = "sentiment_reason", nullable = false, columnDefinition = "TEXT")
    private String sentimentReason;

    @Column(name = "impact_analysis", columnDefinition = "TEXT")
    private String impactAnalysis;

    @Size(max = 255, message = "Danh sách mã cổ phiếu tối đa 255 ký tự")
    @Column(name = "related_tickers", length = 255)
    private String relatedTickers;

    @Size(max = 255, message = "Danh sách nhãn tối đa 255 ký tự")
    @Column(name = "tags", length = 255)
    private String tags;

    @NotBlank(message = "Phiên bản mô hình AI không được để trống")
    @Size(max = 50, message = "Phiên bản mô hình tối đa 50 ký tự")
    @Column(name = "model_version", nullable = false, length = 50)
    private String modelVersion = "gemini-2.5-flash";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public NewsSummary() {
    }

    public NewsSummary(NewsArticle article,
                       String bulletPoints,
                       String sentiment,
                       String sentimentReason,
                       String impactAnalysis,
                       String relatedTickers,
                       String tags,
                       String modelVersion) {
        this.article = article;
        this.bulletPoints = bulletPoints;
        this.sentiment = sentiment;
        this.sentimentReason = sentimentReason;
        this.impactAnalysis = impactAnalysis;
        this.relatedTickers = relatedTickers;
        this.tags = tags;
        this.modelVersion = modelVersion != null && !modelVersion.isBlank() ? modelVersion : "gemini-2.5-flash";
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.modelVersion == null || this.modelVersion.isBlank()) {
            this.modelVersion = "gemini-2.5-flash";
        }
        if (this.sentiment == null || this.sentiment.isBlank()) {
            this.sentiment = "NEUTRAL";
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public NewsArticle getArticle() {
        return article;
    }

    public void setArticle(NewsArticle article) {
        this.article = article;
    }

    public String getBulletPoints() {
        return bulletPoints;
    }

    public void setBulletPoints(String bulletPoints) {
        this.bulletPoints = bulletPoints;
    }

    public String getSentiment() {
        return sentiment;
    }

    public void setSentiment(String sentiment) {
        this.sentiment = sentiment;
    }

    public String getSentimentReason() {
        return sentimentReason;
    }

    public void setSentimentReason(String sentimentReason) {
        this.sentimentReason = sentimentReason;
    }

    public String getImpactAnalysis() {
        return impactAnalysis;
    }

    public void setImpactAnalysis(String impactAnalysis) {
        this.impactAnalysis = impactAnalysis;
    }

    public String getRelatedTickers() {
        return relatedTickers;
    }

    public void setRelatedTickers(String relatedTickers) {
        this.relatedTickers = relatedTickers;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }

    public String getModelVersion() {
        return modelVersion;
    }

    public void setModelVersion(String modelVersion) {
        this.modelVersion = modelVersion;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof NewsSummary that)) return false;
        if (id != null && that.id != null) {
            return Objects.equals(id, that.id);
        }
        return Objects.equals(article != null ? article.getId() : null,
                that.article != null ? that.article.getId() : null);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}

