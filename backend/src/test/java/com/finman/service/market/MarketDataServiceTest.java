package com.finman.service.market;

import com.finman.client.MarketApiClient;
import com.finman.client.MarketApiClient.MarketIndexDto;
import com.finman.client.MarketApiClient.StockEodHistoryDto;
import com.finman.client.MarketApiClient.StockQuoteDto;
import com.finman.entity.MarketIndex;
import com.finman.entity.StockPriceHistory;
import com.finman.entity.StockSymbol;
import com.finman.repository.MarketIndexRepository;
import com.finman.repository.StockPriceHistoryRepository;
import com.finman.repository.StockSymbolRepository;
import com.finman.scheduler.MarketDataScheduler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MarketDataServiceTest {

    @Mock
    private MarketApiClient marketApiClient;

    @Mock
    private MarketIndexRepository marketIndexRepository;

    @Mock
    private StockSymbolRepository stockSymbolRepository;

    @Mock
    private StockPriceHistoryRepository stockPriceHistoryRepository;

    private MarketDataService marketDataService;
    private MarketDataScheduler marketDataScheduler;

    @BeforeEach
    void setUp() {
        marketDataService = new MarketDataService(
                marketApiClient,
                marketIndexRepository,
                stockSymbolRepository,
                stockPriceHistoryRepository
        );
        marketDataScheduler = new MarketDataScheduler(marketDataService);
    }

    @Test
    @DisplayName("Task 17.2: Đồng bộ chỉ số thị trường (VN-Index, HNX, VN30)")
    void testSyncMarketIndices() {
        List<MarketIndexDto> mockIndices = List.of(
                new MarketIndexDto("VNINDEX", "VN-Index",
                        new BigDecimal("1288.20"), new BigDecimal("11.15"), new BigDecimal("0.87"),
                        710000000L, 18500000000000L, "CLOSED"),
                new MarketIndexDto("VN30", "VN30-Index",
                        new BigDecimal("1345.50"), new BigDecimal("13.90"), new BigDecimal("1.04"),
                        295000000L, 9800000000000L, "CLOSED")
        );
        when(marketApiClient.fetchMarketIndices()).thenReturn(mockIndices);
        when(marketIndexRepository.findByCode(anyString())).thenReturn(Optional.empty());

        int count = marketDataService.syncMarketIndices();
        assertThat(count).isEqualTo(2);

        verify(marketIndexRepository, times(2)).save(any(MarketIndex.class));
    }

    @Test
    @DisplayName("Task 17.2: Đồng bộ giá khớp lệnh cổ phiếu định kỳ 15 phút (DoD: Giá BIGINT VND)")
    void testSyncStockQuotes() {
        StockSymbol fpt = new StockSymbol("FPT", "FPT Corp", "HOSE", "Công nghệ", 134200L, 0L, BigDecimal.ZERO);
        StockSymbol vcb = new StockSymbol("VCB", "Vietcombank", "HOSE", "Ngân hàng", 93100L, 0L, BigDecimal.ZERO);

        when(stockSymbolRepository.findByIsActiveTrueOrderByTotalValueDesc()).thenReturn(List.of(fpt, vcb));

        List<StockQuoteDto> mockQuotes = List.of(
                new StockQuoteDto("FPT", "FPT Corp", "HOSE", "Công nghệ",
                        138500L, 4300L, new BigDecimal("3.20"),
                        134200L, 143500L, 124900L, 135000L, 139000L, 134800L, 4520000L, 622450000000L),
                new StockQuoteDto("VCB", "Vietcombank", "HOSE", "Ngân hàng",
                        94200L, 1100L, new BigDecimal("1.18"),
                        93100L, 99600L, 86600L, 93500L, 94500L, 93200L, 1850000L, 174080000000L)
        );
        when(marketApiClient.fetchStockQuotes(anyList())).thenReturn(mockQuotes);
        when(stockSymbolRepository.findBySymbolIgnoreCase("FPT")).thenReturn(Optional.of(fpt));
        when(stockSymbolRepository.findBySymbolIgnoreCase("VCB")).thenReturn(Optional.of(vcb));

        int count = marketDataService.syncStockQuotes();
        assertThat(count).isEqualTo(2);

        ArgumentCaptor<StockSymbol> captor = ArgumentCaptor.forClass(StockSymbol.class);
        verify(stockSymbolRepository, times(2)).save(captor.capture());

        List<StockSymbol> savedStocks = captor.getAllValues();
        StockSymbol savedFpt = savedStocks.stream().filter(s -> s.getSymbol().equals("FPT")).findFirst().orElseThrow();
        assertThat(savedFpt.getCurrentPrice()).isEqualTo(138500L); // BIGINT VND
        assertThat(savedFpt.getChangePrice()).isEqualTo(4300L);
        assertThat(savedFpt.getPercentChange()).isEqualByComparingTo("3.20");
    }

    @Test
    @DisplayName("Task 17.2: Chốt phiên cuối ngày EOD lúc 15:30 (DoD: Lưu lịch sử giá EOD)")
    void testSyncEodPriceHistory() {
        LocalDate today = LocalDate.of(2026, 11, 17);
        StockSymbol hpg = new StockSymbol("HPG", "Hòa Phát", "HOSE", "Thép", 28400L, 650L, new BigDecimal("2.34"));
        hpg.setOpenPrice(27900L);
        hpg.setHighPrice(28600L);
        hpg.setLowPrice(27800L);
        hpg.setTotalVolume(24500000L);
        hpg.setTotalValue(693350000000L);

        when(stockSymbolRepository.findByIsActiveTrueOrderByTotalValueDesc()).thenReturn(List.of(hpg));
        when(stockPriceHistoryRepository.findByStockSymbolAndTradeDate(eq(hpg), eq(today))).thenReturn(Optional.empty());

        int count = marketDataService.syncEodPriceHistory(today);
        assertThat(count).isEqualTo(1);

        ArgumentCaptor<StockPriceHistory> captor = ArgumentCaptor.forClass(StockPriceHistory.class);
        verify(stockPriceHistoryRepository).save(captor.capture());

        StockPriceHistory savedHistory = captor.getValue();
        assertThat(savedHistory.getTradeDate()).isEqualTo(today);
        assertThat(savedHistory.getClosePrice()).isEqualTo(28400L);
        assertThat(savedHistory.getOpenPrice()).isEqualTo(27900L);
        assertThat(savedHistory.getHighPrice()).isEqualTo(28600L);
        assertThat(savedHistory.getLowPrice()).isEqualTo(27800L);
        assertThat(savedHistory.getVolume()).isEqualTo(24500000L);
    }

    @Test
    @DisplayName("Task 17.2: Lấy lịch sử giá EOD của cổ phiếu và tự động nạp lịch sử nếu trống")
    void testGetStockHistoryAutoPopulate() {
        StockSymbol mwg = new StockSymbol("MWG", "Thế Giới Di Động", "HOSE", "Bán lẻ", 66200L, -500L, new BigDecimal("-0.75"));
        when(stockSymbolRepository.findBySymbolIgnoreCase("MWG")).thenReturn(Optional.of(mwg));

        // Ban đầu chưa có lịch sử trong DB
        when(stockPriceHistoryRepository.findByStockSymbolOrderByTradeDateDesc(mwg))
                .thenReturn(List.of())
                .thenReturn(List.of(
                        new StockPriceHistory(mwg, LocalDate.now(), 66800L, 67200L, 65900L, 66200L, -500L, new BigDecimal("-0.75"), 6800000L, 451520000000L)
                ));

        List<StockEodHistoryDto> mockDtos = List.of(
                new StockEodHistoryDto("MWG", LocalDate.now(), 66800L, 67200L, 65900L, 66200L, -500L, new BigDecimal("-0.75"), 6800000L, 451520000000L)
        );
        when(marketApiClient.fetchStockEodHistory(eq("MWG"), any(LocalDate.class), any(LocalDate.class))).thenReturn(mockDtos);

        List<StockPriceHistory> result = marketDataService.getStockHistory("MWG", 30);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getClosePrice()).isEqualTo(66200L);
        verify(stockPriceHistoryRepository).save(any(StockPriceHistory.class));
    }

    @Test
    @DisplayName("Task 17.2: Scheduler kích hoạt đồng bộ phiên giao dịch và chốt phiên EOD")
    void testSchedulerTriggers() {
        when(marketApiClient.fetchMarketIndices()).thenReturn(List.of());
        when(stockSymbolRepository.findByIsActiveTrueOrderByTotalValueDesc()).thenReturn(List.of());

        int intradayTotal = marketDataScheduler.runScheduledIntradaySync();
        assertThat(intradayTotal).isEqualTo(0);

        int eodTotal = marketDataScheduler.runScheduledEodSync();
        assertThat(eodTotal).isEqualTo(0);
    }
}

