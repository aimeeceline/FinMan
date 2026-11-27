package com.finman.repository;

import com.finman.entity.UserWatchlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserWatchlistRepository extends JpaRepository<UserWatchlist, Long> {

    List<UserWatchlist> findByUserIdOrderByDisplayOrderAscCreatedAtDesc(Long userId);

    Optional<UserWatchlist> findByUserIdAndStockSymbolId(Long userId, Long symbolId);

    boolean existsByUserIdAndStockSymbolId(Long userId, Long symbolId);

    void deleteByUserIdAndStockSymbolId(Long userId, Long symbolId);

    long countByUserId(Long userId);
}

