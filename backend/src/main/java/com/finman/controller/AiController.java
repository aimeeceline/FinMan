package com.finman.controller;

import com.finman.dto.request.AiChatRequest;
import com.finman.dto.request.AiInsightsRequest;
import com.finman.dto.request.AiQuickAddRequest;
import com.finman.dto.request.MacroImpactRequest;
import com.finman.dto.response.ApiResponse;
import com.finman.dto.response.AiChatResponse;
import com.finman.dto.response.AiConversationResponse;
import com.finman.dto.response.AiInsightsResponse;
import com.finman.dto.response.AiMessageResponse;
import com.finman.dto.response.AiQuickAddResponse;
import com.finman.dto.response.MacroImpactEvaluationResponse;
import com.finman.dto.response.PersonalizedInsightResponse;
import com.finman.exception.UnauthorizedException;
import com.finman.security.UserPrincipal;
import com.finman.service.AiService;
import com.finman.service.ai.PersonalizedInsightEngine;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.finman.config.GeminiConfig;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
public class AiController {

    private final AiService aiService;
    private final GeminiConfig geminiConfig;
    private final PersonalizedInsightEngine personalizedInsightEngine;

    public AiController(AiService aiService, GeminiConfig geminiConfig, PersonalizedInsightEngine personalizedInsightEngine) {
        this.aiService = aiService;
        this.geminiConfig = geminiConfig;
        this.personalizedInsightEngine = personalizedInsightEngine;
    }

    /**
     * GET /api/v1/ai/status
     * Kiểm tra trạng thái kết nối Google Gemini API (đang online hay fallback).
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatus() {
        boolean hasKey = geminiConfig.hasApiKey();
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("geminiConnected", hasKey);
        data.put("model", geminiConfig.getModel());
        data.put("mode", hasKey ? "GEMINI_ONLINE" : "LOCAL_FALLBACK_ONLY");
        return ResponseEntity.ok(ApiResponse.success(data, hasKey ? "Google Gemini đã kết nối thành công" : "Đang chạy chế độ Local Fallback"));
    }

    /**
     * POST /api/v1/ai/quick-add
     * Nhập nhanh giao dịch qua ngôn ngữ tự nhiên tiếng Việt.
     */
    @PostMapping("/quick-add")
    public ResponseEntity<ApiResponse<AiQuickAddResponse>> quickAdd(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody AiQuickAddRequest request) {
        validateUser(userPrincipal);
        AiQuickAddResponse response = aiService.parseTransactionFromText(userPrincipal.getId(), request.getText());
        return ResponseEntity.ok(ApiResponse.success(response, "Bóc tách thông tin giao dịch thành công"));
    }

    /**
     * POST /api/v1/ai/insights
     * Yêu cầu AI tổng hợp phân tích tài chính và đưa ra nhận xét tháng YYYY-MM.
     */
    @PostMapping("/insights")
    public ResponseEntity<ApiResponse<AiInsightsResponse>> generateInsights(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody(required = false) AiInsightsRequest request,
            @RequestParam(required = false) String month) {
        validateUser(userPrincipal);
        String targetMonth = resolveMonth(request, month);
        AiInsightsResponse response = aiService.generateMonthlyInsights(userPrincipal.getId(), targetMonth);
        return ResponseEntity.ok(ApiResponse.success(response, "Tạo nhận xét chi tiêu tài chính thành công"));
    }

