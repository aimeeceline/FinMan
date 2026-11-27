package com.finman.controller;

import com.finman.dto.request.WatchlistAddRequest;
import com.finman.dto.request.WatchlistUpdateRequest;
import com.finman.dto.response.ApiResponse;
import com.finman.dto.response.MarketIndexResponse;
import com.finman.dto.response.NewsArticleResponse;
import com.finman.dto.response.StockDetailResponse;
import com.finman.dto.response.StockPriceHistoryResponse;
import com.finman.dto.response.StockQuoteResponse;
import com.finman.dto.response.UserWatchlistResponse;
import com.finman.entity.StockPriceHistory;
import com.finman.entity.StockSymbol;
import com.finman.exception.ResourceNotFoundException;
import com.finman.repository.StockSymbolRepository;
import com.finman.security.UserPrincipal;
import com.finman.service.market.MarketDataService;
import com.finman.service.market.WatchlistService;
import com.finman.service.news.NewsService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/market")
public class MarketController {

    private final MarketDataService marketDataService;
    private final WatchlistService watchlistService;
    private final StockSymbolRepository stockSymbolRepository;
    private final NewsService newsService;

    // Bộ nhớ đệm tốc độ cao trong bộ nhớ (In-memory TTL cache: 15s)
    private final AtomicReference<List<MarketIndexResponse>> cachedIndices = new AtomicReference<>();
    private volatile long lastIndicesCacheTime = 0L;
    private static final long CACHE_TTL_MS = 15_000L;

    public MarketController(
            MarketDataService marketDataService,
            WatchlistService watchlistService,
            StockSymbolRepository stockSymbolRepository,
            NewsService newsService
    ) {
        this.marketDataService = marketDataService;
        this.watchlistService = watchlistService;
        this.stockSymbolRepository = stockSymbolRepository;
        this.newsService = newsService;
    }

    /**
     * 1. Bảng điểm các chỉ số thị trường chính (VN-Index, HNX, VN30, UPCOM).
     */
    @GetMapping("/indices")
    public ResponseEntity<ApiResponse<List<MarketIndexResponse>>> getMarketIndices() {
        long now = System.currentTimeMillis();
        List<MarketIndexResponse> cached = cachedIndices.get();
        if (cached != null && (now - lastIndicesCacheTime) < CACHE_TTL_MS) {
            return ResponseEntity.ok(ApiResponse.success(cached, "Lấy danh sách chỉ số thị trường (cache) thành công"));
        }

        List<MarketIndexResponse> list = marketDataService.getAllMarketIndices().stream()
                .map(MarketIndexResponse::fromEntity)
                .collect(Collectors.toList());

        cachedIndices.set(list);
        lastIndicesCacheTime = now;

        return ResponseEntity.ok(ApiResponse.success(list, "Lấy danh sách chỉ số thị trường thành công"));
    }

