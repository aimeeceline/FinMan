package com.finman.repository;

import com.finman.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findByUserIdAndMonth(Long userId, String month);

    @Query("SELECT b FROM Budget b JOIN FETCH b.category WHERE b.user.id = :userId AND b.month = :month")
    List<Budget> findByUserIdAndMonthWithCategory(@Param("userId") Long userId, @Param("month") String month);

    Optional<Budget> findByUserIdAndCategoryIdAndMonth(Long userId, Long categoryId, String month);

    Optional<Budget> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndCategoryIdAndMonth(Long userId, Long categoryId, String month);

    void deleteByIdAndUserId(Long id, Long userId);

    long countByCategoryId(Long categoryId);
}
