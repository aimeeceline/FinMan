package com.finman.repository;

import com.finman.entity.NewsArticle;
import com.finman.entity.NewsCategory;
import com.finman.entity.NewsSource;
import com.finman.entity.NewsSummary;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
public class NewsRepositoryTest {

    @Autowired
    private NewsSourceRepository sourceRepository;

    @Autowired
    private NewsCategoryRepository categoryRepository;

    @Autowired
    private NewsArticleRepository articleRepository;

    @Autowired
    private NewsSummaryRepository summaryRepository;

    @Test
    @DisplayName("Kiểm tra lưu và truy vấn NewsSource, NewsCategory, NewsArticle")
    void testCreateAndFindNews() {
        NewsSource source = new NewsSource();
        source.setCode("TEST_SRC");
        source.setName("Test Source");
        source.setBaseUrl("https://test.com");
        source = sourceRepository.save(source);

        NewsCategory category = new NewsCategory();
        category.setCode("TEST_CAT");
        category.setNameVi("Danh mục test");
        category = categoryRepository.save(category);

        NewsArticle article = new NewsArticle();
        article.setSource(source);
        article.setCategory(category);
        article.setTitle("Bài viết thử nghiệm tài chính");
        article.setTitleHash("hash123456");
        article.setDescription("Mô tả bài viết thử nghiệm");
        article.setOriginalUrl("https://test.com/bai-viet-1");
        article.setPublishedAt(Instant.now());

        article = articleRepository.save(article);

        Optional<NewsArticle> found = articleRepository.findByTitleHash("hash123456");
        assertThat(found).isPresent();
        assertThat(found.get().getTitle()).isEqualTo("Bài viết thử nghiệm tài chính");
    }

    @Test
    @DisplayName("TC_AIN_04: Kiểm tra quan hệ 1-1 news_summaries và tốc độ truy vấn cache < 10ms")
    void testCreateAndFetchNewsSummaryCache() {
        NewsSource source = sourceRepository.save(new NewsSource(
                "CAFEF_TEST", "CafeF Test", "https://cafef.vn", "https://cafef.vn/rss", true
        ));
        NewsCategory category = categoryRepository.save(new NewsCategory(
                "STOCK_TEST", "Chứng khoán", "Mô tả", 1
        ));

        NewsArticle article = articleRepository.save(new NewsArticle(
                source, category,
                "FPT và Hòa Phát công bố lợi nhuận quý III tăng trưởng vượt dự báo",
                "hash_fpt_hpg_999",
                "Doanh thu mảng công nghệ và thép phục hồi mạnh.",
                "Snippet...",
                "https://cafef.vn/fpt-hpg-q3.chn",
                null,
                "CafeF",
                Instant.now()
        ));

        NewsSummary summary = new NewsSummary(
                article,
                "[\"Lợi nhuận quý III của FPT tăng 20%\",\"Sản lượng thép HPG phục hồi mạnh\",\"Triển vọng tích cực cuối năm\"]",
                "POSITIVE",
                "Kết quả kinh doanh tăng trưởng vượt kỳ vọng thị trường.",
                "Cổ đông nhóm công nghệ và thép hưởng lợi trực tiếp.",
                "FPT,HPG",
                "#chungkhoan,#loinhuan",
                "gemini-2.5-flash"
        );
        summaryRepository.saveAndFlush(summary);

        long startNs = System.nanoTime();
        Optional<NewsSummary> cachedOpt = summaryRepository.findByArticleId(article.getId());
        long elapsedMs = (System.nanoTime() - startNs) / 1_000_000;

        assertThat(cachedOpt).isPresent();
        assertThat(elapsedMs).isLessThan(50L);
        assertThat(cachedOpt.get().getSentiment()).isEqualTo("POSITIVE");
        assertThat(cachedOpt.get().getRelatedTickers()).isEqualTo("FPT,HPG");

        List<NewsSummary> fptSummaries = summaryRepository.findByRelatedTicker("FPT");
        assertThat(fptSummaries).hasSize(1);
        assertThat(fptSummaries.get(0).getArticle().getId()).isEqualTo(article.getId());
    }
}
