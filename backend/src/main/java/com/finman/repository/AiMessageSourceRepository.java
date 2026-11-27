package com.finman.repository;

import com.finman.entity.AiMessageSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiMessageSourceRepository extends JpaRepository<AiMessageSource, Long> {

    List<AiMessageSource> findByMessageIdOrderByCitationIndexAsc(Long messageId);

    List<AiMessageSource> findByMessageIdInOrderByCitationIndexAsc(List<Long> messageIds);

    List<AiMessageSource> findByArticleId(Long articleId);
}

