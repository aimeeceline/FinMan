package com.finman.config;

import com.finman.entity.Category;
import com.finman.entity.enums.CategoryType;
import com.finman.repository.CategoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final CategoryRepository categoryRepository;

    public DataSeeder(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public void run(String... args) {
        seedDefaultCategories();
    }

    private void seedDefaultCategories() {
        record DefaultCategoryDefinition(String name, CategoryType type, String icon) {}

        List<DefaultCategoryDefinition> defaultCategories = List.of(
                // Danh mục Chi tiêu (Expense) - Khớp 100% với Stitch UI Design (07_add_transaction)
                new DefaultCategoryDefinition("Ăn uống", CategoryType.EXPENSE, "restaurant"),
                new DefaultCategoryDefinition("Áo quần", CategoryType.EXPENSE, "apparel"),
                new DefaultCategoryDefinition("Mua sắm", CategoryType.EXPENSE, "shopping_bag"),
                new DefaultCategoryDefinition("Giao thông", CategoryType.EXPENSE, "directions_car"),
                new DefaultCategoryDefinition("Giải trí", CategoryType.EXPENSE, "sports_esports"),
                new DefaultCategoryDefinition("Sinh hoạt", CategoryType.EXPENSE, "home"),
                new DefaultCategoryDefinition("Sức khỏe", CategoryType.EXPENSE, "favorite"),
                new DefaultCategoryDefinition("Giáo dục", CategoryType.EXPENSE, "school"),
                new DefaultCategoryDefinition("Chi tiêu khác", CategoryType.EXPENSE, "more_horiz"),

                // Danh mục Thu nhập (Income)
                new DefaultCategoryDefinition("Lương", CategoryType.INCOME, "payments"),
                new DefaultCategoryDefinition("Thưởng", CategoryType.INCOME, "featured_seasonal_and_gifts"),
                new DefaultCategoryDefinition("Đầu tư", CategoryType.INCOME, "trending_up"),
                new DefaultCategoryDefinition("Freelance", CategoryType.INCOME, "laptop_mac"),
                new DefaultCategoryDefinition("Thu nhập khác", CategoryType.INCOME, "savings")
        );

        int createdCount = 0;
        for (DefaultCategoryDefinition def : defaultCategories) {
            if (!categoryRepository.existsByIsDefaultTrueAndNameIgnoreCase(def.name())) {
                Category category = new Category(def.name(), def.type(), def.icon(), true);
                categoryRepository.save(category);
                createdCount++;
            }
        }

        if (createdCount > 0) {
            log.info("DataSeeder: Đã khởi tạo thành công {} danh mục mặc định cho hệ thống.", createdCount);
        } else {
            log.info("DataSeeder: Tất cả danh mục mặc định đã tồn tại trong database, bỏ qua khởi tạo.");
        }
    }
}
