package com.finman.repository;

import com.finman.entity.DailyDigest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface DailyDigestRepository extends JpaRepository<DailyDigest, Long> {

    Optional<DailyDigest> findByDigestDate(LocalDate digestDate);

    Optional<DailyDigest> findTopByOrderByDigestDateDesc();

    boolean existsByDigestDate(LocalDate digestDate);
}
