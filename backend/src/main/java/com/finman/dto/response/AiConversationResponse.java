package com.finman.dto.response;

import com.finman.entity.AiConversation;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class AiConversationResponse {

    private Long id;
    private Long userId;
    private String title;
    private String modelVersion;
    private Boolean isPinned;
    private Boolean isArchived;
    private String contextMetadata;
    private Instant createdAt;
    private Instant updatedAt;
    private List<AiMessageResponse> messages = new ArrayList<>();

    public AiConversationResponse() {
    }

    public static AiConversationResponse fromEntity(AiConversation entity) {
        return fromEntity(entity, false);
    }

    public static AiConversationResponse fromEntity(AiConversation entity, boolean includeMessages) {
        if (entity == null) {
            return null;
        }
        AiConversationResponse res = new AiConversationResponse();
        res.setId(entity.getId());
        if (entity.getUser() != null) {
            res.setUserId(entity.getUser().getId());
        }
        res.setTitle(entity.getTitle());
        res.setModelVersion(entity.getModelVersion());
        res.setIsPinned(entity.getIsPinned());
        res.setIsArchived(entity.getIsArchived());
        res.setContextMetadata(entity.getContextMetadata());
        res.setCreatedAt(entity.getCreatedAt());
        res.setUpdatedAt(entity.getUpdatedAt());
        if (includeMessages && entity.getMessages() != null) {
            res.setMessages(entity.getMessages().stream()
                    .map(AiMessageResponse::fromEntity)
                    .collect(Collectors.toList()));
        }
        return res;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getModelVersion() {
        return modelVersion;
    }

    public void setModelVersion(String modelVersion) {
        this.modelVersion = modelVersion;
    }

    public Boolean getIsPinned() {
        return isPinned;
    }

    public void setIsPinned(Boolean isPinned) {
        this.isPinned = isPinned;
    }

    public Boolean getIsArchived() {
        return isArchived;
    }

    public void setIsArchived(Boolean isArchived) {
        this.isArchived = isArchived;
    }

    public String getContextMetadata() {
        return contextMetadata;
    }

    public void setContextMetadata(String contextMetadata) {
        this.contextMetadata = contextMetadata;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<AiMessageResponse> getMessages() {
        return messages;
    }

    public void setMessages(List<AiMessageResponse> messages) {
        this.messages = messages != null ? messages : new ArrayList<>();
    }
}

