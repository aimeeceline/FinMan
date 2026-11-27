package com.finman.repository;

import com.finman.entity.NewsArticle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface NewsArticleRepository extends JpaRepository<NewsArticle, Long>, JpaSpecificationExecutor<NewsArticle> {

    boolean existsByTitleHash(String titleHash);

    boolean existsByOriginalUrl(String originalUrl);

    Optional<NewsArticle> findByTitleHash(String titleHash);

    Optional<NewsArticle> findByOriginalUrl(String originalUrl);

    Page<NewsArticle> findByCategoryId(Long categoryId, Pageable pageable);

    Page<NewsArticle> findBySourceId(Long sourceId, Pageable pageable);

    List<NewsArticle> findTop5ByOrderByPublishedAtDesc();

    List<NewsArticle> findByIsAiProcessedFalseOrderByPublishedAtDesc(Pageable pageable);

    @Query("SELECT n FROM NewsArticle n WHERE n.publishedAt >= :since ORDER BY n.publishedAt DESC")
    List<NewsArticle> findRecentArticles(@Param("since") Instant since, Pageable pageable);
}

