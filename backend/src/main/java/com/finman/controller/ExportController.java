package com.finman.controller;

import com.finman.entity.enums.TransactionType;
import com.finman.exception.UnauthorizedException;
import com.finman.security.UserPrincipal;
import com.finman.service.ExportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/v1/export")
public class ExportController {

    private static final DateTimeFormatter FILE_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");
    private final ExportService exportService;

    public ExportController(ExportService exportService) {
        this.exportService = exportService;
    }

    /**
     * Xuất file Excel (.xlsx) lịch sử giao dịch và phân bổ danh mục.
     * Hỗ trợ các tham số: from/to, startDate/endDate, month, accountId, categoryId, type.
     */
    @GetMapping("/excel")
    public ResponseEntity<byte[]> exportTransactionsExcel(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String month,
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) TransactionType type) {

        validateUser(userPrincipal);

        // Chuẩn hóa tham số ngày bắt đầu và kết thúc
        LocalDate effectiveStart = from != null ? from : startDate;
        LocalDate effectiveEnd = to != null ? to : endDate;

        if (month != null && !month.isBlank()) {
            try {
                YearMonth ym = YearMonth.parse(month.trim());
                if (effectiveStart == null) {
                    effectiveStart = ym.atDay(1);
                }
                if (effectiveEnd == null) {
                    effectiveEnd = ym.atEndOfMonth();
                }
            } catch (Exception ignored) {
            }
        }

        byte[] excelBytes = exportService.exportTransactionsToExcel(
                userPrincipal.getId(),
                effectiveStart,
                effectiveEnd,
                accountId,
                categoryId,
                type
        );

        String startStr = effectiveStart != null ? effectiveStart.format(FILE_DATE_FORMAT) : "All";
        String endStr = effectiveEnd != null ? effectiveEnd.format(FILE_DATE_FORMAT) : "Now";
        String filename = String.format("FinMan_GiaoDich_%s_%s.xlsx", startStr, endStr);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
        headers.set(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION);
        headers.set(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate");
        headers.set(HttpHeaders.PRAGMA, "no-cache");
        headers.set(HttpHeaders.EXPIRES, "0");

        return ResponseEntity.ok()
                .headers(headers)
                .contentLength(excelBytes.length)
                .body(excelBytes);
    }

    private void validateUser(UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để tiếp tục");
        }
    }
}
