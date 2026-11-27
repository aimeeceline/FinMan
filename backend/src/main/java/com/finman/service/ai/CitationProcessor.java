package com.finman.service.ai;

import com.finman.dto.response.HybridFinancialContext.RetrievedNewsItem;
import com.finman.entity.AiMessage;
import com.finman.entity.AiMessageSource;
import com.finman.entity.NewsArticle;
import com.finman.repository.NewsArticleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Bộ xử lý phòng vệ Prompt Injection và Ánh xạ Trích dẫn bài báo (Citation Mapping Processor).
 * 1. Chống tiêm mã độc từ bài báo bên ngoài (Prompt Injection Defense): bọc thẻ <untrusted_external_news>
 *    và vô hiệu hóa các nỗ lực vượt rào (jailbreak / sandbox breakout).
 * 2. Phân tích câu trả lời của AI, bóc tách các đánh dấu trích dẫn [1], [2], [1, 2] và ánh xạ
 *    chính xác vào danh sách AiMessageSource để lưu trữ trong database.
 */
@Service
public class CitationProcessor {

    private static final Logger log = LoggerFactory.getLogger(CitationProcessor.class);

    // Regex bóc tách các đánh dấu trích dẫn trong văn bản AI: [1], [2], [1, 2], [1,2,3]
    private static final Pattern CITATION_PATTERN = Pattern.compile("\\[([0-9]+(?:\\s*,\\s*[0-9]+)*)\\]");

    // Các mẫu tấn công Prompt Injection / Jailbreak phổ biến
    private static final List<Pattern> INJECTION_PATTERNS = List.of(
            Pattern.compile("(?i)ignore\\s+(all\\s+)?previous\\s+instructions"),
            Pattern.compile("(?i)system\\s+prompt\\s+override"),
            Pattern.compile("(?i)you\\s+are\\s+now\\s+in\\s+(developer|dan|jailbreak|god)\\s+mode"),
            Pattern.compile("(?i)disregard\\s+(all\\s+)?(rules|instructions|prior\\s+context)"),
            Pattern.compile("(?i)forget\\s+(all\\s+)?your\\s+rules"),
            Pattern.compile("(?i)new\\s+instruction(s)?:"),
            Pattern.compile("(?i)bỏ\\s+qua\\s+(toàn\\s+bộ|mọi)?\\s*hướng\\s+dẫn\\s+trước"),
            Pattern.compile("(?i)quên\\s+(hết\\s+)?các\\s+quy\\s+tắc"),
            Pattern.compile("(?i)hãy\\s+đóng\\s+vai\\s+(kẻ\\s+xấu|hacker|ai\\s+không\\s+giới\\s+hạn)")
    );

    private final NewsArticleRepository newsArticleRepository;

    public CitationProcessor(NewsArticleRepository newsArticleRepository) {
        this.newsArticleRepository = newsArticleRepository;
    }

