package com.finman.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class HeadlineItemDto {

    private Long id;
    private String title;
    private String sourceName;
    private String categoryName;
    private Instant publishedAt;
    private List<String> summaryBullets = new ArrayList<>();
    private String sentiment;
    private String originalUrl;
    private List<String> relatedTickers = new ArrayList<>();

    public HeadlineItemDto() {
    }

    public HeadlineItemDto(Long id, String title, String sourceName, String categoryName,
                           Instant publishedAt, List<String> summaryBullets, String sentiment,
                           String originalUrl, List<String> relatedTickers) {
        this.id = id;
        this.title = title;
        this.sourceName = sourceName;
        this.categoryName = categoryName;
        this.publishedAt = publishedAt;
        if (summaryBullets != null) {
            this.summaryBullets = summaryBullets;
        }
        this.sentiment = sentiment;
        this.originalUrl = originalUrl;
        if (relatedTickers != null) {
            this.relatedTickers = relatedTickers;
        }
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

    public String getSourceName() {
        return sourceName;
    }

    public void setSourceName(String sourceName) {
        this.sourceName = sourceName;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(Instant publishedAt) {
        this.publishedAt = publishedAt;
    }

    public List<String> getSummaryBullets() {
        return summaryBullets;
    }

    public void setSummaryBullets(List<String> summaryBullets) {
        this.summaryBullets = summaryBullets;
    }

    public String getSentiment() {
        return sentiment;
    }

    public void setSentiment(String sentiment) {
        this.sentiment = sentiment;
    }

    public String getOriginalUrl() {
        return originalUrl;
    }

    public void setOriginalUrl(String originalUrl) {
        this.originalUrl = originalUrl;
    }

    public List<String> getRelatedTickers() {
        return relatedTickers;
    }

    public void setRelatedTickers(List<String> relatedTickers) {
        this.relatedTickers = relatedTickers;
    }
}
