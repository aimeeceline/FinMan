package com.finman.repository;

import com.finman.entity.NewsCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NewsCategoryRepository extends JpaRepository<NewsCategory, Long> {

    Optional<NewsCategory> findByCode(String code);

    List<NewsCategory> findAllByOrderByDisplayOrderAsc();

    boolean existsByCode(String code);
}

