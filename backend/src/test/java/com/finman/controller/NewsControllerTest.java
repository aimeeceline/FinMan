package com.finman.controller;

import com.finman.entity.NewsArticle;
import com.finman.entity.NewsCategory;
import com.finman.entity.NewsSource;
import com.finman.entity.User;
import com.finman.repository.NewsArticleRepository;
import com.finman.repository.NewsCategoryRepository;
import com.finman.repository.NewsSourceRepository;
import com.finman.repository.UserRepository;
import com.finman.repository.UserSavedArticleRepository;
import com.finman.scheduler.NewsIngestionScheduler;
import com.finman.security.JwtTokenProvider;
import com.finman.service.news.NewsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class NewsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private NewsService newsService;

    @Autowired
    private NewsArticleRepository articleRepository;

    @Autowired
    private NewsCategoryRepository categoryRepository;

    @Autowired
    private NewsSourceRepository sourceRepository;

    @Autowired
    private UserSavedArticleRepository savedArticleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private NewsIngestionScheduler newsIngestionScheduler;

    private User testUser;
    private String jwtToken;
    private NewsArticle bankingArticle;
    private NewsArticle stockArticle;

    @BeforeEach
    void setUp() {
        savedArticleRepository.deleteAll();
        articleRepository.deleteAll();
        newsService.ensureDefaultMetadataSeeded();

        testUser = userRepository.save(new User("news_reader@finman.com", "hashed_pw", "News Reader"));
        jwtToken = jwtTokenProvider.generateToken(testUser.getId(), testUser.getEmail());

        NewsSource vnExpress = sourceRepository.findByCode("VNEXPRESS").orElseThrow();
        NewsSource cafeF = sourceRepository.findByCode("CAFEF").orElseThrow();
        NewsCategory bankingCat = categoryRepository.findByCode("BANKING").orElseThrow();
        NewsCategory stockCat = categoryRepository.findByCode("STOCK").orElseThrow();

        bankingArticle = articleRepository.save(new NewsArticle(
                vnExpress,
                bankingCat,
                "Biểu lãi suất ngân hàng thương mại mới nhất tháng 11",
                "hash_banking_001",
                "Nhiều ngân hàng điều chỉnh lãi suất huy động kỳ hạn 6 tháng và 12 tháng.",
                "Nội dung chi tiết về biểu lãi suất ngân hàng...",
                "https://vnexpress.net/lai-suat-thang-11.html",
                "https://vnexpress.net/thumb-banking.jpg",
                "VnExpress",
                Instant.parse("2026-11-05T03:00:00Z")
        ));

        stockArticle = articleRepository.save(new NewsArticle(
                cafeF,
                stockCat,
                "Khối ngoại mua ròng mạnh nhóm cổ phiếu công nghệ FPT trên sàn HOSE",
                "hash_stock_002",
                "Thanh khoản thị trường chứng khoán bùng nổ trong phiên chiều.",
                "Nội dung chi tiết phiên giao dịch chứng khoán...",
                "https://cafef.vn/khoi-ngoai-mua-rong-fpt.chn",
                "https://cafef.vn/thumb-stock.jpg",
                "CafeF",
                Instant.parse("2026-11-05T04:00:00Z")
        ));
    }

    @Test
    @DisplayName("GET /api/v1/news/categories trả về đủ 5 danh mục chuẩn hóa theo thứ tự")
    void testGetCategoriesSuccess() throws Exception {
        mockMvc.perform(get("/api/v1/news/categories")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(5))
                .andExpect(jsonPath("$.data[0].code").value("STOCK"))
                .andExpect(jsonPath("$.data[0].nameVi").value("Chứng khoán"));
    }

    @Test
    @DisplayName("TC_NEWS_03: GET /api/v1/news/articles lọc theo category, source và tìm kiếm từ khóa tiếng Việt")
    void testGetArticlesFilterAndKeywordSearch() throws Exception {
        // 1. Tìm kiếm từ khóa "lãi suất ngân hàng"
        mockMvc.perform(get("/api/v1/news/articles")
                        .param("keyword", "lãi suất ngân hàng")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].id").value(bankingArticle.getId()))
                .andExpect(jsonPath("$.data.content[0].categoryCode").value("BANKING"));

        // 2. Lọc theo categoryCode = STOCK
        mockMvc.perform(get("/api/v1/news/articles")
                        .param("category", "STOCK")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].id").value(stockArticle.getId()))
                .andExpect(jsonPath("$.data.content[0].sourceCode").value("CAFEF"));
    }

    @Test
    @DisplayName("GET /api/v1/news/articles/{id} trả về chi tiết bài viết và báo 404 nếu không tồn tại")
    void testGetArticleByIdSuccessAndNotFound() throws Exception {
        mockMvc.perform(get("/api/v1/news/articles/" + bankingArticle.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(bankingArticle.getId()))
                .andExpect(jsonPath("$.data.title").value(bankingArticle.getTitle()))
                .andExpect(jsonPath("$.data.isSaved").value(false));

        mockMvc.perform(get("/api/v1/news/articles/999999")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("POST & DELETE /api/v1/news/articles/{id}/save lưu và bỏ lưu bài viết theo userId")
    void testSaveAndUnsaveArticleAuthenticated() throws Exception {
        // Chưa đăng nhập -> 401 Unauthorized
        mockMvc.perform(post("/api/v1/news/articles/" + bankingArticle.getId() + "/save")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());

        // Đăng nhập hợp lệ -> Lưu bài viết thành công
        mockMvc.perform(post("/api/v1/news/articles/" + bankingArticle.getId() + "/save")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isSaved").value(true));

        // Kiểm tra danh sách bài viết đã lưu
        mockMvc.perform(get("/api/v1/news/saved")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].id").value(bankingArticle.getId()));

        // Bỏ lưu bài viết
        mockMvc.perform(delete("/api/v1/news/articles/" + bankingArticle.getId() + "/save")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertThat(savedArticleRepository.existsByUserIdAndArticleId(testUser.getId(), bankingArticle.getId())).isFalse();
    }

    @Test
    @DisplayName("NewsIngestionScheduler khởi chạy an toàn không gây lỗi tiến trình")
    void testSchedulerBeanInitialized() {
        assertThat(newsIngestionScheduler).isNotNull();
    }

    @Test
    @DisplayName("POST /api/v1/news/crawl và /api/v1/news/refresh kích hoạt cào tin tức thành công")
    void testTriggerNewsCrawlAndRefresh() throws Exception {
        mockMvc.perform(post("/api/v1/news/crawl")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalArticles").isNumber());

        mockMvc.perform(post("/api/v1/news/refresh")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalArticles").isNumber());
    }
}

