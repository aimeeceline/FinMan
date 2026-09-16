package com.finman.config;

import com.finman.entity.Category;
import com.finman.entity.enums.CategoryType;
import com.finman.repository.CategoryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class DataSeederTest {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private DataSeeder dataSeeder;

    @Test
    @DisplayName("DataSeeder should seed all default categories and remain idempotent")
    void testDataSeederInitializesAndIsIdempotent() {
        // App startup already triggers dataSeeder.run()
        List<Category> defaultCategories = categoryRepository.findByIsDefaultTrue();
        assertEquals(14, defaultCategories.size(), "Should have exactly 14 default categories");

        // Verify all have null user and isDefault = true
        for (Category cat : defaultCategories) {
            assertTrue(cat.getIsDefault());
            assertNull(cat.getUser());
        }

        // Verify expense categories count
        long expenseCount = defaultCategories.stream()
                .filter(c -> c.getType() == CategoryType.EXPENSE)
                .count();
        assertEquals(9, expenseCount, "Should have 9 default expense categories");

        // Verify income categories count
        long incomeCount = defaultCategories.stream()
                .filter(c -> c.getType() == CategoryType.INCOME)
                .count();
        assertEquals(5, incomeCount, "Should have 5 default income categories");

        // Run dataSeeder again to verify idempotence
        dataSeeder.run();
        List<Category> recheckedCategories = categoryRepository.findByIsDefaultTrue();
        assertEquals(14, recheckedCategories.size(), "Running seeder again should not create duplicate categories");
    }
}
