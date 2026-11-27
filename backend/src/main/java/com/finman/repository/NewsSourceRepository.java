package com.finman.repository;

import com.finman.entity.NewsSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NewsSourceRepository extends JpaRepository<NewsSource, Long> {

    Optional<NewsSource> findByCode(String code);

    List<NewsSource> findByIsActiveTrue();

    boolean existsByCode(String code);
}

