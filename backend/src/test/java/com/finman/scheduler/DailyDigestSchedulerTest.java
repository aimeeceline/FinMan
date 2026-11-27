package com.finman.scheduler;

import com.finman.entity.DailyDigest;
import com.finman.service.intelligence.DailyIntelligenceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DailyDigestSchedulerTest {

    @Mock
    private DailyIntelligenceService dailyIntelligenceService;

    private DailyDigestScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new DailyDigestScheduler(dailyIntelligenceService);
    }

    @Test
    @DisplayName("runDailyDigestCompilation: Gọi compileDailyDigest với ngày hiện tại")
    void testRunDailyDigestCompilation() {
        LocalDate today = LocalDate.now();
        DailyDigest mockDigest = new DailyDigest(today, "Tóm tắt hôm nay", "[]", "[]");
        mockDigest.setStatus("READY");

        when(dailyIntelligenceService.compileDailyDigest(eq(today))).thenReturn(mockDigest);

        DailyDigest result = scheduler.runDailyDigestCompilation();

        assertThat(result).isNotNull();
        assertThat(result.getDigestDate()).isEqualTo(today);
        assertThat(result.getStatus()).isEqualTo("READY");
        verify(dailyIntelligenceService, times(1)).compileDailyDigest(eq(today));
    }

    @Test
    @DisplayName("triggerManualCompilation: Kích hoạt tổng hợp thủ công cho ngày chỉ định")
    void testTriggerManualCompilation() {
        LocalDate specificDate = LocalDate.of(2026, 12, 1);
        DailyDigest mockDigest = new DailyDigest(specificDate, "Tóm tắt ngày 1/12", "[]", "[]");

        when(dailyIntelligenceService.compileDailyDigest(eq(specificDate))).thenReturn(mockDigest);

        DailyDigest result = scheduler.triggerManualCompilation(specificDate);

        assertThat(result).isNotNull();
        assertThat(result.getDigestDate()).isEqualTo(specificDate);
        verify(dailyIntelligenceService, times(1)).compileDailyDigest(eq(specificDate));
    }
}