    /**
     * 2. Bảng giá cổ phiếu niêm yết (tìm kiếm, lọc theo sàn, phân trang).
     */
    @GetMapping("/stocks")
    public ResponseEntity<ApiResponse<Page<StockQuoteResponse>>> getStockQuotes(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String exchange,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        PageRequest pageRequest = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)));
        Page<StockSymbol> stockPage;

        if (keyword != null && !keyword.isBlank()) {
            stockPage = stockSymbolRepository.searchSymbols(keyword.trim(), pageRequest);
        } else if (exchange != null && !exchange.isBlank() && !"ALL".equalsIgnoreCase(exchange.trim())) {
            List<StockSymbol> list = stockSymbolRepository.findByExchangeIgnoreCaseAndIsActiveTrue(exchange.trim());
            int start = (int) pageRequest.getOffset();
            int end = Math.min((start + pageRequest.getPageSize()), list.size());
            List<StockSymbol> sub = (start <= end) ? list.subList(start, end) : List.of();
            stockPage = new PageImpl<>(sub, pageRequest, list.size());
        } else {
            List<StockSymbol> list = stockSymbolRepository.findByIsActiveTrueOrderByTotalValueDesc();
            int start = (int) pageRequest.getOffset();
            int end = Math.min((start + pageRequest.getPageSize()), list.size());
            List<StockSymbol> sub = (start <= end) ? list.subList(start, end) : List.of();
            stockPage = new PageImpl<>(sub, pageRequest, list.size());
        }

        Page<StockQuoteResponse> responsePage = stockPage.map(StockQuoteResponse::fromEntity);
        return ResponseEntity.ok(ApiResponse.success(responsePage, "Lấy bảng giá cổ phiếu thành công"));
    }

    /**
     * 3. Chi tiết một mã cổ phiếu (Kèm lịch sử giá gần nhất & bài báo tài chính liên quan).
     */
    @GetMapping("/stocks/{symbol}")
    public ResponseEntity<ApiResponse<StockDetailResponse>> getStockDetail(@PathVariable String symbol) {
        StockSymbol stock = stockSymbolRepository.findBySymbolIgnoreCase(symbol.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mã cổ phiếu: " + symbol));

        StockQuoteResponse quoteResponse = StockQuoteResponse.fromEntity(stock);

        // Lấy 30 ngày lịch sử giá gần nhất
        List<StockPriceHistoryResponse> history = marketDataService.getStockHistory(stock.getSymbol(), 30).stream()
                .map(StockPriceHistoryResponse::fromEntity)
                .collect(Collectors.toList());

        // Lấy tối đa 5 bài báo tài chính mới nhất liên quan đến mã này (Cross-linking Module Tin Tức)
        List<NewsArticleResponse> relatedNews = newsService.getArticles(
                null, null, null, null, null, stock.getSymbol(), null, null, PageRequest.of(0, 5)
        ).getContent();

        StockDetailResponse detail = new StockDetailResponse(quoteResponse, history, relatedNews);
        return ResponseEntity.ok(ApiResponse.success(detail, "Lấy thông tin chi tiết cổ phiếu thành công"));
    }

    /**
     * 4. Lịch sử giá cổ phiếu dạng biểu đồ nến / đường (EOD Price History).
     */
    @GetMapping("/stocks/{symbol}/history")
    public ResponseEntity<ApiResponse<List<StockPriceHistoryResponse>>> getStockHistory(
            @PathVariable String symbol,
            @RequestParam(defaultValue = "30") int days
    ) {
        List<StockPriceHistory> history = marketDataService.getStockHistory(symbol.trim(), days);
        List<StockPriceHistoryResponse> responseList = history.stream()
                .map(StockPriceHistoryResponse::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(responseList, "Lấy lịch sử giá cổ phiếu thành công"));
    }

    /**
     * 5. Kích hoạt đồng bộ dữ liệu thị trường thủ công (Dành cho dev / reload dữ liệu).
     */
    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<String>> syncMarketData() {
        int indices = marketDataService.syncMarketIndices();
        int quotes = marketDataService.syncStockQuotes();
        cachedIndices.set(null); // Xóa cache
        return ResponseEntity.ok(ApiResponse.success(
                "OK",
                "Đồng bộ thành công " + indices + " chỉ số và " + quotes + " mã cổ phiếu."
        ));
    }

    // =========================================================================
    // WATCHLIST APIs (Phân quyền an toàn theo User)
    // =========================================================================

    /**
     * 6. Lấy danh sách theo dõi của người dùng hiện tại.
     */
    @GetMapping("/watchlist")
    public ResponseEntity<ApiResponse<List<UserWatchlistResponse>>> getUserWatchlist(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        List<UserWatchlistResponse> list = watchlistService.getUserWatchlist(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(list, "Lấy danh sách theo dõi thành công"));
    }

    /**
     * 7. Thêm một mã cổ phiếu vào danh sách theo dõi.
     */
    @PostMapping("/watchlist")
    public ResponseEntity<ApiResponse<UserWatchlistResponse>> addToWatchlist(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody WatchlistAddRequest request
    ) {
        UserWatchlistResponse response = watchlistService.addToWatchlist(userPrincipal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Đã thêm mã " + response.getSymbol() + " vào danh sách theo dõi"));
    }

    /**
     * 8. Cập nhật thông tin ghi chú, mức giá mục tiêu trong danh sách theo dõi.
     */
    @PutMapping("/watchlist/{id}")
    public ResponseEntity<ApiResponse<UserWatchlistResponse>> updateWatchlistItem(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id,
            @RequestBody WatchlistUpdateRequest request
    ) {
        UserWatchlistResponse response = watchlistService.updateWatchlistItem(userPrincipal.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã cập nhật mục theo dõi"));
    }

    /**
     * 9. Xóa một mã cổ phiếu khỏi danh sách theo dõi (hỗ trợ xóa theo ID hoặc Symbol).
     */
    @DeleteMapping("/watchlist/{symbolOrId}")
    public ResponseEntity<ApiResponse<Void>> removeFromWatchlist(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String symbolOrId
    ) {
        watchlistService.removeFromWatchlist(userPrincipal.getId(), symbolOrId);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã xóa khỏi danh sách theo dõi"));
    }
}
