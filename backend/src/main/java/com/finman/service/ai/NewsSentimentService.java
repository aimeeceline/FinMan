package com.finman.service.ai;

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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class NewsSentimentService {

    private static final Logger log = LoggerFactory.getLogger(NewsSentimentService.class);
    private static final String PROMPT_PATH = "prompts/news-sentiment.txt";
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

    public record SentimentAnalysisResult(
            String sentiment,
            String sentimentReason,
            String factSummary,
            String aiOpinion,
            String beneficiaries,
            String riskExposed,
            String impactAnalysis,
            List<String> relatedTickers,
            List<String> tags
    ) {}

    private final GeminiClient geminiClient;
    private final GeminiConfig geminiConfig;
    private final NewsArticleRepository articleRepository;
    private final NewsSummaryRepository summaryRepository;
    private final ObjectMapper objectMapper;

    @Autowired
    public NewsSentimentService(GeminiClient geminiClient,
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
     * Phân tích sắc thái (POSITIVE, NEGATIVE, NEUTRAL), giải thích căn cứ,
     * phân định rõ Dữ kiện bài báo (Fact) vs Nhận định AI (Opinion), đối tượng hưởng lợi/rủi ro,
     * trích xuất mã cổ phiếu liên quan và lưu cache vào bảng news_summaries.
     */
    @Transactional
    public NewsSummary analyzeAndCacheSentiment(Long articleId) {
        if (articleId == null) {
            throw new IllegalArgumentException("ID bài viết không được để trống");
        }

        Optional<NewsSummary> existingOpt = summaryRepository.findByArticleId(articleId);
        if (existingOpt.isPresent()) {
            NewsSummary existing = existingOpt.get();
            if (existing.getSentiment() != null && !existing.getSentiment().isBlank()
                    && existing.getSentimentReason() != null && !existing.getSentimentReason().isBlank()
                    && existing.getImpactAnalysis() != null && !existing.getImpactAnalysis().isBlank()) {
                return existing;
            }
        }

        NewsArticle article = articleRepository.findById(articleId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết với ID: " + articleId));

        SentimentAnalysisResult result = analyzeArticleSentiment(article);

        NewsSummary summary = existingOpt.orElseGet(NewsSummary::new);
        summary.setArticle(article);
        if (summary.getBulletPoints() == null || summary.getBulletPoints().isBlank()) {
            summary.setBulletPoints(buildDefaultBulletsJson(article, result));
        }
        summary.setSentiment(result.sentiment());
        summary.setSentimentReason(result.sentimentReason());
        summary.setImpactAnalysis(result.impactAnalysis());
        summary.setRelatedTickers(result.relatedTickers().isEmpty() ? null : String.join(",", result.relatedTickers()));
        summary.setTags(result.tags().isEmpty() ? "#taichinh" : String.join(",", result.tags()));
        summary.setModelVersion(
                geminiConfig != null && geminiConfig.getModel() != null && !geminiConfig.getModel().isBlank()
                        ? geminiConfig.getModel()
                        : "gemini-2.5-flash"
        );

        NewsSummary saved = summaryRepository.saveAndFlush(summary);
        article.setIsAiProcessed(true);
        articleRepository.saveAndFlush(article);

        return saved;
    }

    public SentimentAnalysisResult analyzeArticleSentiment(NewsArticle article) {
        if (article == null) {
            throw new IllegalArgumentException("Bài viết không được để trống");
        }

        String prompt = buildSentimentPrompt(article);
        try {
            if (geminiClient != null) {
                String rawResponse = geminiClient.generateContent(prompt, true);
                if (rawResponse != null && !rawResponse.isBlank()) {
                    return parseSentimentJson(article, rawResponse);
                }
            }
        } catch (Exception e) {
            log.warn("Lỗi khi gọi Gemini phân tích sắc thái bài viết ID '{}' ({}), dùng cơ chế fallback: {}",
                    article.getId(), article.getTitle(), e.getMessage());
        }

        return buildFallbackSentiment(article);
    }

    public String buildSentimentPrompt(NewsArticle article) {
        String safeTitle = sanitizeUntrustedText(article.getTitle());
        String safeSource = article.getSource() != null ? sanitizeUntrustedText(article.getSource().getName()) : "Tổng hợp";
        String safeCategory = article.getCategory() != null ? sanitizeUntrustedText(article.getCategory().getNameVi()) : "Tài chính";
        String safeContent = sanitizeUntrustedText(
                (article.getDescription() != null ? article.getDescription() : "") + "\n"
                        + (article.getContentSnippet() != null ? article.getContentSnippet() : "")
        );

        return PROMPT_TEMPLATE
                .replace("{{TITLE}}", safeTitle)
                .replace("{{SOURCE}}", safeSource)
                .replace("{{CATEGORY}}", safeCategory)
                .replace("{{CONTENT}}", safeContent.isBlank() ? safeTitle : safeContent);
    }

    public SentimentAnalysisResult parseSentimentJson(NewsArticle article, String rawJson) throws Exception {
        String cleanedJson = stripMarkdownCodeFences(rawJson);
        JsonNode root = objectMapper.readTree(cleanedJson);

        String combinedText = (article.getTitle() != null ? article.getTitle() : "") + " "
                + (article.getDescription() != null ? article.getDescription() : "") + " "
                + (article.getContentSnippet() != null ? article.getContentSnippet() : "");

        String sentiment = normalizeSentiment(textOrDefault(root, "sentiment", ""), combinedText);

        String factSummary = textOrDefault(
                root,
                "factSummary",
                article.getTitle() != null ? article.getTitle() : "Sự kiện tài chính ghi nhận từ báo chí."
        );
        String aiOpinion = textOrDefault(
                root,
                "aiOpinion",
                "Diễn biến thông tin tác động lên tâm lý thị trường ngắn hạn; cần lưu ý sắc thái bài viết khác với biến động giá khớp lệnh thực tế."
        );
        String beneficiaries = textOrDefault(
                root,
                "beneficiaries",
                "Các chủ thể có vị thế tài chính thuận chiều với sự kiện trong bài."
        );
        String riskExposed = textOrDefault(
                root,
                "riskExposed",
                "Các chủ thể sử dụng đòn bẩy cao hoặc chịu áp lực chi phí vốn."
        );

        String rawReason = textOrDefault(root, "sentimentReason", "");
        String sentimentReason = rawReason.isEmpty()
                ? "[Dữ kiện bài báo - Fact] " + factSummary
                : (rawReason.contains("[Fact]") || rawReason.contains("[Dữ kiện")
                        ? rawReason
                        : "[Dữ kiện bài báo - Fact] " + rawReason);

        String rawImpact = textOrDefault(root, "impactAnalysis", "");
        String impactAnalysis = formatFactVsOpinionImpact(rawImpact, factSummary, aiOpinion, beneficiaries, riskExposed);

        Set<String> tickers = new LinkedHashSet<>();
        JsonNode tickersNode = root.path("relatedTickers");
        if (tickersNode.isArray()) {
            for (JsonNode item : tickersNode) {
                addValidTicker(tickers, item.asText());
            }
        } else if (tickersNode.isTextual()) {
            for (String part : tickersNode.asText().split("[,;\\s]+")) {
                addValidTicker(tickers, part);
            }
        }
        tickers.addAll(extractTickersFromText(combinedText));

        Set<String> tags = new LinkedHashSet<>();
        JsonNode tagsNode = root.path("tags");
        if (tagsNode.isArray()) {
            for (JsonNode t : tagsNode) {
                String tag = t.asText("").trim();
                if (!tag.isEmpty()) {
                    tags.add(tag.startsWith("#") ? tag : "#" + tag);
                }
            }
        } else if (tagsNode.isTextual() && !tagsNode.asText().isBlank()) {
            for (String part : tagsNode.asText().split("[,\\s]+")) {
                String tag = part.trim();
                if (!tag.isEmpty()) {
                    tags.add(tag.startsWith("#") ? tag : "#" + tag);
                }
            }
        }
        if (tags.isEmpty()) {
            tags.add("#taichinh");
        }

        return new SentimentAnalysisResult(
                sentiment,
                sentimentReason,
                factSummary,
                aiOpinion,
                beneficiaries,
                riskExposed,
                impactAnalysis,
                new ArrayList<>(tickers),
                new ArrayList<>(tags)
        );
    }

    public SentimentAnalysisResult buildFallbackSentiment(NewsArticle article) {
        String combinedText = (article.getTitle() != null ? article.getTitle() : "") + " "
                + (article.getDescription() != null ? article.getDescription() : "") + " "
                + (article.getContentSnippet() != null ? article.getContentSnippet() : "");

        String sentiment = detectHeuristicSentiment(combinedText);
        String factSummary = article.getTitle() != null && !article.getTitle().isBlank()
                ? article.getTitle().trim()
                : "Thông tin kinh tế - tài chính cập nhật.";

        String sentimentReason = switch (sentiment) {
            case "POSITIVE" -> "[Dữ kiện bài báo - Fact] Bài báo ghi nhận kết quả tích cực, tín hiệu tăng trưởng hoặc dòng tiền thuận lợi: " + factSummary;
            case "NEGATIVE" -> "[Dữ kiện bài báo - Fact] Bài báo phản ánh áp lực suy giảm, chi phí tăng hoặc rủi ro thị trường: " + factSummary;
            default -> "[Dữ kiện bài báo - Fact] Bài báo cung cấp số liệu thống kê và thông tin cập nhật đa chiều: " + factSummary;
        };

        String beneficiaries = switch (sentiment) {
            case "POSITIVE" -> "Doanh nghiệp liên quan trực tiếp và nhà đầu tư nắm giữ tài sản cùng nhóm ngành";
            case "NEGATIVE" -> "Nhà đầu tư nắm giữ tỷ trọng tiền mặt/tiết kiệm an toàn";
            default -> "Nhà đầu tư theo chiến lược phân bổ tài sản cân bằng";
        };
        String riskExposed = switch (sentiment) {
            case "POSITIVE" -> "Nhà đầu tư mua đuổi giá cao (FOMO) khi tin tức đã phản ánh vào giá";
            case "NEGATIVE" -> "Doanh nghiệp phụ thuộc vốn vay hoặc nhà đầu tư dùng đòn bẩy tài chính cao";
            default -> "Nhà đầu tư giao dịch ngắn hạn thiếu kỷ luật quản trị rủi ro";
        };
        String aiOpinion = "Sắc thái bài báo chỉ phản ánh góc độ thông tin truyền thông, có thể khác với diễn biến giá thực tế trên sàn giao dịch.";

        String impactAnalysis = formatFactVsOpinionImpact("", factSummary, aiOpinion, beneficiaries, riskExposed);
        List<String> tickers = new ArrayList<>(extractTickersFromText(combinedText));

        return new SentimentAnalysisResult(
                sentiment,
                sentimentReason,
                factSummary,
                aiOpinion,
                beneficiaries,
                riskExposed,
                impactAnalysis,
                tickers,
                List.of("#taichinh", "#phanloaisacthai")
        );
    }

    public Set<String> extractTickersFromText(String text) {
        Set<String> tickers = new LinkedHashSet<>();
        if (text == null || text.isBlank()) {
            return tickers;
        }

        String lower = text.toLowerCase(Locale.ROOT);
        for (Map.Entry<String, String> entry : COMPANY_TO_TICKER.entrySet()) {
            if (lower.contains(entry.getKey())) {
                tickers.add(entry.getValue());
            }
        }

        Matcher matcher = TICKER_TOKEN_PATTERN.matcher(text);
        while (matcher.find()) {
            String token = matcher.group(1);
            if (KNOWN_VN_TICKERS.contains(token)) {
                tickers.add(token);
            }
        }

        return tickers;
    }

    private String formatFactVsOpinionImpact(String rawImpact,
                                             String factSummary,
                                             String aiOpinion,
                                             String beneficiaries,
                                             String riskExposed) {
        if (rawImpact != null && !rawImpact.isBlank()
                && (rawImpact.contains("[Fact]") || rawImpact.contains("Dữ kiện"))
                && (rawImpact.contains("[AI Opinion]") || rawImpact.contains("Nhận định AI"))) {
            return rawImpact.trim();
        }
        return "[Dữ kiện bài báo - Fact] " + factSummary
                + " | [Nhận định AI - Opinion] " + aiOpinion
                + " — Hưởng lợi: " + beneficiaries
                + "; Chịu rủi ro: " + riskExposed + ".";
    }

    private String buildDefaultBulletsJson(NewsArticle article, SentimentAnalysisResult result) {
        List<String> bullets = List.of(
                "Sự kiện chính: " + result.factSummary(),
                "Đối tượng hưởng lợi: " + result.beneficiaries(),
                "Nhận định & Lưu ý rủi ro: " + result.riskExposed()
        );
        try {
            return objectMapper.writeValueAsString(bullets);
        } catch (Exception e) {
            return "[\"" + result.factSummary().replace("\"", "'") + "\"]";
        }
    }

    private String normalizeSentiment(String rawSentiment, String fallbackText) {
        if (rawSentiment != null && !rawSentiment.isBlank()) {
            String upper = rawSentiment.trim().toUpperCase(Locale.ROOT);
            if ("POSITIVE".equals(upper) || "NEGATIVE".equals(upper) || "NEUTRAL".equals(upper)) {
                return upper;
            }
        }
        return detectHeuristicSentiment(fallbackText);
    }

    public String detectHeuristicSentiment(String text) {
        if (text == null || text.isBlank()) {
            return "NEUTRAL";
        }
        String lower = text.toLowerCase(Locale.ROOT);
        int pos = countMatches(lower, "tăng trưởng", "tăng mạnh", "khởi sắc", "vượt dự báo", "lợi nhuận tăng", "mua ròng", "bứt phá", "tích cực", "lập đỉnh", "hồi phục", "hưởng lợi", "ưu đãi");
        int neg = countMatches(lower, "giảm mạnh", "lao dốc", "thua lỗ", "bán ròng", "rủi ro", "suy giảm", "nợ xấu", "tiêu cực", "thủng đáy", "áp lực", "lạm phát tăng", "đình trệ");

        if (pos > neg) {
            return "POSITIVE";
        }
        if (neg > pos) {
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

    private void addValidTicker(Set<String> tickers, String rawTicker) {
        if (rawTicker == null || rawTicker.isBlank()) {
            return;
        }
        String cleaned = rawTicker.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "");
        if (cleaned.length() == 3) {
            tickers.add(cleaned);
        }
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
        map.put("nam kim", "NKG");
        map.put("chứng khoán ssi", "SSI");
        map.put("vndirect", "VND");
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
                    Phân tích sắc thái bài báo tài chính trong thẻ <untrusted_external_news> thành JSON:
                    sentiment (POSITIVE|NEGATIVE|NEUTRAL), sentimentReason, factSummary, aiOpinion,
                    beneficiaries, riskExposed, impactAnalysis, relatedTickers, tags.
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

