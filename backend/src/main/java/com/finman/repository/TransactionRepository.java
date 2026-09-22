package com.finman.repository;

import com.finman.entity.Transaction;
import com.finman.entity.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long>, JpaSpecificationExecutor<Transaction> {

    Page<Transaction> findByUserId(Long userId, Pageable pageable);

    Page<Transaction> findByUserIdAndTransactionDateBetween(
            Long userId, LocalDate startDate, LocalDate endDate, Pageable pageable);

    List<Transaction> findByUserIdAndTransactionDateBetweenOrderByTransactionDateDesc(
            Long userId, LocalDate startDate, LocalDate endDate);

    Page<Transaction> findByUserIdAndAccountId(Long userId, Long accountId, Pageable pageable);

    Page<Transaction> findByUserIdAndCategoryId(Long userId, Long categoryId, Pageable pageable);

    Page<Transaction> findByUserIdAndType(Long userId, TransactionType type, Pageable pageable);

    Optional<Transaction> findByIdAndUserId(Long id, Long userId);

    void deleteByIdAndUserId(Long id, Long userId);

    long countByAccountId(Long accountId);

    long countByCategoryId(Long categoryId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
            "WHERE t.user.id = :userId AND t.type = :type " +
            "AND t.transactionDate BETWEEN :startDate AND :endDate")
    Long sumAmountByUserIdAndTypeAndDateBetween(
            @Param("userId") Long userId,
            @Param("type") TransactionType type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
            "WHERE t.user.id = :userId AND t.category.id = :categoryId AND t.type = :type " +
            "AND t.transactionDate BETWEEN :startDate AND :endDate")
    Long sumAmountByUserIdAndCategoryIdAndDateBetween(
            @Param("userId") Long userId,
            @Param("categoryId") Long categoryId,
            @Param("type") TransactionType type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
            "WHERE t.user.id = :userId AND t.account.id = :accountId AND t.type = :type " +
            "AND t.transactionDate BETWEEN :startDate AND :endDate")
    Long sumAmountByUserIdAndAccountIdAndTypeAndDateBetween(
            @Param("userId") Long userId,
            @Param("accountId") Long accountId,
            @Param("type") TransactionType type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(t) FROM Transaction t " +
            "WHERE t.user.id = :userId AND t.transactionDate BETWEEN :startDate AND :endDate")
    Long countByUserIdAndDateBetween(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
