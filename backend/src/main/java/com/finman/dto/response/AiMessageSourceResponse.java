package com.finman.dto.response;

import com.finman.entity.AiMessageSource;

import java.math.BigDecimal;
import java.time.Instant;

public class AiMessageSourceResponse {

    private Long id;
    private Integer citationIndex;
    private Long articleId;
    private String sourceTitle;
    private String sourceUrl;
    private String sourceName;
    private String snippet;
    private BigDecimal relevanceScore;
    private Instant createdAt;

    public AiMessageSourceResponse() {
    }

    public static AiMessageSourceResponse fromEntity(AiMessageSource entity) {
        if (entity == null) {
            return null;
        }
        AiMessageSourceResponse res = new AiMessageSourceResponse();
        res.setId(entity.getId());
        res.setCitationIndex(entity.getCitationIndex());
        if (entity.getArticle() != null) {
            res.setArticleId(entity.getArticle().getId());
        }
        res.setSourceTitle(entity.getSourceTitle());
        res.setSourceUrl(entity.getSourceUrl());
        res.setSourceName(entity.getSourceName());
        res.setSnippet(entity.getSnippet());
        res.setRelevanceScore(entity.getRelevanceScore());
        res.setCreatedAt(entity.getCreatedAt());
        return res;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getCitationIndex() {
        return citationIndex;
    }

    public void setCitationIndex(Integer citationIndex) {
        this.citationIndex = citationIndex;
    }

    public Long getArticleId() {
        return articleId;
    }

    public void setArticleId(Long articleId) {
        this.articleId = articleId;
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
}

