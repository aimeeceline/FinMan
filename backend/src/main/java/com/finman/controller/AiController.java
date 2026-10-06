package com.finman.controller;

import com.finman.dto.request.AiChatRequest;
import com.finman.dto.request.AiInsightsRequest;
import com.finman.dto.request.AiQuickAddRequest;
import com.finman.dto.response.ApiResponse;
import com.finman.dto.response.AiChatResponse;
import com.finman.dto.response.AiInsightsResponse;
import com.finman.dto.response.AiQuickAddResponse;
import com.finman.exception.UnauthorizedException;
import com.finman.security.UserPrincipal;
import com.finman.service.AiService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.finman.config.GeminiConfig;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
public class AiController {

    private final AiService aiService;
    private final GeminiConfig geminiConfig;

    public AiController(AiService aiService, GeminiConfig geminiConfig) {
        this.aiService = aiService;
        this.geminiConfig = geminiConfig;
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
