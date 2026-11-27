package com.finman.client;

import com.finman.entity.NewsArticle;
import com.finman.entity.NewsCategory;
import com.finman.entity.NewsSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.Normalizer;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class RssFeedParser {

    private static final Logger log = LoggerFactory.getLogger(RssFeedParser.class);
    private static final int CONNECT_TIMEOUT_MS = 10_000;
    private static final int READ_TIMEOUT_MS = 10_000;

    private static final Pattern IMG_SRC_PATTERN = Pattern.compile(
            "<img[^>]+src\\s*=\\s*['\"]([^'\"]+)['\"][^>]*>",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern HTML_TAG_PATTERN = Pattern.compile("<[^>]*>");
    private static final Pattern DIACRITICS_PATTERN = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");

    private static final List<DateTimeFormatter> RSS_DATE_FORMATTERS = List.of(
            DateTimeFormatter.RFC_1123_DATE_TIME,
            DateTimeFormatter.ISO_DATE_TIME,
            DateTimeFormatter.ofPattern("EEE, dd MMM yyyy HH:mm:ss Z", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("EEE, dd MMM yyyy HH:mm:ss zzz", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("EEE, d MMM yyyy HH:mm:ss Z", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm:ss Z", Locale.ENGLISH)
    );

    private static final DateTimeFormatter LOCAL_DATETIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss", Locale.ROOT);

    public List<NewsArticle> fetchArticles(NewsSource source, NewsCategory defaultCategory) {
        if (source == null || source.getRssUrl() == null || source.getRssUrl().isBlank()) {
            return List.of();
        }

        HttpURLConnection connection = null;
        try {
            URI uri = URI.create(source.getRssUrl().trim());
            connection = (HttpURLConnection) uri.toURL().openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(CONNECT_TIMEOUT_MS);
            connection.setReadTimeout(READ_TIMEOUT_MS);
            connection.setInstanceFollowRedirects(true);
            connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (FinMan-NewsCollector/2.0)");
            connection.setRequestProperty("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,application/rss+xml,*/*;q=0.8");
            connection.setRequestProperty("Accept-Language", "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7");

            int status = connection.getResponseCode();
            // Xử lý chuyển hướng nếu máy chủ trả về 301, 302, 307, 308
            if (status == HttpURLConnection.HTTP_MOVED_PERM || status == HttpURLConnection.HTTP_MOVED_TEMP
                    || status == 307 || status == 308) {
                String redirectUrl = connection.getHeaderField("Location");
                if (redirectUrl != null && !redirectUrl.isBlank()) {
                    connection.disconnect();
                    uri = URI.create(redirectUrl.trim());
                    connection = (HttpURLConnection) uri.toURL().openConnection();
                    connection.setRequestMethod("GET");
                    connection.setConnectTimeout(CONNECT_TIMEOUT_MS);
                    connection.setReadTimeout(READ_TIMEOUT_MS);
                    connection.setInstanceFollowRedirects(true);
                    connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (FinMan-NewsCollector/2.0)");
                    connection.setRequestProperty("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,application/rss+xml,*/*;q=0.8");
                    connection.setRequestProperty("Accept-Language", "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7");
                    status = connection.getResponseCode();
                }
            }

            if (status >= 400) {
                log.warn("Nguồn RSS {} ({}) trả về HTTP status {}", source.getName(), source.getRssUrl(), status);
                return List.of();
            }

            try (InputStream inputStream = connection.getInputStream()) {
                return parseInputStream(inputStream, source, defaultCategory);
            }
        } catch (Exception e) {
            log.warn("Không thể thu thập RSS từ nguồn {} ({}): {}",
                    source.getName(), source.getRssUrl(), e.getMessage());
            return List.of();
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    public List<NewsArticle> parseRssXml(String xmlContent, NewsSource source, NewsCategory defaultCategory) {
        if (xmlContent == null || xmlContent.isBlank()) {
            return List.of();
        }
        try (InputStream is = new ByteArrayInputStream(xmlContent.getBytes(StandardCharsets.UTF_8))) {
            return parseInputStream(is, source, defaultCategory);
        } catch (Exception e) {
            log.warn("Lỗi phân tích nội dung XML từ nguồn {}: {}",
                    source != null ? source.getName() : "UNKNOWN", e.getMessage());
            return List.of();
        }
    }

    public List<NewsArticle> parseInputStream(InputStream inputStream, NewsSource source, NewsCategory defaultCategory) {
        List<NewsArticle> articles = new ArrayList<>();
        if (inputStream == null || source == null || defaultCategory == null) {
            return articles;
        }

        try {
            DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
            // Bảo vệ chống tấn công XXE toàn diện trong khi vẫn cho phép DOCTYPE thông thường từ các feed RSS
            dbFactory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", false);
            dbFactory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            dbFactory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            dbFactory.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
            dbFactory.setXIncludeAware(false);
            dbFactory.setExpandEntityReferences(false);
            dbFactory.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
            dbFactory.setXIncludeAware(false);
            dbFactory.setExpandEntityReferences(false);

            DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
            Document doc = dBuilder.parse(inputStream);
            doc.getDocumentElement().normalize();

            NodeList nList = doc.getElementsByTagName("item");
            for (int i = 0; i < nList.getLength(); i++) {
                Node node = nList.item(i);
                if (node.getNodeType() == Node.ELEMENT_NODE) {
                    Element element = (Element) node;

                    String rawTitle = getTagValue(element, "title");
                    String rawLink = getTagValue(element, "link");
                    String rawDescription = getTagValue(element, "description");
                    String pubDateStr = getTagValue(element, "pubDate");
                    String author = getTagValue(element, "author");
                    if (author == null || author.isBlank()) {
                        author = getTagValue(element, "dc:creator");
                    }

                    String cleanTitle = cleanHtml(rawTitle);
                    String cleanLink = rawLink != null ? rawLink.trim() : null;

                    if (cleanTitle == null || cleanTitle.isBlank() || cleanLink == null || cleanLink.isBlank()) {
                        continue;
                    }

                    // Chuẩn hóa ngày xuất bản UTC; bỏ qua bài viết nếu ngày không hợp lệ (không dùng Instant.now())
                    Instant publishedAt = parsePubDate(pubDateStr);
                    if (publishedAt == null) {
                        log.debug("Bỏ qua bài viết '{}' do ngày xuất bản không hợp lệ: {}", cleanTitle, pubDateStr);
                        continue;
                    }

                    String thumbnailUrl = extractThumbnailUrl(element, rawDescription);
                    String cleanDescription = cleanHtml(rawDescription);

                    String normalizedTitle = normalizeTitle(cleanTitle);
                    String sourceKey = source.getId() != null ? String.valueOf(source.getId()) : "0";
                    String titleHash = generateSha256(normalizedTitle + ":" + sourceKey);

                    NewsArticle article = new NewsArticle();
                    article.setSource(source);
                    article.setCategory(defaultCategory);
                    article.setTitle(cleanTitle.length() > 500 ? cleanTitle.substring(0, 500) : cleanTitle);
                    article.setTitleHash(titleHash);
                    article.setDescription(cleanDescription);
                    article.setContentSnippet(cleanDescription);
                    article.setOriginalUrl(cleanLink);
                    article.setThumbnailUrl(thumbnailUrl);
                    article.setAuthor(author != null && !author.isBlank() ? cleanHtml(author) : source.getName());
                    article.setPublishedAt(publishedAt);
                    article.setFetchedAt(Instant.now());
                    article.setIsAiProcessed(false);

                    articles.add(article);
                }
            }
        } catch (Exception e) {
            log.warn("Lỗi phân tích RSS XML từ nguồn {}: {}", source.getName(), e.getMessage());
        }

        return articles;
    }

    private String getTagValue(Element element, String tagName) {
        NodeList nodeList = element.getElementsByTagName(tagName);
        if (nodeList.getLength() > 0) {
            Node node = nodeList.item(0);
            if (node != null) {
                String content = node.getTextContent();
                return content != null ? content.trim() : null;
            }
        }
        return null;
    }

    public String extractThumbnailUrl(Element itemElement, String rawDescription) {
        if (itemElement != null) {
            String[] mediaTags = {"enclosure", "media:content", "media:thumbnail"};
            for (String tag : mediaTags) {
                NodeList nodes = itemElement.getElementsByTagName(tag);
                for (int i = 0; i < nodes.getLength(); i++) {
                    Node node = nodes.item(i);
                    if (node.getNodeType() == Node.ELEMENT_NODE) {
                        Element mediaEl = (Element) node;
                        String url = mediaEl.getAttribute("url");
                        if (isValidHttpUrl(url)) {
                            return url.trim();
                        }
                    }
                }
            }
        }

        if (rawDescription != null && !rawDescription.isBlank()) {
            Matcher matcher = IMG_SRC_PATTERN.matcher(rawDescription);
            if (matcher.find()) {
                String imgUrl = matcher.group(1);
                if (isValidHttpUrl(imgUrl)) {
                    return imgUrl.trim();
                }
            }
        }

        return null;
    }

    private boolean isValidHttpUrl(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }
        String trimmed = url.trim().toLowerCase(Locale.ROOT);
        return trimmed.startsWith("http://") || trimmed.startsWith("https://");
    }

    public String cleanHtml(String html) {
        if (html == null || html.isBlank()) {
            return "";
        }
        String text = html
                .replaceAll("(?is)<script[^>]*>.*?</script>", " ")
                .replaceAll("(?is)<style[^>]*>.*?</style>", " ");
        text = HTML_TAG_PATTERN.matcher(text).replaceAll(" ");
        text = text.replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replace("&quot;", "\"")
                .replace("&#39;", "'")
                .replace("&apos;", "'")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replaceAll("\\s+", " ")
                .trim();
        return text;
    }

    public Instant parsePubDate(String pubDateStr) {
        if (pubDateStr == null || pubDateStr.isBlank()) {
            return null;
        }
        String trimmed = pubDateStr.trim();

        for (DateTimeFormatter formatter : RSS_DATE_FORMATTERS) {
            try {
                return ZonedDateTime.parse(trimmed, formatter).toInstant();
            } catch (Exception ignored) {
                // Thử formatter tiếp theo
            }
        }

        try {
            return Instant.parse(trimmed);
        } catch (Exception ignored) {
            // Không phải định dạng ISO Instant chuẩn
        }

        try {
            LocalDateTime localDateTime = LocalDateTime.parse(trimmed, LOCAL_DATETIME_FORMATTER);
            return localDateTime.toInstant(ZoneOffset.UTC);
        } catch (Exception ignored) {
            // Không khớp định dạng ngày giờ hợp lệ
        }

        return null;
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
