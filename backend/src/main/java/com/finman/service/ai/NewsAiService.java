package com.finman.service.ai;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.finman.client.GeminiClient;
import com.finman.config.GeminiConfig;
import com.finman.entity.NewsArticle;
import com.finman.entity.NewsSummary;
import com.finman.exception.ResourceNotFoundException;
import com.finman.repository.NewsArticleRepository;
import com.finman.repository.NewsSummaryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class NewsAiService {

    private static final Logger log = LoggerFactory.getLogger(NewsAiService.class);
    private static final String PROMPT_PATH = "prompts/news-summary.txt";
    private static final String PROMPT_TEMPLATE = loadPromptTemplate();
    private static final Pattern TICKER_TOKEN_PATTERN = Pattern.compile("\\b([A-Z]{3})\\b");

    private static final Map<String, String> COMPANY_TO_TICKER = createCompanyToTickerMap();
    private static final Set<String> KNOWN_VN_TICKERS = Set.of(
            "FPT", "HPG", "VCB", "VIC", "VHM", "VNM", "TCB", "MBB", "BID", "CTG",
            "ACB", "VPB", "SSI", "MWG", "MSN", "GAS", "SAB", "STB", "HDB", "VIB",
            "SHB", "LPB", "TPB", "PNJ", "REE", "DGC", "GVR", "PLX", "POW", "VJC",
            "VRE", "KDH", "NLG", "NVL", "PDR", "VND", "HCM", "VCI", "FTS", "BSI",
            "HSG", "NKG", "DCM", "DPM", "FRT", "DGW", "CTR", "PVD", "PVS", "BSR"
    );

    private final GeminiClient geminiClient;
    private final GeminiConfig geminiConfig;
    private final NewsArticleRepository articleRepository;
    private final NewsSummaryRepository summaryRepository;
    private final ObjectMapper objectMapper;
    private final ConcurrentHashMap<Long, Object> articleLocks = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, NewsSummary> summaryMemoryCache = new ConcurrentHashMap<>();

    @Autowired
    public NewsAiService(GeminiClient geminiClient,
                         GeminiConfig geminiConfig,
                         NewsArticleRepository articleRepository,
                         NewsSummaryRepository summaryRepository,
                         ObjectMapper objectMapper) {
        this.geminiClient = geminiClient;
        this.geminiConfig = geminiConfig;
        this.articleRepository = articleRepository;
        this.summaryRepository = summaryRepository;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    /**
     * Tóm tắt bài báo tài chính thành 3 bullet points, nhận diện sắc thái và mã cổ phiếu.
     * Bắt buộc kiểm tra cache trong bảng news_summaries trước khi gọi Gemini API.
     */
    @Transactional
    public NewsSummary summarizeArticle(Long articleId) {
        if (articleId == null) {
            throw new IllegalArgumentException("ID bài viết không được để trống");
        }

        // 1. Kiểm tra nhanh trong L1 memory cache & database cache trước (< 1ms - 10ms, 0 token AI)
        NewsSummary memCached = summaryMemoryCache.get(articleId);
        if (memCached != null) {
            return memCached;
        }

        Optional<NewsSummary> cached = summaryRepository.findByArticleId(articleId);
        if (cached.isPresent()) {
            summaryMemoryCache.put(articleId, cached.get());
            return cached.get();
        }

        Object lock = articleLocks.computeIfAbsent(articleId, k -> new Object());
        synchronized (lock) {
            try {
                // Double-check cache sau khi vào vùng đồng bộ hóa để chặn gọi trùng
                Optional<NewsSummary> rechecked = summaryRepository.findByArticleId(articleId);
                if (rechecked.isPresent()) {
                    summaryMemoryCache.put(articleId, rechecked.get());
                    return rechecked.get();
                }

                NewsArticle article = articleRepository.findById(articleId)
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết với ID: " + articleId));

                NewsSummary generated = generateAndSaveSummary(article);
                if (article.getId() != null && generated != null) {
                    summaryMemoryCache.put(article.getId(), generated);
                }
                return generated;
            } finally {
                articleLocks.remove(articleId);
            }
        }
    }

    @Transactional
    public NewsSummary summarizeArticle(NewsArticle article) {
        if (article == null) {
            throw new IllegalArgumentException("Bài viết không được để trống");
        }
        if (article.getId() != null) {
            Optional<NewsSummary> cached = summaryRepository.findByArticleId(article.getId());
            if (cached.isPresent()) {
                return cached.get();
            }
        }
        return generateAndSaveSummary(article);
    }

    @Transactional
    public int processUnprocessedArticles(int limit) {
        int batchSize = limit > 0 ? limit : 10;
        List<NewsArticle> unprocessed = articleRepository.findByIsAiProcessedFalseOrderByPublishedAtDesc(
                PageRequest.of(0, batchSize)
        );
        int processedCount = 0;
        for (NewsArticle article : unprocessed) {
            try {
                summarizeArticle(article.getId());
                processedCount++;
            } catch (Exception e) {
                log.warn("Không thể xử lý AI cho bài viết ID {}: {}", article.getId(), e.getMessage());
            }
        }
        return processedCount;
    }

    private NewsSummary generateAndSaveSummary(NewsArticle article) {
        String prompt = buildStructuredPrompt(article);
        NewsSummary summary = null;

        try {
            if (geminiClient != null) {
                String rawResponse = geminiClient.generateContent(prompt, true);
                if (rawResponse != null && !rawResponse.isBlank()) {
                    summary = parseGeminiResponse(article, rawResponse);
                }
            }
        } catch (Exception e) {
            log.warn("Lỗi khi gọi Gemini tóm tắt bài viết ID '{}' ({}), chuyển sang cơ chế fallback: {}",
                    article.getId(), article.getTitle(), e.getMessage());
        }

        if (summary == null) {
            summary = buildFallbackSummary(article);
        }

        NewsSummary savedSummary = summaryRepository.saveAndFlush(summary);
        article.setIsAiProcessed(true);
        articleRepository.saveAndFlush(article);

        return savedSummary;
    }

    public String buildStructuredPrompt(NewsArticle article) {
        String safeTitle = sanitizeUntrustedText(article.getTitle());
        String safeSource = article.getSource() != null ? sanitizeUntrustedText(article.getSource().getName()) : "Tổng hợp";
        String safeCategory = article.getCategory() != null ? sanitizeUntrustedText(article.getCategory().getNameVi()) : "Tài chính";

        StringBuilder contentBuilder = new StringBuilder();
        if (article.getDescription() != null && !article.getDescription().isBlank()) {
            contentBuilder.append(article.getDescription().trim());
        }
        if (article.getContentSnippet() != null && !article.getContentSnippet().isBlank()
                && !article.getContentSnippet().trim().equals(article.getDescription() != null ? article.getDescription().trim() : "")) {
            if (contentBuilder.length() > 0) {
                contentBuilder.append("\n");
            }
            contentBuilder.append(article.getContentSnippet().trim());
        }
        String safeContent = sanitizeUntrustedText(
                contentBuilder.length() > 0 ? contentBuilder.toString() : safeTitle
        );

        // Dùng replace thay vì String.format để an toàn tuyệt đối với ký tự '%' trong bản tin tài chính
        return PROMPT_TEMPLATE
                .replace("{{TITLE}}", safeTitle)
                .replace("{{SOURCE}}", safeSource)
                .replace("{{CATEGORY}}", safeCategory)
                .replace("{{CONTENT}}", safeContent);
    }

    public NewsSummary parseGeminiResponse(NewsArticle article, String rawJson) throws Exception {
        String cleanedJson = stripMarkdownCodeFences(rawJson);
        JsonNode root = objectMapper.readTree(cleanedJson);

        List<String> bullets = new ArrayList<>();
        JsonNode bulletsNode = root.path("bulletPoints");
        if (bulletsNode.isArray()) {
            for (JsonNode item : bulletsNode) {
                if (item != null && !item.isNull() && !item.asText().isBlank()) {
                    bullets.add(item.asText().trim());
                }
            }
        }
        List<String> normalizedBullets = ensureThreeBulletPoints(bullets, article);
        String bulletPointsJson = objectMapper.writeValueAsString(normalizedBullets);

        String rawSentiment = textOrDefault(root, "sentiment", "");
        String sentiment = normalizeSentiment(rawSentiment, article);

        String sentimentReason = textOrDefault(
                root,
                "sentimentReason",
                "Phân loại dựa trên diễn biến thông tin tài chính trong bài viết."
        );

        String impactAnalysis = textOrDefault(
                root,
                "impactAnalysis",
                "Tác động trực tiếp đến tâm lý nhà đầu tư và nhóm ngành liên quan."
        );

        Set<String> tickers = new LinkedHashSet<>();
        JsonNode tickersNode = root.path("relatedTickers");
        if (tickersNode.isArray()) {
            for (JsonNode t : tickersNode) {
                addValidTicker(tickers, t.asText());
            }
        } else if (tickersNode.isTextual()) {
            for (String part : tickersNode.asText().split("[,;\\s]+")) {
                addValidTicker(tickers, part);
            }
        }
        // Kết hợp nhận diện từ nội dung bài báo để đảm bảo độ chính xác >= 90%
        tickers.addAll(detectTickersFromText(article.getTitle() + " " + article.getDescription() + " " + article.getContentSnippet()));
        String relatedTickersStr = tickers.isEmpty() ? null : String.join(",", tickers);

        Set<String> tags = new LinkedHashSet<>();
        JsonNode tagsNode = root.path("tags");
        if (tagsNode.isArray()) {
            for (JsonNode tag : tagsNode) {
                String t = tag.asText("").trim();
                if (!t.isEmpty()) {
                    tags.add(t.startsWith("#") ? t : "#" + t);
                }
            }
        } else if (tagsNode.isTextual() && !tagsNode.asText().isBlank()) {
            for (String part : tagsNode.asText().split("[,\\s]+")) {
                String t = part.trim();
                if (!t.isEmpty()) {
                    tags.add(t.startsWith("#") ? t : "#" + t);
                }
            }
        }
        if (tags.isEmpty()) {
            tags.add("#taichinh");
        }
        String tagsStr = String.join(",", tags);

        String modelVersion = geminiConfig != null && geminiConfig.getModel() != null && !geminiConfig.getModel().isBlank()
                ? geminiConfig.getModel()
                : "gemini-2.5-flash";

        return new NewsSummary(
                article,
                bulletPointsJson,
                sentiment,
                sentimentReason,
                impactAnalysis,
                relatedTickersStr,
                tagsStr,
                modelVersion
        );
    }

    public NewsSummary buildFallbackSummary(NewsArticle article) {
        List<String> fallbackBullets = ensureThreeBulletPoints(List.of(), article);
        String bulletPointsJson;
        try {
            bulletPointsJson = objectMapper.writeValueAsString(fallbackBullets);
        } catch (Exception e) {
            bulletPointsJson = "[\"" + article.getTitle().replace("\"", "'") + "\"]";
        }

        String combinedText = (article.getTitle() != null ? article.getTitle() : "") + " "
                + (article.getDescription() != null ? article.getDescription() : "") + " "
                + (article.getContentSnippet() != null ? article.getContentSnippet() : "");

        String sentiment = detectHeuristicSentiment(combinedText);
        String sentimentReason = switch (sentiment) {
            case "POSITIVE" -> "Bài viết ghi nhận tín hiệu tăng trưởng hoặc kết quả tích cực trên thị trường.";
            case "NEGATIVE" -> "Bài viết phản ánh áp lực điều chỉnh, suy giảm hoặc rủi ro thị trường.";
            default -> "Bài viết cung cấp thông tin cập nhật trung lập về diễn biến kinh tế - tài chính.";
        };

        String categoryName = article.getCategory() != null ? article.getCategory().getNameVi() : "Tài chính";
        String impactAnalysis = "Tác động đáng chú ý đến nhóm ngành " + categoryName + " và quyết định phân bổ vốn cá nhân.";

        Set<String> detectedTickers = detectTickersFromText(combinedText);
        String relatedTickers = detectedTickers.isEmpty() ? null : String.join(",", detectedTickers);

        String modelVersion = geminiConfig != null && geminiConfig.getModel() != null && !geminiConfig.getModel().isBlank()
                ? geminiConfig.getModel()
                : "gemini-2.5-flash";

        return new NewsSummary(
                article,
                bulletPointsJson,
                sentiment,
                sentimentReason,
                impactAnalysis,
                relatedTickers,
                "#taichinh,#thitruong",
                modelVersion
        );
    }

    public List<String> parseBulletPointsList(String bulletPointsJson) {
        if (bulletPointsJson == null || bulletPointsJson.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(bulletPointsJson, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of(bulletPointsJson);
        }
    }

    public Set<String> detectTickersFromText(String text) {
        Set<String> result = new LinkedHashSet<>();
        if (text == null || text.isBlank()) {
            return result;
        }

        String lowerText = text.toLowerCase(Locale.ROOT);
        for (Map.Entry<String, String> entry : COMPANY_TO_TICKER.entrySet()) {
            if (lowerText.contains(entry.getKey())) {
                result.add(entry.getValue());
            }
        }

        Matcher matcher = TICKER_TOKEN_PATTERN.matcher(text);
        while (matcher.find()) {
            String candidate = matcher.group(1);
            if (KNOWN_VN_TICKERS.contains(candidate)) {
                result.add(candidate);
            }
        }

        return result;
    }

    private List<String> ensureThreeBulletPoints(List<String> rawBullets, NewsArticle article) {
        List<String> result = new ArrayList<>();
        if (rawBullets != null) {
            for (String b : rawBullets) {
                if (b != null && !b.isBlank() && result.size() < 3) {
                    result.add(b.trim());
                }
            }
        }

        String title = article.getTitle() != null ? article.getTitle().trim() : "Sự kiện tài chính đáng chú ý";
        String desc = article.getDescription() != null && !article.getDescription().isBlank()
                ? article.getDescription().trim()
                : "Diễn biến mới nhất được ghi nhận từ nguồn tin chính thống.";
        String sourceName = article.getSource() != null && article.getSource().getName() != null
                ? article.getSource().getName()
                : "Báo tài chính";
        String categoryName = article.getCategory() != null && article.getCategory().getNameVi() != null
                ? article.getCategory().getNameVi()
                : "Thị trường";

        if (result.size() < 1) {
            result.add("Sự kiện chính: " + title);
        }
        if (result.size() < 2) {
            result.add("Chi tiết trọng tâm: " + (desc.length() > 180 ? desc.substring(0, 180) + "..." : desc));
        }
        if (result.size() < 3) {
            result.add("Hệ quả & Theo dõi: Tác động trực tiếp đến chuyên mục " + categoryName + " (Nguồn: " + sourceName + ").");
        }

        return result.subList(0, 3);
    }

    private void addValidTicker(Set<String> tickers, String rawTicker) {
        if (rawTicker == null || rawTicker.isBlank()) {
            return;
        }
        String cleaned = rawTicker.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "");
        if (cleaned.length() == 3) {
            tickers.add(cleaned);
        }
    }

    private String normalizeSentiment(String rawSentiment, NewsArticle article) {
        if (rawSentiment != null) {
            String upper = rawSentiment.trim().toUpperCase(Locale.ROOT);
            if ("POSITIVE".equals(upper) || "NEGATIVE".equals(upper) || "NEUTRAL".equals(upper)) {
                return upper;
            }
        }
        return detectHeuristicSentiment(
                (article.getTitle() != null ? article.getTitle() : "") + " "
                        + (article.getDescription() != null ? article.getDescription() : "")
        );
    }

    private String detectHeuristicSentiment(String text) {
        if (text == null || text.isBlank()) {
            return "NEUTRAL";
        }
        String lower = text.toLowerCase(Locale.ROOT);
        int posScore = countMatches(lower, "tăng trưởng", "tăng mạnh", "khởi sắc", "vượt dự báo", "lợi nhuận tăng", "mua ròng", "bứt phá", "tích cực", "lập đỉnh", "hồi phục");
        int negScore = countMatches(lower, "giảm mạnh", "lao dốc", "thua lỗ", "bán ròng", "rủi ro", "suy giảm", "nợ xấu", "tiêu cực", "thủng đáy", "áp lực");

        if (posScore > negScore) {
            return "POSITIVE";
        }
        if (negScore > posScore) {
            return "NEGATIVE";
        }
        return "NEUTRAL";
    }

    private int countMatches(String text, String... keywords) {
        int count = 0;
        for (String kw : keywords) {
            if (text.contains(kw)) {
                count++;
            }
        }
        return count;
    }

    private String sanitizeUntrustedText(String input) {
        if (input == null || input.isBlank()) {
            return "";
        }
        return input
                .replace("</untrusted_external_news>", "")
                .replace("<untrusted_external_news>", "")
                .trim();
    }

    private String stripMarkdownCodeFences(String raw) {
        if (raw == null) {
            return "{}";
        }
        String trimmed = raw.trim();
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            if (firstNewline != -1) {
                trimmed = trimmed.substring(firstNewline + 1);
            }
            if (trimmed.endsWith("```")) {
                trimmed = trimmed.substring(0, trimmed.length() - 3);
            }
        }
        return trimmed.trim();
    }

    private String textOrDefault(JsonNode node, String field, String defaultValue) {
        JsonNode child = node.get(field);
        if (child != null && !child.isNull() && !child.asText().isBlank()) {
            return child.asText().trim();
        }
        return defaultValue;
    }

    private static Map<String, String> createCompanyToTickerMap() {
        Map<String, String> map = new LinkedHashMap<>();
        map.put("fpt", "FPT");
        map.put("hòa phát", "HPG");
        map.put("hoa phat", "HPG");
        map.put("vietcombank", "VCB");
        map.put("ngoại thương", "VCB");
        map.put("vingroup", "VIC");
        map.put("vinhomes", "VHM");
        map.put("vinamilk", "VNM");
        map.put("techcombank", "TCB");
        map.put("kỹ thương", "TCB");
        map.put("mbbank", "MBB");
        map.put("quân đội", "MBB");
        map.put("bidv", "BID");
        map.put("vietinbank", "CTG");
        map.put("công thương", "CTG");
        map.put("vpbank", "VPB");
        map.put("thế giới di động", "MWG");
        map.put("masan", "MSN");
        map.put("vàng bạc đá quý phú nhuận", "PNJ");
        map.put("đức giang", "DGC");
        map.put("sacombank", "STB");
        map.put("hdbank", "HDB");
        map.put("tpbank", "TPB");
        map.put("vietjet", "VJC");
        map.put("hoa sen", "HSG");
        return map;
    }

    private static String loadPromptTemplate() {
        try {
            ClassPathResource resource = new ClassPathResource(PROMPT_PATH);
            try (InputStream is = resource.getInputStream()) {
                return new String(is.readAllBytes(), StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            return """
                    Hãy tóm tắt bài báo tài chính trong thẻ <untrusted_external_news> thành JSON gồm:
                    bulletPoints (mảng đúng 3 chuỗi), sentiment (POSITIVE|NEGATIVE|NEUTRAL),
                    sentimentReason, impactAnalysis, relatedTickers (mảng mã cổ phiếu 3 chữ cái), tags.
                    <untrusted_external_news>
                    Tiêu đề: {{TITLE}}
                    Nguồn báo: {{SOURCE}}
                    Chuyên mục: {{CATEGORY}}
                    Nội dung: {{CONTENT}}
                    </untrusted_external_news>
                    """;
        }
    }
}

