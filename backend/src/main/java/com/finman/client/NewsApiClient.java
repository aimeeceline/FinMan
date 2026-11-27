package com.finman.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.finman.entity.NewsArticle;
import com.finman.entity.NewsCategory;
import com.finman.entity.NewsSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.Normalizer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Component
public class NewsApiClient {

    private static final Logger log = LoggerFactory.getLogger(NewsApiClient.class);
    private static final int CONNECT_TIMEOUT_MS = 10_000;
    private static final int READ_TIMEOUT_MS = 10_000;
    private static final Pattern HTML_TAG_PATTERN = Pattern.compile("<[^>]*>");
    private static final Pattern DIACRITICS_PATTERN = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");

    private final ObjectMapper objectMapper;

    @Value("${newsapi.api-key:}")
    private String apiKey;

    @Value("${newsapi.base-url:https://newsapi.org/v2/top-headlines?category=business&language=en}")
    private String apiUrl;

    public NewsApiClient() {
        this.objectMapper = new ObjectMapper();
    }

    public NewsApiClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    public List<NewsArticle> fetchExternalApiArticles(NewsSource source, NewsCategory defaultCategory) {
        if (source == null || defaultCategory == null) {
            return List.of();
        }
        if (apiKey == null || apiKey.isBlank()) {
            log.debug("NewsAPI key chưa được cấu hình, bỏ qua thu thập từ nguồn {}", source.getName());
            return List.of();
        }

        HttpURLConnection connection = null;
        try {
            URI uri = URI.create(apiUrl);
            connection = (HttpURLConnection) uri.toURL().openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(CONNECT_TIMEOUT_MS);
            connection.setReadTimeout(READ_TIMEOUT_MS);
            connection.setRequestProperty("X-Api-Key", apiKey.trim());
            connection.setRequestProperty("Accept", "application/json");
            connection.setRequestProperty("User-Agent", "FinMan-NewsCollector/2.0");

            int status = connection.getResponseCode();
            if (status == 429) {
                log.warn("Nguồn NewsAPI ({}) trả về HTTP 429 Too Many Requests — tạm ngắt thu thập kỳ này.", source.getName());
                return List.of();
            }
            if (status >= 400) {
                log.warn("Nguồn NewsAPI ({}) trả về lỗi HTTP status {}", source.getName(), status);
                return List.of();
            }

            try (InputStream is = connection.getInputStream()) {
                String jsonBody = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                return parseNewsApiResponse(jsonBody, source, defaultCategory);
            }
        } catch (Exception e) {
            log.warn("Lỗi kết nối NewsAPI từ nguồn {}: {}", source.getName(), e.getMessage());
            return List.of();
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    public List<NewsArticle> parseNewsApiResponse(String jsonBody, NewsSource source, NewsCategory defaultCategory) {
        List<NewsArticle> articles = new ArrayList<>();
        if (jsonBody == null || jsonBody.isBlank() || source == null || defaultCategory == null) {
            return articles;
        }

        try {
            JsonNode root = objectMapper.readTree(jsonBody);
            JsonNode items = root.path("articles");
            if (!items.isArray()) {
                return articles;
            }

            for (JsonNode item : items) {
                String rawTitle = textOrNull(item, "title");
                String rawUrl = textOrNull(item, "url");
                String rawDesc = textOrNull(item, "description");
                String rawContent = textOrNull(item, "content");
                String rawThumb = textOrNull(item, "urlToImage");
                String rawAuthor = textOrNull(item, "author");
                String publishedAtStr = textOrNull(item, "publishedAt");

                String cleanTitle = cleanHtml(rawTitle);
                if (cleanTitle.isEmpty() || "[Removed]".equalsIgnoreCase(cleanTitle)
                        || rawUrl == null || rawUrl.isBlank()) {
                    continue;
                }

                Instant publishedAt = parseIsoInstant(publishedAtStr);
                if (publishedAt == null) {
                    continue;
                }

                String cleanDesc = cleanHtml(rawDesc);
                String cleanSnippet = rawContent != null && !rawContent.isBlank() ? cleanHtml(rawContent) : cleanDesc;
                String normalizedTitle = normalizeTitle(cleanTitle);
                String sourceKey = source.getId() != null ? String.valueOf(source.getId()) : "0";
                String titleHash = generateSha256(normalizedTitle + ":" + sourceKey);

                NewsArticle article = new NewsArticle();
                article.setSource(source);
                article.setCategory(defaultCategory);
                article.setTitle(cleanTitle.length() > 500 ? cleanTitle.substring(0, 500) : cleanTitle);
                article.setTitleHash(titleHash);
                article.setDescription(cleanDesc);
                article.setContentSnippet(cleanSnippet);
                article.setOriginalUrl(rawUrl.trim());
                if (rawThumb != null && (rawThumb.startsWith("http://") || rawThumb.startsWith("https://"))) {
                    article.setThumbnailUrl(rawThumb.trim());
                }
                article.setAuthor(rawAuthor != null && !rawAuthor.isBlank() ? cleanHtml(rawAuthor) : source.getName());
                article.setPublishedAt(publishedAt);
                article.setFetchedAt(Instant.now());
                article.setIsAiProcessed(false);

                articles.add(article);
            }
        } catch (Exception e) {
            log.warn("Lỗi phân tích phản hồi JSON từ NewsAPI: {}", e.getMessage());
        }

        return articles;
    }

    private String textOrNull(JsonNode node, String field) {
        JsonNode child = node.get(field);
        if (child != null && !child.isNull()) {
            String text = child.asText();
            return text != null && !text.isBlank() ? text.trim() : null;
        }
        return null;
    }

    private Instant parseIsoInstant(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(dateStr.trim());
        } catch (Exception e) {
            return null;
        }
    }

    private String cleanHtml(String html) {
        if (html == null || html.isBlank()) {
            return "";
        }
        return HTML_TAG_PATTERN.matcher(html)
                .replaceAll(" ")
                .replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replace("&quot;", "\"")
                .replace("&#39;", "'")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String normalizeTitle(String title) {
        if (title == null || title.isBlank()) {
            return "";
        }
        String temp = title.replace('đ', 'd').replace('Đ', 'D');
        temp = Normalizer.normalize(temp, Normalizer.Form.NFD);
        temp = DIACRITICS_PATTERN.matcher(temp).replaceAll("");
        return temp.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String generateSha256(String base) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(base.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception ex) {
            throw new RuntimeException("Lỗi khởi tạo thuật toán SHA-256", ex);
        }
    }
}
