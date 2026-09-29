package com.finman.controller;

import com.finman.dto.response.ApiResponse;
import com.finman.dto.response.CategoryAggregationResponse;
import com.finman.dto.response.DailyCashflowResponse;
import com.finman.dto.response.StatisticsOverviewResponse;
import com.finman.entity.enums.TransactionType;
import com.finman.exception.UnauthorizedException;
import com.finman.security.UserPrincipal;
import com.finman.service.StatisticsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/statistics")
public class StatisticsController {

    private final StatisticsService statisticsService;

    public StatisticsController(StatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    /**
     * GET /api/v1/statistics/overview
     * Lấy tổng quan số liệu thống kê: tổng thu, chi, thặng dư, xu hướng ngày, phân bổ danh mục và top chi tiêu.
     */
    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<StatisticsOverviewResponse>> getOverview(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) String month,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long accountId) {

        validateUser(userPrincipal);
        LocalDate start = from != null ? from : startDate;
        LocalDate end = to != null ? to : endDate;

        StatisticsOverviewResponse response = statisticsService.getStatisticsOverview(
                userPrincipal.getId(), month, start, end, accountId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy dữ liệu thống kê tổng hợp thành công"));
    }

    /**
     * GET /api/v1/statistics/categories
     * Lấy tỷ trọng phân bổ chi tiêu hoặc thu nhập theo danh mục kèm % tỷ lệ.
     */
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<CategoryAggregationResponse>>> getCategoryBreakdown(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) String month,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) TransactionType type) {

        validateUser(userPrincipal);
        LocalDate start = from != null ? from : startDate;
        LocalDate end = to != null ? to : endDate;

        List<CategoryAggregationResponse> response = statisticsService.getCategoryBreakdown(
                userPrincipal.getId(), month, start, end, accountId, type);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy tỷ trọng danh mục thành công"));
    }

    /**
     * GET /api/v1/statistics/daily
     * Lấy xu hướng thu/chi theo từng ngày.
     */
    @GetMapping("/daily")
    public ResponseEntity<ApiResponse<List<DailyCashflowResponse>>> getDailyTrends(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) String month,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long accountId) {

        validateUser(userPrincipal);
        LocalDate start = from != null ? from : startDate;
        LocalDate end = to != null ? to : endDate;

        List<DailyCashflowResponse> response = statisticsService.getDailyTrends(
                userPrincipal.getId(), month, start, end, accountId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy xu hướng dòng tiền hàng ngày thành công"));
    }

    private void validateUser(UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để tiếp tục");
        }
    }
}
