package com.finman.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.finman.dto.response.DailyDigestResponse;
import com.finman.dto.response.DailyIntelligenceResponse;
import com.finman.dto.response.HeadlineItemDto;
import com.finman.dto.response.MarketPulseItemDto;
import com.finman.dto.response.PersonalFinancialAlertDto;
import com.finman.entity.DailyDigest;
import com.finman.scheduler.DailyDigestScheduler;
import com.finman.service.intelligence.DailyIntelligenceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
public class DailyIntelligenceControllerTest {

    private MockMvc mockMvc;

    @Mock
    private DailyIntelligenceService dailyIntelligenceService;

    @Mock
    private DailyDigestScheduler dailyDigestScheduler;

    @InjectMocks
    private DailyIntelligenceController dailyIntelligenceController;

    private DailyIntelligenceResponse sampleResponse;

    @BeforeEach
    void setUp() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter(mapper);

        mockMvc = MockMvcBuilders.standaloneSetup(dailyIntelligenceController)
                .setMessageConverters(converter)
                .build();

        LocalDate today = LocalDate.now();
        sampleResponse = new DailyIntelligenceResponse();
        sampleResponse.setId(100L);
        sampleResponse.setDigestDate(today);
        sampleResponse.setAiMacroSummary("Bối cảnh kinh tế vĩ mô hôm nay duy trì sự ổn định tích cực.");
        sampleResponse.setStatus("READY");
        sampleResponse.setCreatedAt(Instant.now());

        MarketPulseItemDto mp = new MarketPulseItemDto("VNINDEX", "VN-Index", BigDecimal.valueOf(1285.5), BigDecimal.valueOf(8.45), BigDecimal.valueOf(0.66), 750000000L, 19500000000000L, "CLOSED", true);
        sampleResponse.setMarketPulse(List.of(mp));

        HeadlineItemDto hl = new HeadlineItemDto(1L, "Xuất khẩu bứt phá", "VnEconomy", "Vĩ mô", Instant.now(), List.of("Ý 1", "Ý 2"), "POSITIVE", "https://vneconomy.vn/1", List.of("HPG", "FPT"));
        sampleResponse.setTopHeadlines(List.of(hl));

        sampleResponse.setKeyTakeaways(List.of("Điểm 1", "Điểm 2"));
        sampleResponse.setSuggestedPrompts(List.of("Câu hỏi gợi ý 1"));

        PersonalFinancialAlertDto alert = new PersonalFinancialAlertDto(
                20, 30, 66.7, 10000000L, 5500000L, 4500000L, 55.0,
                "SAFE", "Tiến độ an toàn", "Chi tiêu trong tầm kiểm soát", "Duy trì kỷ luật", "Ăn uống", 40.0
        );
        sampleResponse.setPersonalAlert(alert);
    }

    @Test
    @DisplayName("GET /api/v1/daily-intelligence/today: Trả về 200 OK kèm đầy đủ 4 khối dữ liệu")
    void testGetTodayIntelligence() throws Exception {
        LocalDate today = LocalDate.now();
        when(dailyIntelligenceService.getAggregatedDailyIntelligence(eq(today), any())).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/v1/daily-intelligence/today")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.digestDate").value(today.toString()))
                .andExpect(jsonPath("$.data.aiMacroSummary").value(containsString("kinh tế vĩ mô")))
                .andExpect(jsonPath("$.data.marketPulse", hasSize(1)))
                .andExpect(jsonPath("$.data.marketPulse[0].code").value("VNINDEX"))
                .andExpect(jsonPath("$.data.topHeadlines", hasSize(1)))
                .andExpect(jsonPath("$.data.topHeadlines[0].title").value("Xuất khẩu bứt phá"))
                .andExpect(jsonPath("$.data.personalAlert.alertLevel").value("SAFE"))
                .andExpect(jsonPath("$.data.personalAlert.spentPercentage").value(55.0));

        verify(dailyIntelligenceService, times(1)).getAggregatedDailyIntelligence(eq(today), any());
    }

    @Test
    @DisplayName("GET /api/v1/daily-intelligence/date/{date}: Tra cứu theo ngày cụ thể thành công")
    void testGetIntelligenceByDate() throws Exception {
        LocalDate targetDate = LocalDate.of(2026, 11, 15);
        sampleResponse.setDigestDate(targetDate);
        when(dailyIntelligenceService.getAggregatedDailyIntelligence(eq(targetDate), any())).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/v1/daily-intelligence/date/2026-11-15")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.digestDate").value("2026-11-15"))
                .andExpect(jsonPath("$.data.status").value("READY"));

        verify(dailyIntelligenceService, times(1)).getAggregatedDailyIntelligence(eq(targetDate), any());
    }

    @Test
    @DisplayName("POST /api/v1/daily-intelligence/recompile: Kích hoạt tổng hợp lại thành công")
    void testRecompileDailyDigest() throws Exception {
        LocalDate targetDate = LocalDate.of(2026, 11, 20);
        DailyDigest mockDigest = new DailyDigest(targetDate, "Tổng hợp lại", "[]", "[]");

        DailyDigestResponse mockResponse = new DailyDigestResponse();
        mockResponse.setDigestDate(targetDate);
        mockResponse.setAiMacroSummary("Tổng hợp lại");

        when(dailyDigestScheduler.triggerManualCompilation(eq(targetDate))).thenReturn(mockDigest);
        when(dailyIntelligenceService.convertToResponse(eq(mockDigest))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/daily-intelligence/recompile")
                        .param("date", "2026-11-20")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.digestDate").value("2026-11-20"))
                .andExpect(jsonPath("$.data.aiMacroSummary").value("Tổng hợp lại"));

        verify(dailyDigestScheduler, times(1)).triggerManualCompilation(eq(targetDate));
    }
}
