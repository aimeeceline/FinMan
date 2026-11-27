package com.finman.controller;

import com.finman.dto.response.ApiResponse;
import com.finman.dto.response.DailyDigestResponse;
import com.finman.dto.response.DailyIntelligenceResponse;
import com.finman.entity.DailyDigest;
import com.finman.scheduler.DailyDigestScheduler;
import com.finman.security.UserPrincipal;
import com.finman.service.intelligence.DailyIntelligenceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/**
 * Controller cung cấp API Bản tin tài chính buổi sáng (FinMan Daily Intelligence Aggregator API):
 * - GET /api/v1/daily-intelligence/today: Trả về gói dữ liệu tổng hợp hôm nay (Market Pulse, Headlines, AI Macro, Personal Alert).
 * - GET /api/v1/daily-intelligence/date/{date}: Tra cứu bản tin theo ngày chỉ định.
 * - POST /api/v1/daily-intelligence/recompile: Kích hoạt tổng hợp lại bản tin thủ công.
 */
@RestController
@RequestMapping("/api/v1/daily-intelligence")
public class DailyIntelligenceController {

    private static final Logger log = LoggerFactory.getLogger(DailyIntelligenceController.class);

    private final DailyIntelligenceService dailyIntelligenceService;
    private final DailyDigestScheduler dailyDigestScheduler;

    public DailyIntelligenceController(
            DailyIntelligenceService dailyIntelligenceService,
            DailyDigestScheduler dailyDigestScheduler
    ) {
        this.dailyIntelligenceService = dailyIntelligenceService;
        this.dailyDigestScheduler = dailyDigestScheduler;
    }

    /**
     * Lấy bản tin tài chính tổng hợp ngày hôm nay kèm góc cảnh báo ngân sách cá nhân hóa (Task 18.2).
     * Thời gian phản hồi < 50ms nhờ dữ liệu đã được tính toán sẵn trong DB/Cache.
     */
    @GetMapping("/today")
    public ResponseEntity<ApiResponse<DailyIntelligenceResponse>> getTodayIntelligence(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        LocalDate today = LocalDate.now();

        log.debug("DailyIntelligenceController: Lấy bản tin hôm nay {} cho user {}", today, userId);
        DailyIntelligenceResponse response = dailyIntelligenceService.getAggregatedDailyIntelligence(today, userId);

        return ResponseEntity.ok(ApiResponse.success(response, "Lấy bản tin tài chính sáng hôm nay thành công"));
    }

    /**
     * Tra cứu bản tin tài chính theo một ngày cụ thể (định dạng yyyy-MM-dd).
     */
    @GetMapping("/date/{date}")
    public ResponseEntity<ApiResponse<DailyIntelligenceResponse>> getIntelligenceByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        Long userId = userPrincipal != null ? userPrincipal.getId() : null;

        log.debug("DailyIntelligenceController: Lấy bản tin ngày {} cho user {}", date, userId);
        DailyIntelligenceResponse response = dailyIntelligenceService.getAggregatedDailyIntelligence(date, userId);

        return ResponseEntity.ok(ApiResponse.success(response, "Lấy bản tin tài chính ngày " + date + " thành công"));
    }

    /**
     * Kích hoạt tổng hợp lại bản tin thủ công cho một ngày (phục vụ admin, refresh AI hoặc sync).
     */
    @PostMapping("/recompile")
    public ResponseEntity<ApiResponse<DailyIntelligenceResponse>> recompileDailyDigest(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        log.info("DailyIntelligenceController: Yêu cầu tổng hợp lại bản tin ngày {} cho user {}", targetDate, userId);

        dailyDigestScheduler.triggerManualCompilation(targetDate);
        DailyIntelligenceResponse response = dailyIntelligenceService.getAggregatedDailyIntelligence(targetDate, userId);

        return ResponseEntity.ok(ApiResponse.success(response, "Đã tổng hợp lại bản tin ngày " + targetDate + " thành công"));
    }
}
