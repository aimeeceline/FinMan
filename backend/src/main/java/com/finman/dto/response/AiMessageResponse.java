package com.finman.dto.response;

import com.finman.entity.AiMessage;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class AiMessageResponse {

    private Long id;
    private Long conversationId;
    private String role;
    private String content;
    private Integer tokensUsed;
    private Instant createdAt;
    private List<AiMessageSourceResponse> sources = new ArrayList<>();

    public AiMessageResponse() {
    }

    public static AiMessageResponse fromEntity(AiMessage entity) {
        if (entity == null) {
            return null;
        }
        AiMessageResponse res = new AiMessageResponse();
        res.setId(entity.getId());
        if (entity.getConversation() != null) {
            res.setConversationId(entity.getConversation().getId());
        }
        res.setRole(entity.getRole() != null ? entity.getRole().name() : null);
        res.setContent(entity.getContent());
        res.setTokensUsed(entity.getTokensUsed());
        res.setCreatedAt(entity.getCreatedAt());
        if (entity.getSources() != null) {
            res.setSources(entity.getSources().stream()
                    .map(AiMessageSourceResponse::fromEntity)
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

    public Long getConversationId() {
        return conversationId;
    }

    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Integer getTokensUsed() {
        return tokensUsed;
    }

    public void setTokensUsed(Integer tokensUsed) {
        this.tokensUsed = tokensUsed;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public List<AiMessageSourceResponse> getSources() {
        return sources;
    }

    public void setSources(List<AiMessageSourceResponse> sources) {
        this.sources = sources != null ? sources : new ArrayList<>();
    }
}

