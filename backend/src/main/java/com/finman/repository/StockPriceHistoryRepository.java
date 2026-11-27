package com.finman.repository;

import com.finman.entity.StockPriceHistory;
import com.finman.entity.StockSymbol;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StockPriceHistoryRepository extends JpaRepository<StockPriceHistory, Long> {

    List<StockPriceHistory> findByStockSymbolOrderByTradeDateDesc(StockSymbol stockSymbol);

    List<StockPriceHistory> findByStockSymbolAndTradeDateBetweenOrderByTradeDateAsc(
            StockSymbol stockSymbol, LocalDate fromDate, LocalDate toDate);

    Optional<StockPriceHistory> findByStockSymbolAndTradeDate(StockSymbol stockSymbol, LocalDate tradeDate);

    boolean existsByStockSymbolAndTradeDate(StockSymbol stockSymbol, LocalDate tradeDate);
}

