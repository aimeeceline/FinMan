package com.finman.service.news;

import com.finman.client.NewsApiClient;
import com.finman.client.RssFeedParser;
import com.finman.entity.NewsArticle;
import com.finman.entity.NewsCategory;
import com.finman.entity.NewsSource;
import com.finman.repository.NewsArticleRepository;
import com.finman.repository.NewsCategoryRepository;
import com.finman.repository.NewsSourceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class NewsIngestionAndDeduplicationTest {

    @Autowired
    private NewsSourceRepository sourceRepository;

    @Autowired
    private NewsCategoryRepository categoryRepository;

    @Autowired
    private NewsArticleRepository articleRepository;

    private RssFeedParser rssFeedParser;
    private NewsApiClient newsApiClient;
    private NewsDeduplicationService deduplicationService;

    private NewsSource vnExpressSource;
    private NewsSource cafeFSource;
    private NewsCategory stockCategory;
    private NewsCategory bankingCategory;

    @BeforeEach
    void setUp() {
        articleRepository.deleteAll();
        sourceRepository.deleteAll();
        categoryRepository.deleteAll();

        rssFeedParser = new RssFeedParser();
        newsApiClient = new NewsApiClient();
        deduplicationService = new NewsDeduplicationService(articleRepository);

        vnExpressSource = sourceRepository.save(new NewsSource(
                "VNEXPRESS", "VnExpress Kinh Doanh",
                "https://vnexpress.net/kinh-doanh", "https://vnexpress.net/rss/kinh-doanh.rss", true
        ));
        cafeFSource = sourceRepository.save(new NewsSource(
                "CAFEF", "CafeF",
                "https://cafef.vn", "https://cafef.vn/tai-chinh-ngan-hang.rss", true
        ));

        stockCategory = categoryRepository.save(new NewsCategory(
                "STOCK", "Chứng khoán", "Thị trường chứng khoán", 1
        ));
        bankingCategory = categoryRepository.save(new NewsCategory(
                "BANKING", "Ngân hàng & Lãi suất", "Ngân hàng và lãi suất", 2
        ));
    }

    @Test
    @DisplayName("TC_NEWS_01: RssFeedParser bóc tách CDATA, làm sạch HTML, trích xuất thumbnail và chuẩn hóa ngày UTC")
    void testRssFeedParserExtractsCleanArticlesAndSkipsInvalidDates() {
        String sampleRssXml = """
                <?xml version="1.0" encoding="UTF-8"?>
                <rss version="2.0">
                  <channel>
                    <title>VnExpress Kinh Doanh</title>
                    <item>
                      <title><![CDATA[Lãi suất ngân hàng đồng loạt điều chỉnh trong quý IV]]></title>
                      <description><![CDATA[<a href="https://vnexpress.net/1"><img src="https://i1-kinhdoanh.vnecdn.net/thumb1.jpg" /></a></br>Nhiều <b>ngân hàng thương mại</b> vừa công bố biểu lãi suất huy động mới &amp; ưu đãi tín dụng.]]></description>
                      <pubDate>Wed, 04 Nov 2026 09:30:00 +0700</pubDate>
                      <link>https://vnexpress.net/lai-suat-ngan-hang-1.html</link>
                    </item>
                    <item>
                      <title>Bài viết thiếu ngày xuất bản hợp lệ phải bị bỏ qua</title>
                      <description>Nội dung bài viết có ngày sai định dạng</description>
                      <pubDate>INVALID_DATE_FORMAT</pubDate>
                      <link>https://vnexpress.net/invalid-date.html</link>
                    </item>
                  </channel>
                </rss>
                """;

        List<NewsArticle> articles = rssFeedParser.parseRssXml(sampleRssXml, vnExpressSource, bankingCategory);

        assertThat(articles).hasSize(1);
        NewsArticle article = articles.get(0);
        assertThat(article.getTitle()).isEqualTo("Lãi suất ngân hàng đồng loạt điều chỉnh trong quý IV");
        assertThat(article.getDescription())
                .isEqualTo("Nhiều ngân hàng thương mại vừa công bố biểu lãi suất huy động mới & ưu đãi tín dụng.");
        assertThat(article.getThumbnailUrl()).isEqualTo("https://i1-kinhdoanh.vnecdn.net/thumb1.jpg");
        assertThat(article.getPublishedAt()).isEqualTo(Instant.parse("2026-11-04T02:30:00Z"));
        assertThat(article.getTitleHash())
                .isEqualTo(deduplicationService.computeTitleHash(article.getTitle(), vnExpressSource.getId()));
    }

    @Test
    @DisplayName("TC_NEWS_01: RssFeedParser chống tấn công XXE (XML External Entity) an toàn")
    void testRssFeedParserBlocksXxePayload() {
        String maliciousXml = """
                <?xml version="1.0" encoding="UTF-8"?>
                <!DOCTYPE foo [ <!ELEMENT foo ANY >
                <!ENTITY xxe SYSTEM "file:///etc/passwd" >]>
                <rss version="2.0">
                  <channel>
                    <item>
                      <title>&xxe;</title>
                      <link>https://evil.com/1</link>
                      <pubDate>Wed, 04 Nov 2026 09:30:00 +0700</pubDate>
                    </item>
                  </channel>
                </rss>
                """;

        List<NewsArticle> articles = rssFeedParser.parseRssXml(maliciousXml, vnExpressSource, stockCategory);
        assertThat(articles).isEmpty();
    }

    @Test
    @DisplayName("TC_NEWS_02: NewsDeduplicationService chặn trùng URL, trùng Title Hash và tương đồng Jaccard > 85%")
    void testDeduplicationExactAndNearDuplicate() {
        String originalTitle = "VN-Index tăng mạnh 15 điểm nhờ nhóm cổ phiếu ngân hàng dẫn dắt sóng";
        String originalUrl = "https://vnexpress.net/vnindex-tang-15-diem.html";
        String hash = deduplicationService.computeTitleHash(originalTitle, vnExpressSource.getId());

        NewsArticle saved = new NewsArticle(
                vnExpressSource, stockCategory, originalTitle, hash,
                "Mô tả", "Snippet", originalUrl, null, "Tác giả", Instant.now()
        );
        articleRepository.save(saved);

        // 1. Trùng URL chính xác
        assertThat(deduplicationService.isDuplicate(
                "Tiêu đề hoàn toàn khác biệt", originalUrl, cafeFSource.getId()
        )).isTrue();

        // 2. Trùng Title Hash (cùng nguồn, chỉ khác dấu câu/viết hoa)
        assertThat(deduplicationService.isDuplicate(
                "VN-INDEX tăng mạnh 15 điểm: nhờ nhóm cổ phiếu ngân hàng dẫn dắt sóng!",
                "https://vnexpress.net/other-url.html",
                vnExpressSource.getId()
        )).isTrue();

        // 3. Near-duplicate khác nguồn (Jaccard similarity > 85%: 12/13 từ trùng = 92.3%)
        String nearDuplicateTitle = "VN-Index tăng mạnh 15 điểm nhờ nhóm cổ phiếu ngân hàng dẫn dắt";
        double similarity = deduplicationService.calculateJaccardSimilarity(originalTitle, nearDuplicateTitle);
        assertThat(similarity).isGreaterThan(0.85);
        assertThat(deduplicationService.isDuplicate(
                nearDuplicateTitle, "https://cafef.vn/vnindex-tang-15-diem.chn", cafeFSource.getId()
        )).isTrue();

        // 4. Bài viết mới hoàn toàn khác biệt (Jaccard <= 85%)
        String distinctTitle = "Giá vàng SJC trong nước đứng yên bất chấp thị trường thế giới biến động";
        assertThat(deduplicationService.isDuplicate(
                distinctTitle, "https://cafef.vn/gia-vang-sjc.chn", cafeFSource.getId()
        )).isFalse();
    }

    @Test
    @DisplayName("TC_NEWS_01 & TC_NEWS_04: NewsCollectorService thu thập >= 20 bài viết và cô lập lỗi từng nguồn")
    void testCollectorSavesAtLeast20ValidArticlesAndIsolatesSourceFailure() {
        NewsSource brokenSource = sourceRepository.save(new NewsSource(
                "VIETSTOCK", "Vietstock", "https://vietstock.vn", "https://vietstock.vn/rss/broken.rss", true
        ));

        List<NewsArticle> batch1 = new ArrayList<>();
        for (int i = 1; i <= 15; i++) {
            NewsArticle a = new NewsArticle();
            a.setSource(vnExpressSource);
            a.setCategory(stockCategory);
            a.setTitle("Bản tin chứng khoán tiêu điểm phiên giao dịch số " + i + " mã ngành sản xuấtalpha" + i);
            a.setDescription("Phân tích cổ phiếu trên sàn HOSE phiên số " + i);
            a.setOriginalUrl("https://vnexpress.net/chung-khoan-" + i + ".html");
            a.setPublishedAt(Instant.parse("2026-11-05T01:00:00Z").plusSeconds(i * 60L));
            batch1.add(a);
        }

        List<NewsArticle> batch2 = new ArrayList<>();
        for (int i = 16; i <= 25; i++) {
            NewsArticle a = new NewsArticle();
            a.setSource(cafeFSource);
            a.setCategory(bankingCategory);
            a.setTitle("Chính sách lãi suất ngân hàng thương mại kỳ hạn tháng " + i + " gói vaybeta" + i);
            a.setDescription("Cập nhật biểu lãi suất tiền gửi tiết kiệm số " + i);
            a.setOriginalUrl("https://cafef.vn/lai-suat-" + i + ".chn");
            a.setPublishedAt(Instant.parse("2026-11-05T02:00:00Z").plusSeconds(i * 60L));
            batch2.add(a);
        }

        RssFeedParser stubParser = new RssFeedParser() {
            @Override
            public List<NewsArticle> fetchArticles(NewsSource source, NewsCategory defaultCategory) {
                if ("VNEXPRESS".equals(source.getCode())) {
                    return batch1;
                }
                if ("CAFEF".equals(source.getCode())) {
                    return batch2;
                }
                throw new RuntimeException("Simulated HTTP 500 / Timeout from Vietstock RSS");
            }
        };

        NewsCollectorService collectorService = new NewsCollectorService(
                sourceRepository, categoryRepository, articleRepository,
                stubParser, newsApiClient, deduplicationService
        );

        int savedCount = collectorService.collectAndSaveNews();
        assertThat(savedCount).isEqualTo(25);
        assertThat(articleRepository.count()).isEqualTo(25);

        // Chạy lần 2 với cùng dữ liệu -> De-duplication chặn 100%, không lưu trùng thêm bài nào
        int secondRunCount = collectorService.collectAndSaveNews();
        assertThat(secondRunCount).isZero();
        assertThat(articleRepository.count()).isEqualTo(25);
    }
}
