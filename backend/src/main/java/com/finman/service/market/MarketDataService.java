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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MarketDataService {

    private static final Logger log = LoggerFactory.getLogger(MarketDataService.class);

    private final MarketApiClient marketApiClient;
    private final MarketIndexRepository marketIndexRepository;
    private final StockSymbolRepository stockSymbolRepository;
    private final StockPriceHistoryRepository stockPriceHistoryRepository;

    public MarketDataService(
            MarketApiClient marketApiClient,
            MarketIndexRepository marketIndexRepository,
            StockSymbolRepository stockSymbolRepository,
            StockPriceHistoryRepository stockPriceHistoryRepository
    ) {
        this.marketApiClient = marketApiClient;
        this.marketIndexRepository = marketIndexRepository;
        this.stockSymbolRepository = stockSymbolRepository;
        this.stockPriceHistoryRepository = stockPriceHistoryRepository;
    }

    /**
     * Đồng bộ bảng điểm chỉ số thị trường (VN-Index, HNX, VN30, UPCOM).
     */
    @Transactional
    public int syncMarketIndices() {
        log.info("MarketDataService: Bắt đầu đồng bộ chỉ số thị trường...");
        List<MarketIndexDto> indexDtos = marketApiClient.fetchMarketIndices();
        if (indexDtos == null || indexDtos.isEmpty()) {
            return 0;
        }

        int count = 0;
        Instant now = Instant.now();
        for (MarketIndexDto dto : indexDtos) {
            MarketIndex index = marketIndexRepository.findByCode(dto.getCode())
                    .orElseGet(() -> {
                        MarketIndex mi = new MarketIndex();
                        mi.setCode(dto.getCode());
                        return mi;
                    });

            index.setName(dto.getName());
            index.setCurrentValue(dto.getCurrentValue());
            index.setChangeValue(dto.getChangeValue());
            index.setPercentChange(dto.getPercentChange());
            if (dto.getTradingVolume() != null) index.setTradingVolume(dto.getTradingVolume());
            if (dto.getTradingValue() != null) index.setTradingValue(dto.getTradingValue());
            if (dto.getSessionStatus() != null) index.setSessionStatus(dto.getSessionStatus());
            index.setLastUpdatedAt(now);

            marketIndexRepository.save(index);
            count++;
        }
        log.info("MarketDataService: Đã cập nhật thành công {} chỉ số thị trường.", count);
        return count;
    }

    /**
     * Đồng bộ giá khớp lệnh cổ phiếu niêm yết trong phiên.
     */
    @Transactional
    public int syncStockQuotes() {
        log.info("MarketDataService: Bắt đầu đồng bộ báo giá cổ phiếu niêm yết...");
        List<StockSymbol> activeStocks = stockSymbolRepository.findByIsActiveTrueOrderByTotalValueDesc();
        if (activeStocks.isEmpty()) {
            ensureInitialDataSeeded();
            activeStocks = stockSymbolRepository.findByIsActiveTrueOrderByTotalValueDesc();
        }

        List<String> symbols = activeStocks.stream().map(StockSymbol::getSymbol).collect(Collectors.toList());
        List<StockQuoteDto> quoteDtos = marketApiClient.fetchStockQuotes(symbols);
        if (quoteDtos == null || quoteDtos.isEmpty()) {
            return 0;
        }

        int count = 0;
        for (StockQuoteDto dto : quoteDtos) {
            Optional<StockSymbol> opt = stockSymbolRepository.findBySymbolIgnoreCase(dto.getSymbol());
            if (opt.isPresent()) {
                StockSymbol s = opt.get();
                s.setCurrentPrice(dto.getCurrentPrice());
                s.setChangePrice(dto.getChangePrice());
                s.setPercentChange(dto.getPercentChange());
                if (dto.getReferencePrice() != null && dto.getReferencePrice() > 0) s.setReferencePrice(dto.getReferencePrice());
                if (dto.getCeilingPrice() != null && dto.getCeilingPrice() > 0) s.setCeilingPrice(dto.getCeilingPrice());
                if (dto.getFloorPrice() != null && dto.getFloorPrice() > 0) s.setFloorPrice(dto.getFloorPrice());
                if (dto.getOpenPrice() != null && dto.getOpenPrice() > 0) s.setOpenPrice(dto.getOpenPrice());
                if (dto.getHighPrice() != null && dto.getHighPrice() > 0) s.setHighPrice(dto.getHighPrice());
                if (dto.getLowPrice() != null && dto.getLowPrice() > 0) s.setLowPrice(dto.getLowPrice());
                if (dto.getTotalVolume() != null) s.setTotalVolume(dto.getTotalVolume());
                if (dto.getTotalValue() != null) s.setTotalValue(dto.getTotalValue());

                stockSymbolRepository.save(s);
                count++;
            }
        }
        log.info("MarketDataService: Đã cập nhật thành công giá cho {} mã cổ phiếu.", count);
        return count;
    }

    /**
     * Nạp dữ liệu chốt phiên cuối ngày (EOD - End Of Day) lúc 15:30.
     */
    @Transactional
    public int syncEodPriceHistory(LocalDate tradeDate) {
        if (tradeDate == null) {
            tradeDate = LocalDate.now();
        }
        log.info("MarketDataService: Bắt đầu chốt phiên cuối ngày (EOD) cho ngày {}", tradeDate);
        List<StockSymbol> activeStocks = stockSymbolRepository.findByIsActiveTrueOrderByTotalValueDesc();
        if (activeStocks.isEmpty()) {
            return 0;
        }

        int count = 0;
        for (StockSymbol stock : activeStocks) {
            LocalDate date = tradeDate;
            StockPriceHistory history = stockPriceHistoryRepository.findByStockSymbolAndTradeDate(stock, date)
                    .orElseGet(() -> {
                        StockPriceHistory h = new StockPriceHistory();
                        h.setStockSymbol(stock);
                        h.setTradeDate(date);
                        return h;
                    });

            long open = stock.getOpenPrice() > 0 ? stock.getOpenPrice() : stock.getCurrentPrice();
            long high = stock.getHighPrice() > 0 ? stock.getHighPrice() : stock.getCurrentPrice();
            long low = stock.getLowPrice() > 0 ? stock.getLowPrice() : stock.getCurrentPrice();
            long close = stock.getCurrentPrice();

            history.setOpenPrice(open);
            history.setHighPrice(high);
            history.setLowPrice(low);
            history.setClosePrice(close);
            history.setChangePrice(stock.getChangePrice());
            history.setPercentChange(stock.getPercentChange());
            history.setVolume(stock.getTotalVolume());
            history.setTotalValue(stock.getTotalValue());

            stockPriceHistoryRepository.save(history);
            count++;
        }
        log.info("MarketDataService: Đã hoàn tất lưu trữ lịch sử EOD cho {} mã cổ phiếu ngày {}.", count, tradeDate);
        return count;
    }

    /**
     * Lấy toàn bộ chỉ số thị trường.
     */
    @Transactional(readOnly = true)
    public List<MarketIndex> getAllMarketIndices() {
        List<MarketIndex> list = marketIndexRepository.findAllByOrderByCodeAsc();
        if (list.isEmpty()) {
            syncMarketIndices();
            return marketIndexRepository.findAllByOrderByCodeAsc();
        }
        return list;
    }

    /**
     * Lấy toàn bộ danh sách mã cổ phiếu đang niêm yết.
     */
    @Transactional(readOnly = true)
    public List<StockSymbol> getAllStockSymbols() {
        return stockSymbolRepository.findByIsActiveTrueOrderByTotalValueDesc();
    }

    /**
     * Lấy lịch sử giá EOD của một mã cổ phiếu.
     * Tự động sinh/nạp dữ liệu nếu mã chưa có lịch sử quá khứ trong DB.
     */
    @Transactional
    public List<StockPriceHistory> getStockHistory(String symbol, int limitDays) {
        StockSymbol stock = stockSymbolRepository.findBySymbolIgnoreCase(symbol)
                .orElse(null);
        if (stock == null) {
            return List.of();
        }

        List<StockPriceHistory> history = stockPriceHistoryRepository.findByStockSymbolOrderByTradeDateDesc(stock);
        if (history.isEmpty()) {
            LocalDate toDate = LocalDate.now();
            LocalDate fromDate = toDate.minusDays(Math.max(30, limitDays));
            List<StockEodHistoryDto> dtos = marketApiClient.fetchStockEodHistory(stock.getSymbol(), fromDate, toDate);
            for (StockEodHistoryDto dto : dtos) {
                StockPriceHistory sph = new StockPriceHistory(
                        stock,
                        dto.getTradeDate(),
                        dto.getOpenPrice(),
                        dto.getHighPrice(),
                        dto.getLowPrice(),
                        dto.getClosePrice(),
                        dto.getChangePrice(),
                        dto.getPercentChange(),
                        dto.getVolume(),
                        dto.getTotalValue()
                );
                stockPriceHistoryRepository.save(sph);
            }
            history = stockPriceHistoryRepository.findByStockSymbolOrderByTradeDateDesc(stock);
        }

        if (limitDays > 0 && history.size() > limitDays) {
            return history.subList(0, limitDays);
        }
        return history;
    }

    /**
     * Đảm bảo dữ liệu chỉ số & mã cổ phiếu ban đầu được khởi tạo sẵn sàng.
     */
    @Transactional
    public void ensureInitialDataSeeded() {
        if (marketIndexRepository.count() == 0) {
            syncMarketIndices();
        }
        if (stockSymbolRepository.count() == 0) {
            List<String> defaultSymbols = List.of("FPT", "VCB", "HPG", "SSI", "MWG", "TCB", "MBB", "VHM");
            List<StockQuoteDto> quotes = marketApiClient.fetchStockQuotes(defaultSymbols);
            for (StockQuoteDto q : quotes) {
                StockSymbol s = new StockSymbol(
                        q.getSymbol(),
                        q.getCompanyName(),
                        q.getExchange(),
                        q.getSector(),
                        q.getCurrentPrice(),
                        q.getChangePrice(),
                        q.getPercentChange()
                );
                s.setReferencePrice(q.getReferencePrice());
                s.setCeilingPrice(q.getCeilingPrice());
                s.setFloorPrice(q.getFloorPrice());
                s.setOpenPrice(q.getOpenPrice());
                s.setHighPrice(q.getHighPrice());
                s.setLowPrice(q.getLowPrice());
                s.setTotalVolume(q.getTotalVolume());
                s.setTotalValue(q.getTotalValue());
                stockSymbolRepository.save(s);
            }
        }
    }
}

