package com.finman.repository;

import com.finman.entity.MarketIndex;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MarketIndexRepository extends JpaRepository<MarketIndex, Long> {

    Optional<MarketIndex> findByCode(String code);

    boolean existsByCode(String code);

    List<MarketIndex> findAllByOrderByCodeAsc();
}