    /**
     * Kiểm tra xem chuỗi văn bản có chứa mẫu Prompt Injection nguy hiểm hay không.
     */
    public boolean containsSuspiciousInjection(String text) {
        if (text == null || text.isBlank()) {
            return false;
        }
        for (Pattern p : INJECTION_PATTERNS) {
            if (p.matcher(text).find()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Vệ sinh dữ liệu bài báo bên ngoài (External News Content Sanitization):
     * - Khử toàn bộ thẻ đóng </untrusted_external_news> để ngăn chặn sandbox escaping.
     * - Vô hiệu hóa các câu lệnh can thiệp hệ thống nếu phát hiện.
     */
    public String sanitizeExternalContent(String rawContent) {
        if (rawContent == null || rawContent.isBlank()) {
            return "";
        }

        // 1. Chống sandbox escaping (vượt rào thẻ XML)
        String sanitized = rawContent
                .replace("</untrusted_external_news>", "&lt;/untrusted_external_news&gt;")
                .replace("<untrusted_external_news>", "&lt;untrusted_external_news&gt;")
                .replace("<script", "&lt;script")
                .replace("</script>", "&lt;/script&gt;");

        // 2. Trung hòa các mẫu Prompt Injection nếu có trong văn bản
        for (Pattern pattern : INJECTION_PATTERNS) {
            sanitized = pattern.matcher(sanitized).replaceAll("[CANH_BAO_PROMPT_INJECTION_DA_BI_TRIET_TIEU]");
        }

        return sanitized;
    }

    /**
     * Bọc dữ liệu ngoại vi vào thẻ sandbox bảo mật <untrusted_external_news>.
     */
    public String wrapInUntrustedSandbox(String externalNewsContent) {
        String cleaned = sanitizeExternalContent(externalNewsContent);
        return "<untrusted_external_news>\n" + cleaned + "\n</untrusted_external_news>";
    }

    /**
     * Trích xuất tập hợp tất cả các chỉ số trích dẫn [1], [2] xuất hiện trong câu trả lời của AI.
     * Hỗ trợ cú pháp gộp: [1, 2], [1,2,3].
     *
     * @param aiResponseText Nội dung trả lời do AI sinh ra
     * @return Set các chỉ số thứ tự sắp xếp tăng dần (ví dụ: [1, 2])
     */
    public Set<Integer> extractCitationIndices(String aiResponseText) {
        if (aiResponseText == null || aiResponseText.isBlank()) {
            return Collections.emptySet();
        }

        Set<Integer> indices = new TreeSet<>();
        Matcher matcher = CITATION_PATTERN.matcher(aiResponseText);

        while (matcher.find()) {
            String matchedGroup = matcher.group(1);
            if (matchedGroup != null) {
                String[] parts = matchedGroup.split(",");
                for (String part : parts) {
                    try {
                        int index = Integer.parseInt(part.trim());
                        if (index > 0) {
                            indices.add(index);
                        }
                    } catch (NumberFormatException ignored) {
                        // Bỏ qua nếu không parse được số
                    }
                }
            }
        }

        return indices;
    }

    /**
     * Ánh xạ các chỉ số trích dẫn trong câu trả lời vào danh sách AiMessageSource của tin nhắn.
     *
     * @param message Tin nhắn AI (AiMessageRole.ASSISTANT)
     * @param aiResponseText Nội dung trả lời của AI
     * @param retrievedNews Danh sách tin tức đã cung cấp cho AI trong lượt hỏi này
     * @return Danh sách nguồn trích dẫn AiMessageSource đã tạo và gắn vào message
     */
    public List<AiMessageSource> extractAndMapCitations(AiMessage message,
                                                        String aiResponseText,
                                                        List<RetrievedNewsItem> retrievedNews) {
        if (message == null || aiResponseText == null || retrievedNews == null || retrievedNews.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Integer> indices = extractCitationIndices(aiResponseText);
        if (indices.isEmpty()) {
            return Collections.emptyList();
        }

        // Tạo map tra cứu nhanh theo citationIndex (1, 2, 3...)
        Map<Integer, RetrievedNewsItem> newsMap = retrievedNews.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(
                        RetrievedNewsItem::getCitationIndex,
                        item -> item,
                        (existing, replacement) -> existing
                ));

        List<AiMessageSource> createdSources = new ArrayList<>();

        for (Integer index : indices) {
            RetrievedNewsItem newsItem = newsMap.get(index);
            if (newsItem == null) {
                log.warn("AI referenced citation index [{}] but it was not present in retrieved news list. Skipping.", index);
                continue;
            }

            AiMessageSource source = new AiMessageSource();
            source.setMessage(message);
            source.setCitationIndex(index);
            source.setSourceTitle(truncateString(newsItem.getTitle(), 500));
            source.setSourceUrl(truncateString(newsItem.getOriginalUrl(), 1000));
            source.setSourceName(truncateString(newsItem.getSourceName(), 100));

            // Trích đoạn tóm tắt bài báo
            String snippet = newsItem.getSnippet();
            if (snippet == null && newsItem.getBulletPoints() != null) {
                snippet = newsItem.getBulletPoints();
            }
            source.setSnippet(snippet);

            // Điểm liên quan mặc định (tính theo thứ hạng citation index)
            // Ví dụ: trích dẫn [1] = 0.95, [2] = 0.90, [3] = 0.85
            double score = Math.max(0.50, 1.00 - (index * 0.05));
            source.setRelevanceScore(BigDecimal.valueOf(score).setScale(4, RoundingMode.HALF_UP));

            // Liên kết thực thể NewsArticle nếu có sẵn trong database
            if (newsItem.getArticleId() != null && newsArticleRepository != null) {
                newsArticleRepository.findById(newsItem.getArticleId())
                        .ifPresent(source::setArticle);
            }

            message.addSource(source);
            createdSources.add(source);
        }

        if (!createdSources.isEmpty()) {
            message.setHasCitations(true);
        }

        log.debug("Mapped {} citation sources for messageId={}", createdSources.size(), message.getId());
        return createdSources;
    }

    /**
     * DTO kết quả xử lý trích dẫn và phòng vệ Prompt Injection.
     */
    public record CitationProcessResult(
            String processedContent,
            Set<Integer> detectedCitationIndices,
            List<AiMessageSource> createdSources,
            boolean hasCitations,
            boolean injectionAttemptDetected
    ) {}

    /**
     * Phương thức tiện ích tổng hợp: kiểm tra injection và ánh xạ trích dẫn đồng thời.
     */
    public CitationProcessResult process(AiMessage message,
                                         String rawAiResponse,
                                         List<RetrievedNewsItem> retrievedNews) {
        boolean injectionDetected = containsSuspiciousInjection(rawAiResponse);
        if (injectionDetected) {
            log.warn("Suspicious prompt injection pattern detected in AI response content!");
        }

        List<AiMessageSource> sources = extractAndMapCitations(message, rawAiResponse, retrievedNews);
        Set<Integer> indices = extractCitationIndices(rawAiResponse);

        return new CitationProcessResult(
                rawAiResponse,
                indices,
                sources,
                !sources.isEmpty(),
                injectionDetected
        );
    }

    private String truncateString(String str, int maxLength) {
        if (str == null) return null;
        return str.length() <= maxLength ? str : str.substring(0, maxLength);
    }
}

