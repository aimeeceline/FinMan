package com.finman.controller;

import com.finman.dto.response.ApiResponse;
import com.finman.dto.response.NewsArticleResponse;
import com.finman.entity.NewsCategory;
import com.finman.entity.NewsSource;
import com.finman.entity.NewsSummary;
import com.finman.exception.UnauthorizedException;
import com.finman.security.UserPrincipal;
import com.finman.service.ai.NewsAiService;
import com.finman.service.news.NewsCollectorService;
import com.finman.service.news.NewsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/news")
public class NewsController {

    private final NewsService newsService;
    private final NewsAiService newsAiService;
    private final NewsCollectorService newsCollectorService;

    @Autowired
    public NewsController(NewsService newsService, NewsAiService newsAiService, NewsCollectorService newsCollectorService) {
        this.newsService = newsService;
        this.newsAiService = newsAiService;
        this.newsCollectorService = newsCollectorService;
    }

    public NewsController(NewsService newsService, NewsAiService newsAiService) {
        this(newsService, newsAiService, null);
    }

    public NewsController(NewsService newsService) {
        this(newsService, null, null);
    }

    @PostMapping({"/crawl", "/refresh"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> crawlNews() {
        int savedCount = 0;
        if (newsCollectorService != null) {
            newsService.ensureDefaultMetadataSeeded();
            savedCount = newsCollectorService.collectAndSaveNews();
        }
        long totalArticles = newsService.getTotalArticleCount();
        Map<String, Object> result = Map.of(
                "savedCount", savedCount,
                "totalArticles", totalArticles,
                "timestamp", Instant.now().toString()
        );
        return ResponseEntity.ok(ApiResponse.success(result,
                "Cập nhật tin tức thành công. Lưu mới " + savedCount + " bài viết."));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<NewsCategory>>> getCategories() {
        List<NewsCategory> categories = newsService.getCategories();
        return ResponseEntity.ok(ApiResponse.success(categories, "Lấy danh mục tin tức thành công"));
    }

    @GetMapping("/sources")
    public ResponseEntity<ApiResponse<List<NewsSource>>> getSources() {
        List<NewsSource> sources = newsService.getActiveSources();
        return ResponseEntity.ok(ApiResponse.success(sources, "Lấy danh sách nguồn tin thành công"));
    }

    @GetMapping("/articles")
    public ResponseEntity<ApiResponse<Page<NewsArticleResponse>>> getArticles(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String categoryCode,
            @RequestParam(required = false) Long sourceId,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) String sourceCode,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @PageableDefault(size = 12, sort = "publishedAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Long currentUserId = userPrincipal != null ? userPrincipal.getId() : null;
        String resolvedCategoryCode = categoryCode != null ? categoryCode : category;
        String resolvedSourceCode = sourceCode != null ? sourceCode : source;
        String resolvedKeyword = keyword != null ? keyword : search;
        LocalDate resolvedFromDate = fromDate != null ? fromDate : date;
        LocalDate resolvedToDate = toDate != null ? toDate : date;

        if (newsService.getTotalArticleCount() == 0 && newsCollectorService != null) {
            try {
                newsService.ensureDefaultMetadataSeeded();
                newsCollectorService.collectAndSaveNews();
            } catch (Exception ignored) {
            }
        }

        Page<NewsArticleResponse> page = newsService.getArticles(
                currentUserId,
                categoryId,
                resolvedCategoryCode,
                sourceId,
                resolvedSourceCode,
                resolvedKeyword,
                resolvedFromDate,
                resolvedToDate,
                pageable
        );
        return ResponseEntity.ok(ApiResponse.success(page, "Lấy danh sách bài viết thành công"));
    }

    @GetMapping("/articles/{id}")
    public ResponseEntity<ApiResponse<NewsArticleResponse>> getArticleById(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "false") boolean summarize) {
        Long currentUserId = userPrincipal != null ? userPrincipal.getId() : null;
        if (summarize && newsAiService != null) {
            newsAiService.summarizeArticle(id);
        }
        NewsArticleResponse article = newsService.getArticleById(currentUserId, id);
        return ResponseEntity.ok(ApiResponse.success(article, "Lấy chi tiết bài viết thành công"));
    }

    @PostMapping("/articles/{id}/summarize")
    public ResponseEntity<ApiResponse<NewsArticleResponse>> summarizeArticle(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id) {
        Long currentUserId = userPrincipal != null ? userPrincipal.getId() : null;
        if (newsAiService != null) {
            NewsSummary summary = newsAiService.summarizeArticle(id);
            NewsArticleResponse article = newsService.getArticleById(currentUserId, id);
            article.setBulletPoints(summary.getBulletPoints());
            article.setSentiment(summary.getSentiment());
            article.setSentimentReason(summary.getSentimentReason());
            article.setImpactAnalysis(summary.getImpactAnalysis());
            article.setRelatedTickers(summary.getRelatedTickers());
            article.setTags(summary.getTags());
            article.setIsAiProcessed(true);
            return ResponseEntity.ok(ApiResponse.success(article, "Tóm tắt bài viết bằng AI thành công"));
        }
        NewsArticleResponse article = newsService.getArticleById(currentUserId, id);
        return ResponseEntity.ok(ApiResponse.success(article, "Lấy thông tin tóm tắt bài viết thành công"));
    }

    @PostMapping("/articles/{id}/save")
    public ResponseEntity<ApiResponse<NewsArticleResponse>> saveArticle(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id) {
        validateUser(userPrincipal);
        NewsArticleResponse response = newsService.saveArticle(userPrincipal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã lưu bài viết vào danh sách cá nhân"));
    }

    @DeleteMapping("/articles/{id}/save")
    public ResponseEntity<ApiResponse<Void>> unsaveArticle(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id) {
        validateUser(userPrincipal);
        newsService.unsaveArticle(userPrincipal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã bỏ lưu bài viết khỏi danh sách cá nhân"));
    }

    @GetMapping("/saved")
    public ResponseEntity<ApiResponse<Page<NewsArticleResponse>>> getSavedArticles(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PageableDefault(size = 12) Pageable pageable) {
        validateUser(userPrincipal);
        Page<NewsArticleResponse> page = newsService.getSavedArticles(userPrincipal.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(page, "Lấy danh sách bài viết đã lưu thành công"));
    }

    private void validateUser(UserPrincipal userPrincipal) {
        if (userPrincipal == null || userPrincipal.getId() == null) {
            throw new UnauthorizedException("Yêu cầu không được xác thực. Vui lòng đăng nhập lại.");
        }
    }
}

