package com.finman.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finman.dto.request.WatchlistAddRequest;
import com.finman.dto.request.WatchlistUpdateRequest;
import com.finman.entity.MarketIndex;
import com.finman.entity.StockSymbol;
import com.finman.entity.User;
import com.finman.repository.MarketIndexRepository;
import com.finman.repository.StockSymbolRepository;
import com.finman.repository.UserRepository;
import com.finman.repository.UserWatchlistRepository;
import com.finman.security.JwtTokenProvider;
import com.finman.service.market.MarketDataService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class MarketControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MarketDataService marketDataService;

    @Autowired
    private MarketIndexRepository marketIndexRepository;

    @Autowired
    private StockSymbolRepository stockSymbolRepository;

    @Autowired
    private UserWatchlistRepository userWatchlistRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User testUser;
    private String jwtToken;
    private StockSymbol fptStock;

    @BeforeEach
    void setUp() {
        userWatchlistRepository.deleteAll();
        stockSymbolRepository.deleteAll();
        marketIndexRepository.deleteAll();

        // 1. Seed user & token
        testUser = userRepository.save(new User("investor_test@finman.com", "hashed_pw", "Nhà Đầu Tư Test"));
        jwtToken = jwtTokenProvider.generateToken(testUser.getId(), testUser.getEmail());

        // 2. Seed indices
        marketIndexRepository.save(new MarketIndex(
                "VNINDEX", "VN-Index", "Chỉ số HOSE",
                new BigDecimal("1285.50"), new BigDecimal("8.45"), new BigDecimal("0.66")
        ));
        marketIndexRepository.save(new MarketIndex(
                "VN30", "VN30-Index", "Chỉ số VN30",
                new BigDecimal("1342.80"), new BigDecimal("11.20"), new BigDecimal("0.84")
        ));

        // 3. Seed stock
        fptStock = new StockSymbol(
                "FPT", "Công ty Cổ phần FPT", "HOSE", "Công nghệ",
                138500L, 4300L, new BigDecimal("3.20")
        );
        fptStock.setReferencePrice(134200L);
        fptStock.setCeilingPrice(143500L);
        fptStock.setFloorPrice(124900L);
        fptStock.setTotalVolume(4520000L);
        fptStock.setTotalValue(622450000000L);
        fptStock = stockSymbolRepository.save(fptStock);
    }

    @Test
    @DisplayName("Task 17.3: GET /api/v1/market/indices - Lấy danh sách chỉ số công khai")
    void testGetMarketIndices() throws Exception {
        mockMvc.perform(get("/api/v1/market/indices"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$.data[0].code").exists())
                .andExpect(jsonPath("$.data[0].currentValue").exists());
    }

    @Test
    @DisplayName("Task 17.3: GET /api/v1/market/stocks - Lấy bảng giá cổ phiếu niêm yết (DoD: Giá BIGINT VND)")
    void testGetStockQuotes() throws Exception {
        mockMvc.perform(get("/api/v1/market/stocks")
                        .param("keyword", "FPT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].symbol").value("FPT"))
                .andExpect(jsonPath("$.data.content[0].currentPrice").value(138500))
                .andExpect(jsonPath("$.data.content[0].changePrice").value(4300));
    }

    @Test
    @DisplayName("Task 17.3: GET /api/v1/market/stocks/{symbol} - Chi tiết cổ phiếu kèm lịch sử và bài báo")
    void testGetStockDetail() throws Exception {
        mockMvc.perform(get("/api/v1/market/stocks/FPT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.stock.symbol").value("FPT"))
                .andExpect(jsonPath("$.data.stock.companyName").value("Công ty Cổ phần FPT"))
                .andExpect(jsonPath("$.data.history").isArray())
                .andExpect(jsonPath("$.data.relatedNews").isArray());
    }

    @Test
    @DisplayName("Task 17.3: GET /api/v1/market/stocks/{symbol}/history - Lịch sử giá EOD")
    void testGetStockHistory() throws Exception {
        mockMvc.perform(get("/api/v1/market/stocks/FPT/history")
                        .param("days", "15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("Task 17.3: POST /api/v1/market/sync - Đồng bộ thủ công dữ liệu thị trường")
    void testSyncMarketData() throws Exception {
        mockMvc.perform(post("/api/v1/market/sync"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message", containsString("Đồng bộ thành công")));
    }

    @Test
    @DisplayName("Task 17.3: GET /api/v1/market/watchlist - Yêu cầu xác thực (401 Unauthorized khi không có token)")
    void testGetWatchlistUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/market/watchlist"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Task 17.3: CRUD Watchlist cá nhân an toàn theo User")
    void testWatchlistCrudFlow() throws Exception {
        // 1. Thêm FPT vào Watchlist
        WatchlistAddRequest addReq = new WatchlistAddRequest("FPT", "Chờ mua thêm khi về 135k", 160000L);
        addReq.setAlertEnabled(true);

        String createRes = mockMvc.perform(post("/api/v1/market/watchlist")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.symbol").value("FPT"))
                .andExpect(jsonPath("$.data.targetPrice").value(160000))
                .andExpect(jsonPath("$.data.currentPrice").value(138500))
                .andReturn().getResponse().getContentAsString();

        Long watchlistId = objectMapper.readTree(createRes).path("data").path("id").asLong();

        // 2. Lấy danh sách Watchlist của user
        mockMvc.perform(get("/api/v1/market/watchlist")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].symbol").value("FPT"));

        // 3. Cập nhật Watchlist item
        WatchlistUpdateRequest updateReq = new WatchlistUpdateRequest(
                "Đã mua 1,000 cp giá 135k, nâng target lên 170k", 170000L, true, 1
        );

        mockMvc.perform(put("/api/v1/market/watchlist/" + watchlistId)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.targetPrice").value(170000))
                .andExpect(jsonPath("$.data.note").value("Đã mua 1,000 cp giá 135k, nâng target lên 170k"));

        // 4. Xóa khỏi Watchlist bằng Symbol
        mockMvc.perform(delete("/api/v1/market/watchlist/FPT")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 5. Kiểm tra danh sách sau xóa phải rỗng
        mockMvc.perform(get("/api/v1/market/watchlist")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));
    }
}

