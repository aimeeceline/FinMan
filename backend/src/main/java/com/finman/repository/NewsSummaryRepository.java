package com.finman.repository;

import com.finman.entity.NewsSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface NewsSummaryRepository extends JpaRepository<NewsSummary, Long> {

    Optional<NewsSummary> findByArticleId(Long articleId);

    boolean existsByArticleId(Long articleId);

    List<NewsSummary> findByArticleIdIn(Collection<Long> articleIds);

    List<NewsSummary> findBySentimentOrderByCreatedAtDesc(String sentiment);

    @Query("SELECT ns FROM NewsSummary ns JOIN FETCH ns.article WHERE ns.relatedTickers IS NOT NULL AND UPPER(ns.relatedTickers) LIKE CONCAT('%', UPPER(:ticker), '%') ORDER BY ns.createdAt DESC")
    List<NewsSummary> findByRelatedTicker(@Param("ticker") String ticker);
}

