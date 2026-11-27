package com.finman.service.news;

import com.finman.client.NewsApiClient;
import com.finman.client.RssFeedParser;
import com.finman.entity.NewsArticle;
import com.finman.entity.NewsCategory;
import com.finman.entity.NewsSource;
import com.finman.repository.NewsArticleRepository;
import com.finman.repository.NewsCategoryRepository;
import com.finman.repository.NewsSourceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class NewsCollectorService {

    private static final Logger log = LoggerFactory.getLogger(NewsCollectorService.class);

    private final NewsSourceRepository sourceRepository;
    private final NewsCategoryRepository categoryRepository;
    private final NewsArticleRepository articleRepository;
    private final RssFeedParser rssFeedParser;
    private final NewsApiClient newsApiClient;
    private final NewsDeduplicationService deduplicationService;

    @Autowired
    public NewsCollectorService(NewsSourceRepository sourceRepository,
                                NewsCategoryRepository categoryRepository,
                                NewsArticleRepository articleRepository,
                                RssFeedParser rssFeedParser,
                                NewsApiClient newsApiClient,
                                NewsDeduplicationService deduplicationService) {
        this.sourceRepository = sourceRepository;
        this.categoryRepository = categoryRepository;
        this.articleRepository = articleRepository;
        this.rssFeedParser = rssFeedParser;
        this.newsApiClient = newsApiClient != null ? newsApiClient : new NewsApiClient();
        this.deduplicationService = deduplicationService != null
                ? deduplicationService
                : new NewsDeduplicationService(articleRepository);
    }

    public NewsCollectorService(NewsSourceRepository sourceRepository,
                                NewsCategoryRepository categoryRepository,
                                NewsArticleRepository articleRepository,
                                RssFeedParser rssFeedParser) {
        this(sourceRepository, categoryRepository, articleRepository, rssFeedParser,
                new NewsApiClient(), new NewsDeduplicationService(articleRepository));
    }

    @Transactional
    public int collectAndSaveNews() {
        List<NewsSource> activeSources = sourceRepository.findByIsActiveTrue();
        if (activeSources == null || activeSources.isEmpty()) {
            activeSources = sourceRepository.findAll()
                    .stream()
                    .filter(s -> Boolean.TRUE.equals(s.getIsActive()))
                    .toList();
        }

        List<NewsCategory> categories = categoryRepository.findAll();
        if (categories.isEmpty()) {
            log.warn("Chưa có danh mục tin tức nào trong cơ sở dữ liệu.");
            return 0;
        }

        Map<String, NewsCategory> categoryMap = new HashMap<>();
        for (NewsCategory cat : categories) {
            if (cat.getCode() != null) {
                categoryMap.put(cat.getCode().toUpperCase(Locale.ROOT), cat);
            }
        }
        NewsCategory defaultCategory = categories.get(0);

        int savedCount = 0;
        Set<String> batchUrls = new HashSet<>();
        Set<String> batchHashes = new HashSet<>();
        List<String> batchTitles = new ArrayList<>();

        for (NewsSource source : activeSources) {
            try {
                List<NewsArticle> fetchedArticles;
                if (source.getRssUrl() != null && !source.getRssUrl().isBlank()) {
                    fetchedArticles = rssFeedParser.fetchArticles(source, defaultCategory);
                } else {
                    fetchedArticles = newsApiClient.fetchExternalApiArticles(source, defaultCategory);
                }

                if (fetchedArticles == null || fetchedArticles.isEmpty()) {
                    continue;
                }

                for (NewsArticle article : fetchedArticles) {
                    if (article.getTitle() == null || article.getTitle().isBlank()
                            || article.getOriginalUrl() == null || article.getOriginalUrl().isBlank()
                            || article.getPublishedAt() == null) {
                        continue;
                    }

                    String cleanUrl = article.getOriginalUrl().trim();
                    String titleHash = deduplicationService.computeTitleHash(article.getTitle(), source.getId());
                    article.setTitleHash(titleHash);

                    // Kiểm tra trùng lặp trong cùng lô thu thập (in-memory batch check)
                    if (batchUrls.contains(cleanUrl)
                            || batchHashes.contains(titleHash)
                            || deduplicationService.isNearDuplicate(article.getTitle(), batchTitles)) {
                        continue;
                    }

                    // Kiểm tra trùng lặp với database (URL, TitleHash, và Jaccard Similarity > 85%)
                    if (deduplicationService.isDuplicate(article.getTitle(), cleanUrl, source.getId())) {
                        continue;
                    }

                    NewsCategory resolvedCategory = classifyCategory(article, categoryMap, defaultCategory);
                    article.setCategory(resolvedCategory);
                    article.setSource(source);

                    articleRepository.save(article);
                    batchUrls.add(cleanUrl);
                    batchHashes.add(titleHash);
                    batchTitles.add(article.getTitle());
                    savedCount++;
                }
            } catch (Exception e) {
                // Tách biệt lỗi từng nguồn: lỗi nguồn này không làm dừng nguồn khác
                log.warn("Lỗi khi thu thập tin tức từ nguồn {}: {}", source.getName(), e.getMessage());
            }
        }

        return savedCount;
    }

    public NewsCategory classifyCategory(NewsArticle article,
                                         Map<String, NewsCategory> categoryMap,
                                         NewsCategory defaultCategory) {
        if (categoryMap == null || categoryMap.isEmpty()) {
            return defaultCategory;
        }
        String combined = ((article.getTitle() != null ? article.getTitle() : "") + " "
                + (article.getDescription() != null ? article.getDescription() : "")).toLowerCase(Locale.ROOT);

        if (containsAny(combined, "cổ phiếu", "vn-index", "vnindex", "hnx", "chứng khoán", "hose", "cổ tức", "upcom")) {
            return categoryMap.getOrDefault("STOCK", defaultCategory);
        }
        if (containsAny(combined, "lãi suất", "ngân hàng", "tín dụng", "tiền gửi", "nhnn", "tỷ giá", "trái phiếu")) {
            return categoryMap.getOrDefault("BANKING", defaultCategory);
        }
        if (containsAny(combined, "gdp", "lạm phát", "cpi", "vĩ mô", "xuất khẩu", "fdi", "fed", "kinh tế")) {
            return categoryMap.getOrDefault("MACRO", defaultCategory);
        }
        if (containsAny(combined, "giá vàng", "bất động sản", "nhà đất", "đầu tư", "quỹ mở", "crypto", "dầu thô")) {
            return categoryMap.getOrDefault("INVESTMENT", defaultCategory);
        }
        if (containsAny(combined, "chi tiêu", "tiết kiệm", "thuế thu nhập", "tài chính cá nhân", "lương", "bảo hiểm")) {
            return categoryMap.getOrDefault("PERSONAL_FINANCE", defaultCategory);
        }

        return defaultCategory;
    }

    private boolean containsAny(String text, String... keywords) {
        for (String kw : keywords) {
            if (text.contains(kw)) {
                return true;
            }
        }
        return false;
    }
}
