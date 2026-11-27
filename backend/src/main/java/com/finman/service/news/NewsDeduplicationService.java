package com.finman.service.news;

import com.finman.entity.NewsArticle;
import com.finman.repository.NewsArticleRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.Normalizer;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class NewsDeduplicationService {

    public static final double JACCARD_SIMILARITY_THRESHOLD = 0.85;
    private static final int RECENT_DAYS_WINDOW = 7;
    private static final int MAX_RECENT_ARTICLES_CHECK = 200;
    private static final Pattern DIACRITICS_PATTERN = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");

    private final NewsArticleRepository articleRepository;

    public NewsDeduplicationService(NewsArticleRepository articleRepository) {
        this.articleRepository = articleRepository;
    }

    /**
     * Kiểm tra bài viết có bị trùng lặp hay không dựa trên:
     * 1. Exact match original_url
     * 2. Exact match title_hash = SHA-256(normalized_title + ":" + source_id)
     * 3. Near-duplicate qua độ tương đồng Jaccard > 85% với các bài viết gần đây
     */
    public boolean isDuplicate(String rawTitle, String originalUrl, Long sourceId) {
        if (rawTitle == null || rawTitle.isBlank()) {
            return true;
        }

        if (originalUrl != null && !originalUrl.isBlank()
                && articleRepository.existsByOriginalUrl(originalUrl.trim())) {
            return true;
        }

        String titleHash = computeTitleHash(rawTitle, sourceId);
        if (articleRepository.existsByTitleHash(titleHash)) {
            return true;
        }

        Instant since = Instant.now().minus(RECENT_DAYS_WINDOW, ChronoUnit.DAYS);
        List<NewsArticle> recentArticles = articleRepository.findRecentArticles(
                since, PageRequest.of(0, MAX_RECENT_ARTICLES_CHECK)
        );
        if (recentArticles != null && !recentArticles.isEmpty()) {
            for (NewsArticle existing : recentArticles) {
                if (existing.getTitle() != null
                        && calculateJaccardSimilarity(rawTitle, existing.getTitle()) > JACCARD_SIMILARITY_THRESHOLD) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Kiểm tra độ tương đồng Jaccard > 85% với một danh sách tiêu đề bất kỳ (hỗ trợ kiểm tra theo lô).
     */
    public boolean isNearDuplicate(String rawTitle, Collection<String> existingTitles) {
        if (rawTitle == null || rawTitle.isBlank() || existingTitles == null || existingTitles.isEmpty()) {
            return false;
        }
        for (String existing : existingTitles) {
            if (calculateJaccardSimilarity(rawTitle, existing) > JACCARD_SIMILARITY_THRESHOLD) {
                return true;
            }
        }
        return false;
    }

    /**
     * Tính độ tương đồng Jaccard giữa 2 tiêu đề sau khi đã chuẩn hóa từ vựng tiếng Việt.
     */
    public double calculateJaccardSimilarity(String title1, String title2) {
        String norm1 = normalizeTitle(title1);
        String norm2 = normalizeTitle(title2);

        if (norm1.isEmpty() || norm2.isEmpty()) {
            return 0.0;
        }
        if (norm1.equals(norm2)) {
            return 1.0;
        }

        Set<String> tokens1 = new HashSet<>(Arrays.asList(norm1.split("\\s+")));
        Set<String> tokens2 = new HashSet<>(Arrays.asList(norm2.split("\\s+")));

        Set<String> intersection = new HashSet<>(tokens1);
        intersection.retainAll(tokens2);

        Set<String> union = new HashSet<>(tokens1);
        union.addAll(tokens2);

        if (union.isEmpty()) {
            return 0.0;
        }
        return (double) intersection.size() / union.size();
    }

    /**
     * Tính mã băm chuẩn hóa theo định dạng SHA-256(normalized_title + ":" + source_id).
     */
    public String computeTitleHash(String rawTitle, Long sourceId) {
        String normalizedTitle = normalizeTitle(rawTitle);
        String sourceKey = sourceId != null ? String.valueOf(sourceId) : "0";
        return generateSha256(normalizedTitle + ":" + sourceKey);
    }

    /**
     * Chuẩn hóa tiêu đề tiếng Việt: bỏ dấu thanh, chuyển đ/Đ -> d, chữ thường, chỉ giữ chữ cái và số.
     */
    public String normalizeTitle(String title) {
        if (title == null || title.isBlank()) {
            return "";
        }
        String temp = title.replace('đ', 'd').replace('Đ', 'D');
        temp = Normalizer.normalize(temp, Normalizer.Form.NFD);
        temp = DIACRITICS_PATTERN.matcher(temp).replaceAll("");
        temp = temp.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
        return temp;
    }

    public String generateSha256(String base) {
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
