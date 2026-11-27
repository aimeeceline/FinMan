package com.finman.scheduler;

import com.finman.entity.DailyDigest;
import com.finman.service.intelligence.DailyIntelligenceService;
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
 * Scheduler tự động tổng hợp Bản tin tài chính buổi sáng (Daily Intelligence Briefing):
 * - Định kỳ chạy vào lúc 06:30 AM hàng ngày (Asia/Ho_Chi_Minh).
 * - Tự động kiểm tra và chuẩn bị sẵn bản tin cho ngày hiện tại ngay sau khi server khởi động.
 */
@Component
public class DailyDigestScheduler {

    private static final Logger log = LoggerFactory.getLogger(DailyDigestScheduler.class);

    private final DailyIntelligenceService dailyIntelligenceService;
    private final AtomicBoolean isCompiling = new AtomicBoolean(false);

    public DailyDigestScheduler(DailyIntelligenceService dailyIntelligenceService) {
        this.dailyIntelligenceService = dailyIntelligenceService;
    }

    /**
     * Tự động tổng hợp bản tin sáng cho ngày hôm nay ngay sau khi server khởi động sẵn sàng (delay 4s).
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("DailyDigestScheduler: Ứng dụng khởi động sẵn sàng. Kiểm tra bản tin sáng hôm nay...");
        CompletableFuture.runAsync(() -> {
            try {
                Thread.sleep(4000);
                LocalDate today = LocalDate.now();
                dailyIntelligenceService.compileDailyDigest(today);
                log.info("DailyDigestScheduler: Bản tin tài chính sáng ngày {} đã sẵn sàng phục vụ người dùng.", today);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } catch (Exception e) {
                log.error("DailyDigestScheduler: Lỗi chuẩn bị bản tin sáng khi khởi động: {}", e.getMessage(), e);
            }
        });
    }

    /**
     * Định kỳ chạy lúc 06:30 AM mỗi ngày theo giờ Việt Nam.
     */
    @Scheduled(cron = "${intelligence.daily-digest.cron:0 30 6 * * *}", zone = "Asia/Ho_Chi_Minh")
    public DailyDigest runDailyDigestCompilation() {
        if (!isCompiling.compareAndSet(false, true)) {
            log.info("DailyDigestScheduler: Tiến trình tổng hợp bản tin đang chạy, bỏ qua lượt gọi này.");
            return null;
        }

        LocalDate today = LocalDate.now();
        log.info("DailyDigestScheduler: Bắt đầu tiến trình định kỳ tổng hợp bản tin sáng 06:30 AM ngày {}...", today);
        long start = System.currentTimeMillis();

        try {
            DailyDigest digest = dailyIntelligenceService.compileDailyDigest(today);
            long elapsed = System.currentTimeMillis() - start;
            log.info("DailyDigestScheduler: Hoàn tất tổng hợp bản tin sáng ngày {} trong {} ms. Trạng thái: {}",
                    today, elapsed, digest.getStatus());
            return digest;
        } catch (Exception e) {
            log.error("DailyDigestScheduler: Lỗi trong tiến trình tổng hợp bản tin sáng ngày {}: {}", today, e.getMessage(), e);
            return null;
        } finally {
            isCompiling.set(false);
        }
    }

    /**
     * Kích hoạt tổng hợp bản tin thủ công cho một ngày cụ thể (phục vụ testing hoặc admin).
     */
    public DailyDigest triggerManualCompilation(LocalDate targetDate) {
        if (targetDate == null) {
            targetDate = LocalDate.now();
        }
        return dailyIntelligenceService.forceCompileDailyDigest(targetDate);
    }
}
