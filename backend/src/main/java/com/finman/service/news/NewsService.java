package com.finman.service.news;

import com.finman.dto.response.NewsArticleResponse;
import com.finman.entity.NewsArticle;
import com.finman.entity.NewsCategory;
import com.finman.entity.NewsSource;
import com.finman.entity.NewsSummary;
import com.finman.entity.User;
import com.finman.entity.UserSavedArticle;
import com.finman.exception.ResourceNotFoundException;
import com.finman.repository.NewsArticleRepository;
import com.finman.repository.NewsCategoryRepository;
import com.finman.repository.NewsSourceRepository;
import com.finman.repository.NewsSummaryRepository;
import com.finman.repository.UserRepository;
import com.finman.repository.UserSavedArticleRepository;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
public class NewsService {

    private final NewsArticleRepository articleRepository;
    private final NewsCategoryRepository categoryRepository;
    private final NewsSourceRepository sourceRepository;
    private final UserSavedArticleRepository savedArticleRepository;
    private final UserRepository userRepository;
    private final NewsSummaryRepository summaryRepository;

    @Autowired
    public NewsService(NewsArticleRepository articleRepository,
                       NewsCategoryRepository categoryRepository,
                       NewsSourceRepository sourceRepository,
                       UserSavedArticleRepository savedArticleRepository,
                       UserRepository userRepository,
                       NewsSummaryRepository summaryRepository) {
        this.articleRepository = articleRepository;
        this.categoryRepository = categoryRepository;
        this.sourceRepository = sourceRepository;
        this.savedArticleRepository = savedArticleRepository;
        this.userRepository = userRepository;
        this.summaryRepository = summaryRepository;
    }

    public NewsService(NewsArticleRepository articleRepository,
                       NewsCategoryRepository categoryRepository,
                       NewsSourceRepository sourceRepository,
                       UserSavedArticleRepository savedArticleRepository,
                       UserRepository userRepository) {
        this(articleRepository, categoryRepository, sourceRepository, savedArticleRepository, userRepository, null);
    }

