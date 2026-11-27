package com.finman.repository;

import com.finman.entity.UserSavedArticle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserSavedArticleRepository extends JpaRepository<UserSavedArticle, Long> {

    Optional<UserSavedArticle> findByUserIdAndArticleId(Long userId, Long articleId);

    boolean existsByUserIdAndArticleId(Long userId, Long articleId);

    Page<UserSavedArticle> findByUserIdOrderBySavedAtDesc(Long userId, Pageable pageable);

    @Modifying
    @Query("DELETE FROM UserSavedArticle u WHERE u.user.id = :userId AND u.article.id = :articleId")
    void deleteByUserIdAndArticleId(@Param("userId") Long userId, @Param("articleId") Long articleId);
}

