package com.finman.scheduler;

import com.finman.service.news.NewsCollectorService;
import com.finman.service.news.NewsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
public class NewsIngestionScheduler {

    private static final Logger log = LoggerFactory.getLogger(NewsIngestionScheduler.class);

    private final NewsCollectorService newsCollectorService;
    private final NewsService newsService;
    private final AtomicBoolean isRunning = new AtomicBoolean(false);

    public NewsIngestionScheduler(NewsCollectorService newsCollectorService, NewsService newsService) {
        this.newsCollectorService = newsCollectorService;
        this.newsService = newsService;
    }

    /**
     * Tự động chạy thu thập tin tức lần đầu tiên ngay khi ứng dụng khởi động thành công (sau delay 2 giây).
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("NewsIngestionScheduler: FinMan đã khởi động sẵn sàng. Bắt đầu tiến trình cập nhật tin tức đầu tiên...");
        CompletableFuture.runAsync(() -> {
            try {
                Thread.sleep(2000);
                runScheduledNewsIngestion();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } catch (Exception e) {
                log.error("NewsIngestionScheduler: Lỗi trong tiến trình thu thập tin tức khi khởi động: {}", e.getMessage(), e);
            }
        });
    }

    /**
     * Tự động thu thập tin tức tài chính từ các nguồn RSS/API định kỳ mỗi 15 phút.
     */
    @Scheduled(fixedDelayString = "${news.crawler.fixed-delay:900000}", initialDelay = 15000)
    public int runScheduledNewsIngestion() {
        if (!isRunning.compareAndSet(false, true)) {
            log.info("NewsIngestionScheduler: Tiến trình thu thập tin tức trước đó vẫn đang chạy, bỏ qua lượt này.");
            return 0;
        }

        long startTime = System.currentTimeMillis();
        try {
            newsService.ensureDefaultMetadataSeeded();
            int savedCount = newsCollectorService.collectAndSaveNews();
            long elapsedMs = System.currentTimeMillis() - startTime;
            log.info("NewsIngestionScheduler: Hoàn tất thu thập tin tức định kỳ, lưu mới {} bài viết trong {} ms.",
                    savedCount, elapsedMs);
            return savedCount;
        } catch (Exception e) {
            log.error("NewsIngestionScheduler: Lỗi trong tiến trình thu thập tin tức định kỳ: {}", e.getMessage(), e);
            return 0;
        } finally {
            isRunning.set(false);
        }
    }
}