    @Transactional
    public void ensureDefaultMetadataSeeded() {
        if (categoryRepository.count() == 0) {
            List<NewsCategory> defaults = List.of(
                    new NewsCategory("STOCK", "Chứng khoán", "Tin tức thị trường chứng khoán, doanh nghiệp niêm yết, báo cáo tài chính", 1),
                    new NewsCategory("MACRO", "Kinh tế vĩ mô", "Tin tức kinh tế vĩ mô, GDP, CPI, lạm phát, chính sách tiền tệ", 2),
                    new NewsCategory("BANKING", "Ngân hàng & Lãi suất", "Thông tin hệ thống ngân hàng, lãi suất tiền gửi, lãi suất vay", 3),
                    new NewsCategory("INVESTMENT", "Đầu tư", "Thị trường bất động sản, vàng, ngoại hối, kênh đầu tư tài sản", 4),
                    new NewsCategory("PERSONAL_FINANCE", "Tài chính cá nhân", "Kiến thức chi tiêu, tiết kiệm, thuế, quản lý tài chính gia đình", 5)
            );
            for (NewsCategory cat : defaults) {
                if (!categoryRepository.existsByCode(cat.getCode())) {
                    categoryRepository.save(cat);
                }
            }
        }

        if (sourceRepository.count() == 0 || sourceRepository.count() < 7) {
            List<NewsSource> defaultSources = List.of(
                    new NewsSource("VNEXPRESS", "VnExpress Kinh Doanh", "https://vnexpress.net/kinh-doanh", "https://vnexpress.net/rss/kinh-doanh.rss", true),
                    new NewsSource("VNEXPRESS_CK", "VnExpress Chứng Khoán", "https://vnexpress.net/kinh-doanh/chung-khoan", "https://vnexpress.net/rss/kinh-doanh/chung-khoan.rss", true),
                    new NewsSource("CAFEF", "CafeF Tài Chính Ngân Hàng", "https://cafef.vn/tai-chinh-ngan-hang.chn", "https://cafef.vn/tai-chinh-ngan-hang.rss", true),
                    new NewsSource("CAFEF_CK", "CafeF Chứng Khoán", "https://cafef.vn/thi-truong-chung-khoan.chn", "https://cafef.vn/thi-truong-chung-khoan.rss", true),
                    new NewsSource("VIETSTOCK", "Vietstock Tài Chính", "https://vietstock.vn/tai-chinh.htm", "https://vietstock.vn/rss/tai-chinh.rss", true),
                    new NewsSource("VIETSTOCK_CK", "Vietstock Chứng Khoán", "https://vietstock.vn/chung-khoan.htm", "https://vietstock.vn/rss/chung-khoan.rss", true),
                    new NewsSource("VNECO", "VnEconomy Tài Chính", "https://vneconomy.vn/tai-chinh.htm", "https://vneconomy.vn/tai-chinh.rss", true),
                    new NewsSource("NEWSAPI", "NewsAPI Global", "https://newsapi.org", null, true)
            );
            for (NewsSource src : defaultSources) {
                if (!sourceRepository.existsByCode(src.getCode())) {
                    sourceRepository.save(src);
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public long getTotalArticleCount() {
        return articleRepository.count();
    }

    @Transactional
    public List<NewsCategory> getCategories() {
        ensureDefaultMetadataSeeded();
        return categoryRepository.findAllByOrderByDisplayOrderAsc();
    }

    @Transactional
    public List<NewsSource> getActiveSources() {
        ensureDefaultMetadataSeeded();
        return sourceRepository.findByIsActiveTrue();
    }

    @Transactional(readOnly = true)
    public Page<NewsArticleResponse> getArticles(Long currentUserId,
                                                 Long categoryId,
                                                 String categoryCode,
                                                 Long sourceId,
                                                 String sourceCode,
                                                 String keyword,
                                                 LocalDate fromDate,
                                                 LocalDate toDate,
                                                 Pageable pageable) {
        Specification<NewsArticle> spec = (root, query, cb) -> {
            if (query != null && Long.class != query.getResultType() && long.class != query.getResultType()) {
                root.fetch("source", JoinType.LEFT);
                root.fetch("category", JoinType.LEFT);
            }

            List<Predicate> predicates = new ArrayList<>();

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            } else if (categoryCode != null && !categoryCode.isBlank() && !"ALL".equalsIgnoreCase(categoryCode.trim())) {
                predicates.add(cb.equal(
                        cb.upper(root.get("category").get("code")),
                        categoryCode.trim().toUpperCase(Locale.ROOT)
                ));
            }

            if (sourceId != null) {
                predicates.add(cb.equal(root.get("source").get("id"), sourceId));
            } else if (sourceCode != null && !sourceCode.isBlank() && !"ALL".equalsIgnoreCase(sourceCode.trim())) {
                predicates.add(cb.equal(
                        cb.upper(root.get("source").get("code")),
                        sourceCode.trim().toUpperCase(Locale.ROOT)
                ));
            }

            if (fromDate != null) {
                Instant fromInstant = fromDate.atStartOfDay(ZoneOffset.UTC).toInstant();
                predicates.add(cb.greaterThanOrEqualTo(root.get("publishedAt"), fromInstant));
            }

            if (toDate != null) {
                Instant toInstant = toDate.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
                predicates.add(cb.lessThan(root.get("publishedAt"), toInstant));
            }

            if (keyword != null && !keyword.isBlank()) {
                String[] tokens = keyword.trim().toLowerCase(Locale.ROOT).split("\\s+");
                for (String token : tokens) {
                    if (token.isBlank()) {
                        continue;
                    }
                    String pattern = "%" + token + "%";
                    Predicate titleMatch = cb.like(cb.lower(root.get("title")), pattern);
                    Predicate descMatch = cb.and(
                            cb.isNotNull(root.get("description")),
                            cb.like(cb.lower(root.get("description")), pattern)
                    );
                    predicates.add(cb.or(titleMatch, descMatch));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<NewsArticle> page = articleRepository.findAll(spec, pageable);
        Map<Long, NewsSummary> summaryMap = new HashMap<>();
        if (summaryRepository != null && !page.isEmpty()) {
            List<Long> articleIds = page.getContent().stream().map(NewsArticle::getId).toList();
            for (NewsSummary s : summaryRepository.findByArticleIdIn(articleIds)) {
                if (s.getArticle() != null && s.getArticle().getId() != null) {
                    summaryMap.put(s.getArticle().getId(), s);
                }
            }
        }

        return page.map(article -> {
            boolean saved = currentUserId != null
                    && savedArticleRepository.existsByUserIdAndArticleId(currentUserId, article.getId());
            return NewsArticleResponse.fromEntity(article, saved, summaryMap.get(article.getId()));
        });
    }

    @Transactional(readOnly = true)
    public NewsArticleResponse getArticleById(Long currentUserId, Long articleId) {
        NewsArticle article = articleRepository.findById(articleId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết với ID: " + articleId));

        boolean saved = currentUserId != null
                && savedArticleRepository.existsByUserIdAndArticleId(currentUserId, article.getId());
        NewsSummary summary = summaryRepository != null
                ? summaryRepository.findByArticleId(articleId).orElse(null)
                : null;
        return NewsArticleResponse.fromEntity(article, saved, summary);
    }

    @Transactional(readOnly = true)
    public Optional<NewsSummary> getCachedSummary(Long articleId) {
        if (summaryRepository == null || articleId == null) {
            return Optional.empty();
        }
        return summaryRepository.findByArticleId(articleId);
    }

    @Transactional
    public NewsArticleResponse saveArticle(Long userId, Long articleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        NewsArticle article = articleRepository.findById(articleId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết với ID: " + articleId));

        if (!savedArticleRepository.existsByUserIdAndArticleId(userId, articleId)) {
            UserSavedArticle savedArticle = new UserSavedArticle(user, article);
            savedArticleRepository.save(savedArticle);
        }

        return NewsArticleResponse.fromEntity(article, true);
    }

    @Transactional
    public void unsaveArticle(Long userId, Long articleId) {
        if (!articleRepository.existsById(articleId)) {
            throw new ResourceNotFoundException("Không tìm thấy bài viết với ID: " + articleId);
        }
        savedArticleRepository.deleteByUserIdAndArticleId(userId, articleId);
    }

    @Transactional(readOnly = true)
    public Page<NewsArticleResponse> getSavedArticles(Long userId, Pageable pageable) {
        Page<UserSavedArticle> savedPage = savedArticleRepository.findByUserIdOrderBySavedAtDesc(userId, pageable);
        return savedPage.map(saved -> NewsArticleResponse.fromEntity(saved.getArticle(), true));
    }
}

