package com.finman.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(
        name = "ai_conversations",
        indexes = {
                @Index(name = "idx_ai_conversations_user", columnList = "user_id, updated_at DESC"),
                @Index(name = "idx_ai_conversations_pinned", columnList = "user_id, is_pinned, updated_at DESC")
        }
)
public class AiConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Người dùng không được để trống")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank(message = "Tiêu đề hội thoại không được để trống")
    @Size(max = 255, message = "Tiêu đề tối đa 255 ký tự")
    @Column(name = "title", nullable = false, length = 255)
    private String title = "Cuộc trò chuyện mới";

    @Size(max = 50, message = "Phiên bản mô hình tối đa 50 ký tự")
    @Column(name = "model_version", nullable = false, length = 50)
    private String modelVersion = "gemini-2.5-flash";

    @Column(name = "context_metadata", columnDefinition = "TEXT")
    private String contextMetadata;

    @Column(name = "is_pinned", nullable = false)
    private boolean isPinned = false;

    @Column(name = "is_archived", nullable = false)
    private boolean isArchived = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<AiMessage> messages = new ArrayList<>();

    public AiConversation() {
    }

    public AiConversation(User user, String title) {
        this.user = user;
        this.title = title != null && !title.isBlank() ? title : "Cuộc trò chuyện mới";
    }

    public AiConversation(User user, String title, String modelVersion) {
        this(user, title);
        if (modelVersion != null && !modelVersion.isBlank()) {
            this.modelVersion = modelVersion;
        }
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
        if (this.title == null || this.title.isBlank()) {
            this.title = "Cuộc trò chuyện mới";
        }
        if (this.modelVersion == null || this.modelVersion.isBlank()) {
            this.modelVersion = "gemini-2.5-flash";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public void addMessage(AiMessage message) {
        if (message != null) {
            this.messages.add(message);
            message.setConversation(this);
            this.updatedAt = Instant.now();
        }
    }

    public void removeMessage(AiMessage message) {
        if (message != null) {
            this.messages.remove(message);
            message.setConversation(null);
            this.updatedAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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

    public String getContextMetadata() {
        return contextMetadata;
    }

    public void setContextMetadata(String contextMetadata) {
        this.contextMetadata = contextMetadata;
    }

    public boolean isPinned() {
        return isPinned;
    }

    public Boolean getIsPinned() {
        return isPinned;
    }

    public void setPinned(boolean pinned) {
        isPinned = pinned;
    }

    public boolean isArchived() {
        return isArchived;
    }

    public Boolean getIsArchived() {
        return isArchived;
    }

    public void setArchived(boolean archived) {
        isArchived = archived;
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

    public List<AiMessage> getMessages() {
        return messages;
    }

    public void setMessages(List<AiMessage> messages) {
        this.messages = messages;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AiConversation that = (AiConversation) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "AiConversation{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", modelVersion='" + modelVersion + '\'' +
                ", isPinned=" + isPinned +
                ", isArchived=" + isArchived +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}

