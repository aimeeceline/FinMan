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

import java.time.Instant;
import java.util.Objects;

@Entity
@Table(
        name = "news_articles",
        indexes = {
                @Index(name = "idx_news_articles_published", columnList = "published_at"),
                @Index(name = "idx_news_articles_category", columnList = "category_id, published_at"),
                @Index(name = "idx_news_articles_source", columnList = "source_id, published_at"),
                @Index(name = "idx_news_articles_hash", columnList = "title_hash", unique = true)
        }
)
public class NewsArticle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Nguồn tin tức không được để trống")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "source_id", nullable = false)
    private NewsSource source;

    @NotNull(message = "Danh mục tin tức không được để trống")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private NewsCategory category;

    @NotBlank(message = "Tiêu đề bài viết không được để trống")
    @Size(max = 500, message = "Tiêu đề bài viết tối đa 500 ký tự")
    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @NotBlank(message = "Mã băm tiêu đề không được để trống")
    @Size(max = 64, message = "Mã băm tối đa 64 ký tự")
    @Column(name = "title_hash", nullable = false, unique = true, length = 64)
    private String titleHash;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "content_snippet", columnDefinition = "TEXT")
    private String contentSnippet;

    @NotBlank(message = "Đường dẫn gốc không được để trống")
    @Size(max = 1000, message = "Đường dẫn bài viết tối đa 1000 ký tự")
    @Column(name = "original_url", nullable = false, length = 1000)
    private String originalUrl;

    @Size(max = 1000, message = "Đường dẫn ảnh thu nhỏ tối đa 1000 ký tự")
    @Column(name = "thumbnail_url", length = 1000)
    private String thumbnailUrl;

    @Size(max = 100, message = "Tác giả tối đa 100 ký tự")
    @Column(name = "author", length = 100)
    private String author;

    @NotNull(message = "Thời gian xuất bản không được để trống")
    @Column(name = "published_at", nullable = false)
    private Instant publishedAt;

    @Column(name = "fetched_at", nullable = false, updatable = false)
    private Instant fetchedAt;

    @NotNull
    @Column(name = "is_ai_processed", nullable = false)
    private Boolean isAiProcessed = false;

    public NewsArticle() {
    }

    public NewsArticle(NewsSource source, NewsCategory category, String title, String titleHash,
                       String description, String contentSnippet, String originalUrl,
                       String thumbnailUrl, String author, Instant publishedAt) {
        this.source = source;
        this.category = category;
        this.title = title;
        this.titleHash = titleHash;
        this.description = description;
        this.contentSnippet = contentSnippet;
        this.originalUrl = originalUrl;
        this.thumbnailUrl = thumbnailUrl;
        this.author = author;
        this.publishedAt = publishedAt != null ? publishedAt : Instant.now();
        this.isAiProcessed = false;
    }

    @PrePersist
    protected void onCreate() {
        if (this.fetchedAt == null) {
            this.fetchedAt = Instant.now();
        }
        if (this.publishedAt == null) {
            this.publishedAt = this.fetchedAt;
        }
        if (this.isAiProcessed == null) {
            this.isAiProcessed = false;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public NewsSource getSource() {
        return source;
    }

    public void setSource(NewsSource source) {
        this.source = source;
    }

    public NewsCategory getCategory() {
        return category;
    }

    public void setCategory(NewsCategory category) {
        this.category = category;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getTitleHash() {
        return titleHash;
    }

    public void setTitleHash(String titleHash) {
        this.titleHash = titleHash;
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

    public Boolean getIsAiProcessed() {
        return isAiProcessed;
    }

    public void setIsAiProcessed(Boolean aiProcessed) {
        isAiProcessed = aiProcessed;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof NewsArticle that)) return false;
        return Objects.equals(id, that.id) || (titleHash != null && Objects.equals(titleHash, that.titleHash));
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(titleHash != null ? titleHash : id);
    }

    @Override
    public String toString() {
        return "NewsArticle{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", publishedAt=" + publishedAt +
                ", isAiProcessed=" + isAiProcessed +
                '}';
    }
}

