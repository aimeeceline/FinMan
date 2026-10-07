package com.finman.repository;

import com.finman.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findByUserIdAndMonth(Long userId, String month);

    List<Budget> findByUserIdAndMonthAndDeletedAtIsNull(Long userId, String month);

    @Query("SELECT b FROM Budget b JOIN FETCH b.category WHERE b.user.id = :userId AND b.month = :month AND b.deletedAt IS NULL")
    List<Budget> findByUserIdAndMonthWithCategory(@Param("userId") Long userId, @Param("month") String month);

    Optional<Budget> findByUserIdAndCategoryIdAndMonth(Long userId, Long categoryId, String month);

    Optional<Budget> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndCategoryIdAndMonth(Long userId, Long categoryId, String month);

    void deleteByIdAndUserId(Long id, Long userId);

    long countByCategoryId(Long categoryId);

    @Query(value = "SELECT COUNT(*) FROM budgets WHERE category_id = :categoryId", nativeQuery = true)
    long countAllByCategoryId(@Param("categoryId") Long categoryId);

    @Modifying
    @Query("DELETE FROM Budget b WHERE b.category.id = :categoryId AND b.user.id = :userId")
    void deleteByCategoryIdAndUserId(@Param("categoryId") Long categoryId, @Param("userId") Long userId);

    @Modifying
    @Query(value = "DELETE FROM budgets WHERE category_id = :categoryId", nativeQuery = true)
    void hardDeleteByCategoryId(@Param("categoryId") Long categoryId);

    @Query(value = "SELECT * FROM budgets WHERE user_id = :userId AND deleted_at IS NOT NULL ORDER BY deleted_at DESC", nativeQuery = true)
    List<Budget> findRecycleBinBudgets(@Param("userId") Long userId);

    @Query(value = "SELECT * FROM budgets WHERE id = :id AND user_id = :userId AND deleted_at IS NOT NULL", nativeQuery = true)
    Optional<Budget> findDeletedByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    @Modifying
    @Query(value = "UPDATE budgets SET deleted_at = NULL WHERE id = :id AND user_id = :userId", nativeQuery = true)
    void restoreBudget(@Param("id") Long id, @Param("userId") Long userId);

    @Modifying
    @Query(value = "DELETE FROM budgets WHERE id = :id AND user_id = :userId", nativeQuery = true)
    void hardDeleteBudget(@Param("id") Long id, @Param("userId") Long userId);

    @Modifying
    @Query(value = "DELETE FROM budgets WHERE deleted_at <= :threshold", nativeQuery = true)
    void purgeExpiredBudgets(@Param("threshold") java.time.Instant threshold);
}
