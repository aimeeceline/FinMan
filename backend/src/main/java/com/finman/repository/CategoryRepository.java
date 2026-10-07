package com.finman.repository;

import com.finman.entity.Category;
import com.finman.entity.enums.CategoryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByUserIdAndDeletedAtIsNull(Long userId);

    List<Category> findByIsDefaultTrue();

    Optional<Category> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndNameIgnoreCaseAndDeletedAtIsNull(Long userId, String name);

    boolean existsByIsDefaultTrueAndNameIgnoreCase(String name);

    @Query("SELECT c FROM Category c WHERE (c.user.id = :userId OR (c.user IS NULL AND c.isDefault = true)) AND c.deletedAt IS NULL ORDER BY c.isDefault DESC, c.name ASC")
    List<Category> findAllAvailableForUser(@Param("userId") Long userId);

    @Query("SELECT c FROM Category c WHERE (c.user.id = :userId OR (c.user IS NULL AND c.isDefault = true)) AND c.type = :type AND c.deletedAt IS NULL ORDER BY c.isDefault DESC, c.name ASC")
    List<Category> findAllAvailableForUserAndType(@Param("userId") Long userId, @Param("type") CategoryType type);

    @Query("SELECT c FROM Category c WHERE c.id = :id AND (c.user.id = :userId OR (c.user IS NULL AND c.isDefault = true))")
    Optional<Category> findAccessibleCategory(@Param("id") Long id, @Param("userId") Long userId);

    @Query("SELECT c FROM Category c WHERE c.user.id = :userId AND c.deletedAt IS NOT NULL AND c.isPurgedFromBin = false ORDER BY c.deletedAt DESC")
    List<Category> findRecycleBinCategories(@Param("userId") Long userId);

    @Query("SELECT c FROM Category c WHERE c.deletedAt IS NOT NULL AND c.isPurgedFromBin = false AND c.deletedAt <= :threshold")
    List<Category> findExpiredBinCategories(@Param("threshold") java.time.Instant threshold);
}
