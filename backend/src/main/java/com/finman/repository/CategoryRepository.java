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

    List<Category> findByUserId(Long userId);

    List<Category> findByIsDefaultTrue();

    Optional<Category> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndNameIgnoreCase(Long userId, String name);

    boolean existsByIsDefaultTrueAndNameIgnoreCase(String name);

    @Query("SELECT c FROM Category c WHERE c.user.id = :userId OR (c.user IS NULL AND c.isDefault = true) ORDER BY c.isDefault DESC, c.name ASC")
    List<Category> findAllAvailableForUser(@Param("userId") Long userId);

    @Query("SELECT c FROM Category c WHERE (c.user.id = :userId OR (c.user IS NULL AND c.isDefault = true)) AND c.type = :type ORDER BY c.isDefault DESC, c.name ASC")
    List<Category> findAllAvailableForUserAndType(@Param("userId") Long userId, @Param("type") CategoryType type);

    @Query("SELECT c FROM Category c WHERE c.id = :id AND (c.user.id = :userId OR (c.user IS NULL AND c.isDefault = true))")
    Optional<Category> findAccessibleCategory(@Param("id") Long id, @Param("userId") Long userId);
}
