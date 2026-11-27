package com.finman.repository;

import com.finman.entity.StockSymbol;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockSymbolRepository extends JpaRepository<StockSymbol, Long> {

    Optional<StockSymbol> findBySymbolIgnoreCase(String symbol);

    boolean existsBySymbolIgnoreCase(String symbol);

    List<StockSymbol> findByIsActiveTrueOrderByTotalValueDesc();

    List<StockSymbol> findByExchangeIgnoreCaseAndIsActiveTrue(String exchange);

    @Query("SELECT s FROM StockSymbol s WHERE s.isActive = true AND " +
           "(LOWER(s.symbol) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.companyName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.sector) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<StockSymbol> searchSymbols(@Param("keyword") String keyword, Pageable pageable);
}
