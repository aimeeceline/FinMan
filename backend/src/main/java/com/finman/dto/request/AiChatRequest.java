package com.finman.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class AiChatRequest {

    @NotBlank(message = "Nội dung câu lệnh không được để trống")
    private String message;

    private List<AiChatMessageDto> conversationHistory;

    public AiChatRequest() {
    }

    public AiChatRequest(String message) {
        this.message = message;
    }

    public AiChatRequest(String message, List<AiChatMessageDto> conversationHistory) {
        this.message = message;
        this.conversationHistory = conversationHistory;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<AiChatMessageDto> getConversationHistory() {
        return conversationHistory;
    }

    public void setConversationHistory(List<AiChatMessageDto> conversationHistory) {
        this.conversationHistory = conversationHistory;
    }
}
