package com.finman.repository;

import com.finman.entity.AiConversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiConversationRepository extends JpaRepository<AiConversation, Long> {

    List<AiConversation> findByUserIdAndIsArchivedFalseOrderByIsPinnedDescUpdatedAtDesc(Long userId);

    Page<AiConversation> findByUserIdAndIsArchivedFalseOrderByIsPinnedDescUpdatedAtDesc(Long userId, Pageable pageable);

    Optional<AiConversation> findByIdAndUserId(Long id, Long userId);

    boolean existsByIdAndUserId(Long id, Long userId);

    @Modifying
    @Query("DELETE FROM AiConversation c WHERE c.id = :id AND c.user.id = :userId")
    void deleteByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    @Modifying
    @Query("UPDATE AiConversation c SET c.isArchived = true, c.updatedAt = CURRENT_INSTANT WHERE c.id = :id AND c.user.id = :userId")
    void archiveByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);
}
