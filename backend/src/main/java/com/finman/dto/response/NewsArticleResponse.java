package com.finman.dto.response;

import com.finman.entity.NewsArticle;
import com.finman.entity.NewsCategory;
import com.finman.entity.NewsSource;
import com.finman.entity.NewsSummary;

import java.time.Instant;

public class NewsArticleResponse {

    private Long id;
    private String title;
    private String description;
    private String contentSnippet;
    private String originalUrl;
    private String thumbnailUrl;
    private String author;
    private Instant publishedAt;
    private Instant fetchedAt;
    private Long sourceId;
    private String sourceCode;
    private String sourceName;
    private Long categoryId;
    private String categoryCode;
    private String categoryName;
    private Boolean isAiProcessed;
    private Boolean isSaved;
    private String bulletPoints;
    private String sentiment;
    private String sentimentReason;
    private String impactAnalysis;
    private String relatedTickers;
    private String tags;

    public NewsArticleResponse() {
    }

    public static NewsArticleResponse fromEntity(NewsArticle article, boolean isSaved) {
        return fromEntity(article, isSaved, null);
    }

    public static NewsArticleResponse fromEntity(NewsArticle article, boolean isSaved, NewsSummary summary) {
        NewsArticleResponse dto = new NewsArticleResponse();
        dto.setId(article.getId());
        dto.setTitle(article.getTitle());
        dto.setDescription(article.getDescription());
        dto.setContentSnippet(article.getContentSnippet());
        dto.setOriginalUrl(article.getOriginalUrl());
        dto.setThumbnailUrl(article.getThumbnailUrl());
        dto.setAuthor(article.getAuthor());
        dto.setPublishedAt(article.getPublishedAt());
        dto.setFetchedAt(article.getFetchedAt());
        dto.setIsAiProcessed(Boolean.TRUE.equals(article.getIsAiProcessed()));
        dto.setIsSaved(isSaved);

        NewsSource source = article.getSource();
        if (source != null) {
            dto.setSourceId(source.getId());
            dto.setSourceCode(source.getCode());
            dto.setSourceName(source.getName());
        }

        NewsCategory category = article.getCategory();
        if (category != null) {
            dto.setCategoryId(category.getId());
            dto.setCategoryCode(category.getCode());
            dto.setCategoryName(category.getNameVi());
        }

        if (summary != null) {
            dto.setBulletPoints(summary.getBulletPoints());
            dto.setSentiment(summary.getSentiment());
            dto.setSentimentReason(summary.getSentimentReason());
            dto.setImpactAnalysis(summary.getImpactAnalysis());
            dto.setRelatedTickers(summary.getRelatedTickers());
            dto.setTags(summary.getTags());
        }

        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getContentSnippet() {
        return contentSnippet;
    }

    public void setContentSnippet(String contentSnippet) {
        this.contentSnippet = contentSnippet;
    }

    public String getOriginalUrl() {
        return originalUrl;
    }

    public void setOriginalUrl(String originalUrl) {
        this.originalUrl = originalUrl;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(Instant publishedAt) {
        this.publishedAt = publishedAt;
    }

    public Instant getFetchedAt() {
        return fetchedAt;
    }

    public void setFetchedAt(Instant fetchedAt) {
        this.fetchedAt = fetchedAt;
    }

    public Long getSourceId() {
        return sourceId;
    }

    public void setSourceId(Long sourceId) {
        this.sourceId = sourceId;
    }

    public String getSourceCode() {
        return sourceCode;
    }

    public void setSourceCode(String sourceCode) {
        this.sourceCode = sourceCode;
    }

    public String getSourceName() {
        return sourceName;
    }

    public void setSourceName(String sourceName) {
        this.sourceName = sourceName;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryCode() {
        return categoryCode;
    }

    public void setCategoryCode(String categoryCode) {
        this.categoryCode = categoryCode;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public Boolean getIsAiProcessed() {
        return isAiProcessed;
    }

    public void setIsAiProcessed(Boolean isAiProcessed) {
        this.isAiProcessed = isAiProcessed;
    }

    public Boolean getIsSaved() {
        return isSaved;
    }

    public void setIsSaved(Boolean isSaved) {
        this.isSaved = isSaved;
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
}

