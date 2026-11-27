package com.finman.scheduler;

import com.finman.service.market.MarketDataService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Scheduler tự động thu thập & cập nhật dữ liệu thị trường chứng khoán:
 * - Định kỳ mỗi 15 phút trong giờ giao dịch (09:00 - 15:00 Thứ 2 - Thứ 6).
 * - Tự động chốt phiên và lưu lịch sử giá EOD lúc 15:30 các ngày làm việc.
 */
@Component
public class MarketDataScheduler {

    private static final Logger log = LoggerFactory.getLogger(MarketDataScheduler.class);

    private final MarketDataService marketDataService;
    private final AtomicBoolean isSyncing = new AtomicBoolean(false);

    public MarketDataScheduler(MarketDataService marketDataService) {
        this.marketDataService = marketDataService;
    }

    /**
     * Khởi tạo và nạp dữ liệu thị trường lần đầu ngay sau khi máy chủ khởi động sẵn sàng.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("MarketDataScheduler: Ứng dụng khởi động sẵn sàng. Bắt đầu chuẩn bị dữ liệu thị trường ban đầu...");
        CompletableFuture.runAsync(() -> {
            try {
                Thread.sleep(3000);
                marketDataService.ensureInitialDataSeeded();
                marketDataService.syncMarketIndices();
                marketDataService.syncStockQuotes();
                log.info("MarketDataScheduler: Đã sẵn sàng dữ liệu thị trường ban đầu.");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } catch (Exception e) {
                log.error("MarketDataScheduler: Lỗi nạp dữ liệu thị trường khi khởi động: {}", e.getMessage(), e);
            }
        });
    }

    /**
     * Định kỳ mỗi 15 phút trong giờ giao dịch chứng khoán (09:00 - 15:00 từ Thứ 2 đến Thứ 6).
     */
    @Scheduled(cron = "${market.scheduler.intraday-cron:0 */15 9-15 * * MON-FRI}", zone = "Asia/Ho_Chi_Minh")
    public int runScheduledIntradaySync() {
        if (!isSyncing.compareAndSet(false, true)) {
            log.info("MarketDataScheduler: Tiến trình đồng bộ dữ liệu phiên trước đó vẫn đang chạy, bỏ qua lượt này.");
            return 0;
        }

        long startTime = System.currentTimeMillis();
        try {
            int indicesCount = marketDataService.syncMarketIndices();
            int quotesCount = marketDataService.syncStockQuotes();
            long elapsed = System.currentTimeMillis() - startTime;
            log.info("MarketDataScheduler: Đã đồng bộ {} chỉ số & {} mã cổ phiếu trong {} ms.",
                    indicesCount, quotesCount, elapsed);
            return indicesCount + quotesCount;
        } catch (Exception e) {
            log.error("MarketDataScheduler: Lỗi trong tiến trình đồng bộ dữ liệu phiên giao dịch: {}", e.getMessage(), e);
            return 0;
        } finally {
            isSyncing.set(false);
        }
    }

    /**
     * Tự động chốt phiên và lưu lịch sử giá cuối ngày (EOD) lúc 15:30 từ Thứ 2 đến Thứ 6.
     */
    @Scheduled(cron = "${market.scheduler.eod-cron:0 30 15 * * MON-FRI}", zone = "Asia/Ho_Chi_Minh")
    public int runScheduledEodSync() {
        log.info("MarketDataScheduler: Bắt đầu tiến trình lưu trữ dữ liệu chốt phiên cuối ngày (EOD)...");
        try {
            int savedCount = marketDataService.syncEodPriceHistory(LocalDate.now());
            log.info("MarketDataScheduler: Đã chốt phiên thành công cho {} mã cổ phiếu.", savedCount);
            return savedCount;
        } catch (Exception e) {
            log.error("MarketDataScheduler: Lỗi trong tiến trình chốt phiên EOD: {}", e.getMessage(), e);
            return 0;
        }
    }
}

