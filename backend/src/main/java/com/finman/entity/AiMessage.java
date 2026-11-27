package com.finman.entity;

import com.finman.entity.enums.AiMessageRole;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(
        name = "ai_messages",
        indexes = {
                @Index(name = "idx_ai_messages_conversation", columnList = "conversation_id, created_at ASC")
        }
)
public class AiMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Cuộc trò chuyện không được để trống")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private AiConversation conversation;

    @NotNull(message = "Vai trò tin nhắn không được để trống")
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private AiMessageRole role;

    @NotBlank(message = "Nội dung tin nhắn không được để trống")
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "raw_prompt", columnDefinition = "TEXT")
    private String rawPrompt;

    @Column(name = "tokens_used")
    private Integer tokensUsed = 0;

    @Column(name = "has_citations", nullable = false)
    private boolean hasCitations = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("citationIndex ASC")
    private List<AiMessageSource> sources = new ArrayList<>();

    public AiMessage() {
    }

    public AiMessage(AiConversation conversation, AiMessageRole role, String content) {
        this.conversation = conversation;
        this.role = role;
        this.content = content;
    }

    public AiMessage(AiConversation conversation, AiMessageRole role, String content, String rawPrompt) {
        this(conversation, role, content);
        this.rawPrompt = rawPrompt;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.tokensUsed == null) {
            this.tokensUsed = 0;
        }
    }

    public void addSource(AiMessageSource source) {
        if (source != null) {
            this.sources.add(source);
            source.setMessage(this);
            this.hasCitations = true;
        }
    }

    public void removeSource(AiMessageSource source) {
        if (source != null) {
            this.sources.remove(source);
            source.setMessage(null);
            this.hasCitations = !this.sources.isEmpty();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public AiConversation getConversation() {
        return conversation;
    }

    public void setConversation(AiConversation conversation) {
        this.conversation = conversation;
    }

    public AiMessageRole getRole() {
        return role;
    }

    public void setRole(AiMessageRole role) {
        this.role = role;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getRawPrompt() {
        return rawPrompt;
    }

    public void setRawPrompt(String rawPrompt) {
        this.rawPrompt = rawPrompt;
    }

    public Integer getTokensUsed() {
        return tokensUsed;
    }

    public void setTokensUsed(Integer tokensUsed) {
        this.tokensUsed = tokensUsed;
    }

    public boolean isHasCitations() {
        return hasCitations;
    }

    public void setHasCitations(boolean hasCitations) {
        this.hasCitations = hasCitations;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public List<AiMessageSource> getSources() {
        return sources;
    }

    public void setSources(List<AiMessageSource> sources) {
        this.sources = sources;
        this.hasCitations = sources != null && !sources.isEmpty();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AiMessage aiMessage = (AiMessage) o;
        return Objects.equals(id, aiMessage.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "AiMessage{" +
                "id=" + id +
                ", role=" + role +
                ", tokensUsed=" + tokensUsed +
                ", hasCitations=" + hasCitations +
                ", createdAt=" + createdAt +
                '}';
    }
}

