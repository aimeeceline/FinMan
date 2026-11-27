package com.finman.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(
        name = "ai_message_sources",
        indexes = {
                @Index(name = "idx_ai_message_sources_message", columnList = "message_id, citation_index"),
                @Index(name = "idx_ai_message_sources_article", columnList = "article_id")
        }
)
public class AiMessageSource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Tin nhắn không được để trống")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "message_id", nullable = false)
    private AiMessage message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "article_id")
    private NewsArticle article;

    @Column(name = "citation_index", nullable = false)
    private Integer citationIndex = 1;

    @NotBlank(message = "Tiêu đề nguồn không được để trống")
    @Size(max = 500, message = "Tiêu đề nguồn tối đa 500 ký tự")
    @Column(name = "source_title", nullable = false, length = 500)
    private String sourceTitle;

    @Size(max = 1000, message = "URL nguồn tối đa 1000 ký tự")
    @Column(name = "source_url", length = 1000)
    private String sourceUrl;

    @Size(max = 100, message = "Tên nguồn tin tối đa 100 ký tự")
    @Column(name = "source_name", length = 100)
    private String sourceName;

    @Column(name = "snippet", columnDefinition = "TEXT")
    private String snippet;

    @Column(name = "relevance_score", precision = 5, scale = 4)
    private BigDecimal relevanceScore;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public AiMessageSource() {
    }

    public AiMessageSource(AiMessage message, Integer citationIndex, String sourceTitle, String sourceUrl, String sourceName) {
        this.message = message;
        this.citationIndex = citationIndex != null ? citationIndex : 1;
        this.sourceTitle = sourceTitle;
        this.sourceUrl = sourceUrl;
        this.sourceName = sourceName;
    }

    public AiMessageSource(AiMessage message, NewsArticle article, Integer citationIndex, String snippet) {
        this.message = message;
        this.article = article;
        this.citationIndex = citationIndex != null ? citationIndex : 1;
        this.snippet = snippet;
        if (article != null) {
            this.sourceTitle = article.getTitle();
            this.sourceUrl = article.getOriginalUrl();
            this.sourceName = article.getSource() != null ? article.getSource().getName() : "Báo chí";
        }
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.citationIndex == null) {
            this.citationIndex = 1;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public AiMessage getMessage() {
        return message;
    }

    public void setMessage(AiMessage message) {
        this.message = message;
    }

    public NewsArticle getArticle() {
        return article;
    }

    public void setArticle(NewsArticle article) {
        this.article = article;
    }

    public Integer getCitationIndex() {
        return citationIndex;
    }

    public void setCitationIndex(Integer citationIndex) {
        this.citationIndex = citationIndex;
    }

    public String getSourceTitle() {
        return sourceTitle;
    }

    public void setSourceTitle(String sourceTitle) {
        this.sourceTitle = sourceTitle;
    }

    public String getSourceUrl() {
        return sourceUrl;
    }

    public void setSourceUrl(String sourceUrl) {
        this.sourceUrl = sourceUrl;
    }

    public String getSourceName() {
        return sourceName;
    }

    public void setSourceName(String sourceName) {
        this.sourceName = sourceName;
    }

    public String getSnippet() {
        return snippet;
    }

    public void setSnippet(String snippet) {
        this.snippet = snippet;
    }

    public BigDecimal getRelevanceScore() {
        return relevanceScore;
    }

    public void setRelevanceScore(BigDecimal relevanceScore) {
        this.relevanceScore = relevanceScore;
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
        if (o == null || getClass() != o.getClass()) return false;
        AiMessageSource that = (AiMessageSource) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "AiMessageSource{" +
                "id=" + id +
                ", citationIndex=" + citationIndex +
                ", sourceTitle='" + sourceTitle + '\'' +
                ", sourceName='" + sourceName + '\'' +
                ", relevanceScore=" + relevanceScore +
                ", createdAt=" + createdAt +
                '}';
    }
}

