package com.finman.repository;

import com.finman.entity.AiMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiMessageRepository extends JpaRepository<AiMessage, Long> {

    List<AiMessage> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    List<AiMessage> findByConversationIdAndConversationUserIdOrderByCreatedAtAsc(Long conversationId, Long userId);

    Optional<AiMessage> findByIdAndConversationUserId(Long id, Long userId);

    long countByConversationId(Long conversationId);
}