    /**
     * GET /api/v1/ai/insights
     * Lấy nhận xét chi tiêu tài chính tháng YYYY-MM (hỗ trợ gọi bằng phương thức GET).
     */
    @GetMapping("/insights")
    public ResponseEntity<ApiResponse<AiInsightsResponse>> getInsights(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) String month) {
        validateUser(userPrincipal);
        String targetMonth = (month != null && !month.isBlank()) ? month : YearMonth.now().toString();
        AiInsightsResponse response = aiService.generateMonthlyInsights(userPrincipal.getId(), targetMonth);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy nhận xét chi tiêu tài chính thành công"));
    }

    /**
     * POST /api/v1/ai/chat
     * Xử lý tương tác thông minh qua trò chuyện (tự động phân loại: Quick Add, Truy vấn dữ liệu, Báo cáo).
     */
    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AiChatResponse>> chat(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody AiChatRequest request) {
        validateUser(userPrincipal);
        AiChatResponse response = aiService.processUserChat(userPrincipal.getId(), request.getMessage(), request.getConversationHistory());
        return ResponseEntity.ok(ApiResponse.success(response, "Xử lý yêu cầu thành công"));
    }

    /**
     * POST /api/v1/ai/query
     * Truy vấn trực tiếp thông tin/số liệu tài chính cá nhân bằng AI.
     */
    @PostMapping("/query")
    public ResponseEntity<ApiResponse<AiChatResponse>> queryData(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody AiChatRequest request) {
        validateUser(userPrincipal);
        AiChatResponse response = aiService.executeDataQuery(userPrincipal.getId(), request.getMessage(), request.getConversationHistory());
        return ResponseEntity.ok(ApiResponse.success(response, "Truy vấn dữ liệu tài chính thành công"));
    }

    /**
     * GET /api/v1/ai/personalized-insights
     * Phân tích chuyên sâu đối chiếu tài chính cá nhân với tin tức vĩ mô thị trường.
     */
    @GetMapping("/personalized-insights")
    public ResponseEntity<ApiResponse<PersonalizedInsightResponse>> getPersonalizedInsights(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) String topic) {
        validateUser(userPrincipal);
        PersonalizedInsightResponse response = personalizedInsightEngine.generatePersonalizedInsights(userPrincipal.getId(), topic);
        return ResponseEntity.ok(ApiResponse.success(response, "Tổng hợp nhận định tài chính cá nhân hóa thành công"));
    }

    /**
     * POST /api/v1/ai/macro-impact
     * Đánh giá tác động định lượng của kịch bản biến động vĩ mô (lãi suất, lạm phát, giá xăng).
     */
    @PostMapping("/macro-impact")
    public ResponseEntity<ApiResponse<MacroImpactEvaluationResponse>> evaluateMacroImpact(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody MacroImpactRequest request) {
        validateUser(userPrincipal);
        MacroImpactEvaluationResponse response = personalizedInsightEngine.evaluateMacroImpact(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(response, "Đánh giá kịch bản vĩ mô thành công"));
    }

    /**
     * POST /api/v1/ai/chat/v2
     * Trợ lý tài chính AI toàn diện v2: Hỗ trợ hội thoại đa phiên, ngữ cảnh lai và dẫn nguồn trích dẫn [Citations].
     */
    @PostMapping("/chat/v2")
    public ResponseEntity<ApiResponse<AiMessageResponse>> chatV2(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody AiChatRequest request) {
        validateUser(userPrincipal);
        AiMessageResponse response = personalizedInsightEngine.askPersonalizedAssistant(
                userPrincipal.getId(), request.getConversationId(), request.getMessage());
        return ResponseEntity.ok(ApiResponse.success(response, "Xử lý đàm thoại v2 thành công"));
    }

    /**
     * GET /api/v1/ai/conversations
     * Lấy danh sách các phiên trò chuyện của người dùng hiện tại (ưu tiên ghim, sắp xếp theo thời gian).
     */
    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<AiConversationResponse>>> getConversations(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        validateUser(userPrincipal);
        List<AiConversationResponse> list = personalizedInsightEngine.getUserConversations(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(list, "Lấy danh sách phiên hội thoại thành công"));
    }

    /**
     * POST /api/v1/ai/conversations
     * Tạo một phiên trò chuyện mới.
     */
    @PostMapping("/conversations")
    public ResponseEntity<ApiResponse<AiConversationResponse>> createConversation(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody(required = false) Map<String, String> payload) {
        validateUser(userPrincipal);
        String title = (payload != null) ? payload.get("title") : null;
        AiConversationResponse response = personalizedInsightEngine.createConversation(userPrincipal.getId(), title);
        return ResponseEntity.ok(ApiResponse.success(response, "Khởi tạo phiên hội thoại mới thành công"));
    }

    /**
     * GET /api/v1/ai/conversations/{id}
     * Lấy chi tiết phiên trò chuyện kèm toàn bộ tin nhắn và nguồn trích dẫn [Citations].
     */
    @GetMapping("/conversations/{id}")
    public ResponseEntity<ApiResponse<AiConversationResponse>> getConversationDetail(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id) {
        validateUser(userPrincipal);
        AiConversationResponse response = personalizedInsightEngine.getConversationDetail(userPrincipal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết phiên hội thoại thành công"));
    }

    /**
     * POST /api/v1/ai/conversations/{id}/messages
     * Gửi tin nhắn tiếp nối vào phiên hội thoại đã có.
     */
    @PostMapping("/conversations/{id}/messages")
    public ResponseEntity<ApiResponse<AiMessageResponse>> sendMessageToConversation(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id,
            @Valid @RequestBody AiChatRequest request) {
        validateUser(userPrincipal);
        AiMessageResponse response = personalizedInsightEngine.askPersonalizedAssistant(
                userPrincipal.getId(), id, request.getMessage());
        return ResponseEntity.ok(ApiResponse.success(response, "Gửi tin nhắn thành công"));
    }

    /**
     * PUT /api/v1/ai/conversations/{id}/pin
     * Ghim hoặc bỏ ghim phiên hội thoại.
     */
    @PutMapping("/conversations/{id}/pin")
    public ResponseEntity<ApiResponse<AiConversationResponse>> togglePin(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id) {
        validateUser(userPrincipal);
        AiConversationResponse response = personalizedInsightEngine.togglePinConversation(userPrincipal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật trạng thái ghim thành công"));
    }

    /**
     * DELETE /api/v1/ai/conversations/{id}
     * Xóa vĩnh viễn phiên hội thoại và toàn bộ tin nhắn liên quan.
     */
    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id) {
        validateUser(userPrincipal);
        personalizedInsightEngine.deleteConversation(userPrincipal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa phiên hội thoại thành công"));
    }

    /**
     * PUT /api/v1/ai/conversations/{id}/archive
     * Lưu trữ phiên hội thoại.
     */
    @PutMapping("/conversations/{id}/archive")
    public ResponseEntity<ApiResponse<Void>> archiveConversation(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id) {
        validateUser(userPrincipal);
        personalizedInsightEngine.archiveConversation(userPrincipal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(null, "Lưu trữ phiên hội thoại thành công"));
    }

    private String resolveMonth(AiInsightsRequest request, String paramMonth) {
        if (request != null && request.getMonth() != null && !request.getMonth().isBlank()) {
            return request.getMonth();
        }
        if (paramMonth != null && !paramMonth.isBlank()) {
            return paramMonth;
        }
        return YearMonth.now().toString();
    }

    private void validateUser(UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để thực hiện thao tác này");
        }
    }
}
