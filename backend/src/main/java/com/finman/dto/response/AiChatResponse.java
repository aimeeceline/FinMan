package com.finman.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class AiChatResponse {

    /**
     * Loai phan hoi:
     * - QUICK_ADD: Bóc tách được giao dịch cần lưu
     * - QUERY_ANSWER: Câu trả lời truy vấn dữ liệu tài chính từ AI
     * - INSIGHTS: Báo cáo nhận xét tháng
     */
    private String responseType;
    private String text;
    private String source; // "GEMINI_2.5_FLASH" or "LOCAL_FALLBACK"
    private List<AiQuickAddItem> items;
    private AiInsightsResponse insights;
    private Map<String, Object> metadata;
    private LocalDateTime timestamp;

    public AiChatResponse() {
        this.timestamp = LocalDateTime.now();
    }

    public static AiChatResponse quickAdd(List<AiQuickAddItem> items, String source) {
        AiChatResponse res = new AiChatResponse();
        res.setResponseType("QUICK_ADD");
        res.setSource(source);
        res.setItems(items);
        if (items != null && items.size() > 1) {
            res.setText(String.format("Tôi đã nhận diện được %d giao dịch của bạn. Bạn có thể kiểm tra từng giao dịch hoặc bấm \"Lưu tất cả\":", items.size()));
        } else {
            res.setText("Tôi đã nhận diện được giao dịch của bạn. Vui lòng kiểm tra và bấm \"Áp dụng & Lưu\" để ghi vào lịch sử giao dịch:");
        }
        return res;
    }

    public static AiChatResponse queryAnswer(String text, String source, Map<String, Object> metadata) {
        AiChatResponse res = new AiChatResponse();
        res.setResponseType("QUERY_ANSWER");
        res.setText(text);
        res.setSource(source);
        res.setMetadata(metadata);
        return res;
    }

    public static AiChatResponse insights(AiInsightsResponse insights, String source) {
        AiChatResponse res = new AiChatResponse();
        res.setResponseType("INSIGHTS");
        res.setInsights(insights);
        res.setSource(source);
        res.setText(String.format("Dưới đây là báo cáo phân tích tài chính chi tiêu cho tháng %s:", insights != null ? insights.getMonth() : ""));
        return res;
    }

    public String getResponseType() {
        return responseType;
    }

    public void setResponseType(String responseType) {
        this.responseType = responseType;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public List<AiQuickAddItem> getItems() {
        return items;
    }

    public void setItems(List<AiQuickAddItem> items) {
        this.items = items;
    }

    public AiInsightsResponse getInsights() {
        return insights;
    }

    public void setInsights(AiInsightsResponse insights) {
        this.insights = insights;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
