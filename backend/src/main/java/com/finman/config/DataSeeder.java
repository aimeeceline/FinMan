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
                // Danh mục Chi tiêu (Expense) - Đồng bộ emoji hệ thống
                new DefaultCategoryDefinition("Ăn uống", CategoryType.EXPENSE, "🍜"),
                new DefaultCategoryDefinition("Áo quần", CategoryType.EXPENSE, "👕"),
                new DefaultCategoryDefinition("Mua sắm", CategoryType.EXPENSE, "🛒"),
                new DefaultCategoryDefinition("Giao thông", CategoryType.EXPENSE, "🚕"),
                new DefaultCategoryDefinition("Giải trí", CategoryType.EXPENSE, "🎮"),
                new DefaultCategoryDefinition("Sinh hoạt", CategoryType.EXPENSE, "🏠"),
                new DefaultCategoryDefinition("Sức khỏe", CategoryType.EXPENSE, "💊"),
                new DefaultCategoryDefinition("Giáo dục", CategoryType.EXPENSE, "📚"),
                new DefaultCategoryDefinition("Chi tiêu khác", CategoryType.EXPENSE, "📦"),

                // Danh mục Thu nhập (Income)
                new DefaultCategoryDefinition("Lương", CategoryType.INCOME, "💼"),
                new DefaultCategoryDefinition("Thưởng", CategoryType.INCOME, "🎁"),
                new DefaultCategoryDefinition("Đầu tư", CategoryType.INCOME, "📈"),
                new DefaultCategoryDefinition("Freelance", CategoryType.INCOME, "💻"),
                new DefaultCategoryDefinition("Thu nhập khác", CategoryType.INCOME, "🪙")
        );

        List<Category> existingDefaults = categoryRepository.findByIsDefaultTrue();
        int createdCount = 0;
        int updatedCount = 0;
        for (DefaultCategoryDefinition def : defaultCategories) {
            var existingOpt = existingDefaults.stream()
                    .filter(c -> c.getName().equalsIgnoreCase(def.name()))
                    .findFirst();

            if (existingOpt.isPresent()) {
                Category cat = existingOpt.get();
                if (!def.icon().equals(cat.getIcon())) {
                    cat.setIcon(def.icon());
                    categoryRepository.save(cat);
                    updatedCount++;
                }
            } else {
                Category category = new Category(def.name(), def.type(), def.icon(), true);
                categoryRepository.save(category);
                createdCount++;
            }
        }

        if (createdCount > 0 || updatedCount > 0) {
            log.info("DataSeeder: Đã đồng bộ danh mục hệ thống (Tạo mới: {}, Cập nhật icon: {}).", createdCount, updatedCount);
        } else {
            log.info("DataSeeder: Tất cả danh mục mặc định đã chuẩn hóa trong database.");
        }
    }
}
