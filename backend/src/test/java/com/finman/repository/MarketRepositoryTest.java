package com.finman.repository;

import com.finman.entity.MarketIndex;
import com.finman.entity.StockPriceHistory;
import com.finman.entity.StockSymbol;
import com.finman.entity.User;
import com.finman.entity.UserWatchlist;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
public class MarketRepositoryTest {

    @Autowired
    private MarketIndexRepository marketIndexRepository;

    @Autowired
    private StockSymbolRepository stockSymbolRepository;

    @Autowired
    private StockPriceHistoryRepository stockPriceHistoryRepository;

    @Autowired
    private UserWatchlistRepository userWatchlistRepository;

    @Autowired
    private UserRepository userRepository;

    private User createTestUser(String email) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash("hashed_secret_password");
        user.setFullName("Nguyen Van Dau Tu");
        return userRepository.save(user);
    }

    @Test
    @DisplayName("Task 17.1: Quản lý MarketIndex (VN-Index, HNX, VN30)")
    void testMarketIndexCRUD() {
        MarketIndex vnIndex = new MarketIndex(
                "VNINDEX",
                "VN-Index",
                "Chỉ số thị trường HOSE",
                new BigDecimal("1285.50"),
                new BigDecimal("8.45"),
                new BigDecimal("0.66")
        );
        vnIndex.setTradingVolume(680500000L);
        vnIndex.setTradingValue(17520000000000L);
        vnIndex.setSessionStatus("CLOSED");

        MarketIndex saved = marketIndexRepository.save(vnIndex);
        assertThat(saved.getId()).isNotNull();

        Optional<MarketIndex> found = marketIndexRepository.findByCode("VNINDEX");
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("VN-Index");
        assertThat(found.get().getCurrentValue()).isEqualByComparingTo("1285.50");
        assertThat(found.get().getChangeValue()).isEqualByComparingTo("8.45");
        assertThat(found.get().getPercentChange()).isEqualByComparingTo("0.66");
        assertThat(found.get().getTradingValue()).isEqualTo(17520000000000L);
    }

    @Test
    @DisplayName("Task 17.1 (DoD): StockSymbol lưu trữ số liệu giá bằng BIGINT VND nguyên vẹn")
    void testStockSymbolWithBigintVndPrice() {
        StockSymbol fpt = new StockSymbol(
                "FPT",
                "Công ty Cổ phần FPT",
                "HOSE",
                "Công nghệ",
                138500L, // 138,500 VND
                4300L,   // +4,300 VND
                new BigDecimal("3.20")
        );
        fpt.setReferencePrice(134200L);
        fpt.setCeilingPrice(143500L);
        fpt.setFloorPrice(124900L);
        fpt.setTotalVolume(4520000L);
        fpt.setTotalValue(622450000000L);

        StockSymbol saved = stockSymbolRepository.save(fpt);
        assertThat(saved.getId()).isNotNull();

        Optional<StockSymbol> found = stockSymbolRepository.findBySymbolIgnoreCase("fpt");
        assertThat(found).isPresent();
        // Kiểm tra DoD: giá được lưu nguyên vẹn bằng số nguyên BIGINT VND
        assertThat(found.get().getCurrentPrice()).isEqualTo(138500L);
        assertThat(found.get().getChangePrice()).isEqualTo(4300L);
        assertThat(found.get().getReferencePrice()).isEqualTo(134200L);
        assertThat(found.get().getCeilingPrice()).isEqualTo(143500L);
        assertThat(found.get().getFloorPrice()).isEqualTo(124900L);

        // Tìm kiếm theo từ khóa
        var searchPage = stockSymbolRepository.searchSymbols("Công nghệ", PageRequest.of(0, 10));
        assertThat(searchPage.getContent()).isNotEmpty();
        assertThat(searchPage.getContent().get(0).getSymbol()).isEqualTo("FPT");
    }

    @Test
    @DisplayName("Task 17.1: Quản lý lịch sử giá cổ phiếu theo ngày (StockPriceHistory)")
    void testStockPriceHistoryCRUD() {
        StockSymbol vcb = stockSymbolRepository.save(new StockSymbol(
                "VCB",
                "Ngân hàng TMCP Ngoại thương Việt Nam",
                "HOSE",
                "Ngân hàng",
                94200L,
                1100L,
                new BigDecimal("1.18")
        ));

        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        StockPriceHistory h1 = new StockPriceHistory(
                vcb,
                yesterday,
                93000L,
                93500L,
                92800L,
                93100L,
                100L,
                new BigDecimal("0.11"),
                1200000L,
                111720000000L
        );
        stockPriceHistoryRepository.save(h1);

        StockPriceHistory h2 = new StockPriceHistory(
                vcb,
                today,
                93500L,
                94500L,
                93200L,
                94200L,
                1100L,
                new BigDecimal("1.18"),
                1850000L,
                174080000000L
        );
        stockPriceHistoryRepository.save(h2);

        List<StockPriceHistory> historyList = stockPriceHistoryRepository.findByStockSymbolOrderByTradeDateDesc(vcb);
        assertThat(historyList).hasSize(2);
        assertThat(historyList.get(0).getTradeDate()).isEqualTo(today);
        assertThat(historyList.get(0).getClosePrice()).isEqualTo(94200L);
        assertThat(historyList.get(1).getTradeDate()).isEqualTo(yesterday);
        assertThat(historyList.get(1).getClosePrice()).isEqualTo(93100L);
    }

    @Test
    @DisplayName("Task 17.1: Quản lý danh sách theo dõi cổ phiếu cá nhân (UserWatchlist)")
    void testUserWatchlistCRUD() {
        User user = createTestUser("watchlist_user@finman.com");

        StockSymbol hpg = stockSymbolRepository.save(new StockSymbol(
                "HPG",
                "Tập đoàn Hòa Phát",
                "HOSE",
                "Thép",
                28400L,
                650L,
                new BigDecimal("2.34")
        ));

        StockSymbol ssi = stockSymbolRepository.save(new StockSymbol(
                "SSI",
                "Chứng khoán SSI",
                "HOSE",
                "Chứng khoán",
                32800L,
                600L,
                new BigDecimal("1.86")
        ));

        UserWatchlist w1 = new UserWatchlist(user, hpg, "Chờ test đỉnh mua gia tăng", 32000L);
        w1.setDisplayOrder(1);
        w1.setAlertEnabled(true);
        userWatchlistRepository.save(w1);

        UserWatchlist w2 = new UserWatchlist(user, ssi, "Mục tiêu nắm giữ sóng nâng hạng", 38000L);
        w2.setDisplayOrder(2);
        userWatchlistRepository.save(w2);

        List<UserWatchlist> watchlists = userWatchlistRepository.findByUserIdOrderByDisplayOrderAscCreatedAtDesc(user.getId());
        assertThat(watchlists).hasSize(2);
        assertThat(watchlists.get(0).getStockSymbol().getSymbol()).isEqualTo("HPG");
        assertThat(watchlists.get(0).getTargetPrice()).isEqualTo(32000L);
        assertThat(watchlists.get(0).getAlertEnabled()).isTrue();

        assertThat(userWatchlistRepository.existsByUserIdAndStockSymbolId(user.getId(), hpg.getId())).isTrue();

        // Xóa khỏi watchlist
        userWatchlistRepository.deleteByUserIdAndStockSymbolId(user.getId(), hpg.getId());
        assertThat(userWatchlistRepository.existsByUserIdAndStockSymbolId(user.getId(), hpg.getId())).isFalse();
        assertThat(userWatchlistRepository.countByUserId(user.getId())).isEqualTo(1);
    }
}

