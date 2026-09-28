package com.finman.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AiQuickAddRequest {

    @NotBlank(message = "Nội dung câu lệnh không được để trống")
    @Size(max = 500, message = "Câu lệnh không được vượt quá 500 ký tự")
    private String text;

    public AiQuickAddRequest() {
    }

    public AiQuickAddRequest(String text) {
        this.text = text;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }
}
