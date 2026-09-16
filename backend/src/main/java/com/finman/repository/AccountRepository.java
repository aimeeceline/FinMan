package com.finman.repository;

import com.finman.entity.Account;
import com.finman.entity.enums.AccountType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    List<Account> findByUserId(Long userId);

    List<Account> findByUserIdAndIsArchivedFalse(Long userId);

    Optional<Account> findByIdAndUserId(Long id, Long userId);

    boolean existsByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndNameIgnoreCase(Long userId, String name);

    @Query("SELECT COALESCE(SUM(a.currentBalance), 0) FROM Account a WHERE a.user.id = :userId AND a.isArchived = false")
    Long sumCurrentBalanceByUserId(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(a.currentBalance), 0) FROM Account a WHERE a.user.id = :userId AND a.type = :type AND a.isArchived = false")
    Long sumCurrentBalanceByUserIdAndType(@Param("userId") Long userId, @Param("type") AccountType type);
}
