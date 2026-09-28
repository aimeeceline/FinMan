package com.finman.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.finman.config.GeminiConfig;
import com.finman.exception.AppException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class GeminiClientImpl implements GeminiClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiClientImpl.class);

    private final RestClient geminiRestClient;
    private final GeminiConfig geminiConfig;
    private final ObjectMapper objectMapper;

    public GeminiClientImpl(RestClient geminiRestClient, GeminiConfig geminiConfig, ObjectMapper objectMapper) {
        this.geminiRestClient = geminiRestClient;
        this.geminiConfig = geminiConfig;
        this.objectMapper = objectMapper;
    }

    @Override
    public String generateContent(String prompt, boolean jsonMode) {
        if (!geminiConfig.hasApiKey()) {
            throw new AppException("Chưa cấu hình GEMINI_API_KEY", HttpStatus.SERVICE_UNAVAILABLE, "AI_SERVICE_UNAVAILABLE");
        }

        try {
            Map<String, Object> part = Map.of("text", prompt);
            Map<String, Object> content = Map.of("parts", List.of(part));

            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.1);
            if (jsonMode) {
                generationConfig.put("responseMimeType", "application/json");
            }

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(content),
                    "generationConfig", generationConfig
            );

            String uri = String.format("/models/%s:generateContent?key=%s",
                    geminiConfig.getModel(), geminiConfig.getApiKey());

            String responseBody = geminiRestClient.post()
                    .uri(uri)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            if (responseBody == null || responseBody.isBlank()) {
                throw new AppException("Hệ thống AI không trả về dữ liệu", HttpStatus.SERVICE_UNAVAILABLE, "AI_SERVICE_UNAVAILABLE");
            }

            JsonNode rootNode = objectMapper.readTree(responseBody);
            JsonNode candidatesNode = rootNode.path("candidates");
            if (!candidatesNode.isArray() || candidatesNode.isEmpty()) {
                throw new AppException("Hệ thống AI không tạo được nội dung phản hồi", HttpStatus.SERVICE_UNAVAILABLE, "AI_SERVICE_UNAVAILABLE");
            }

            JsonNode partsNode = candidatesNode.get(0).path("content").path("parts");
            if (!partsNode.isArray() || partsNode.isEmpty()) {
                throw new AppException("Hệ thống AI trả về kết quả rỗng", HttpStatus.SERVICE_UNAVAILABLE, "AI_SERVICE_UNAVAILABLE");
            }

            String text = partsNode.get(0).path("text").asText("");
            return cleanJsonText(text);

        } catch (HttpStatusCodeException ex) {
            log.error("Gemini API error (Status: {}): {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new AppException("Hệ thống AI hiện đang bận hoặc gián đoạn kết nối. Vui lòng thử lại sau.",
                    HttpStatus.SERVICE_UNAVAILABLE, "AI_SERVICE_UNAVAILABLE");
        } catch (ResourceAccessException ex) {
            log.error("Gemini API timeout or network error: {}", ex.getMessage());
            throw new AppException("Hệ thống AI hiện đang bận hoặc gián đoạn kết nối. Vui lòng thử lại sau.",
                    HttpStatus.SERVICE_UNAVAILABLE, "AI_SERVICE_UNAVAILABLE");
        } catch (AppException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Gemini Client unexpected error: ", ex);
            throw new AppException("Hệ thống AI hiện đang bận hoặc gián đoạn kết nối. Vui lòng thử lại sau.",
                    HttpStatus.SERVICE_UNAVAILABLE, "AI_SERVICE_UNAVAILABLE");
        }
    }

    private String cleanJsonText(String text) {
        if (text == null) return "";
        String trimmed = text.trim();
        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7);
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3);
        }
        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3);
        }
        return trimmed.trim();
    }
}
