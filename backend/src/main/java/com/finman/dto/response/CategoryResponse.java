package com.finman.dto.response;

import com.finman.entity.Category;
import com.finman.entity.enums.CategoryType;

import java.time.Instant;

public class CategoryResponse {

    private Long id;
    private String name;
    private CategoryType type;
    private String icon;
    private Boolean isDefault;
    private Boolean isDeleted;
    private Instant createdAt;

    public CategoryResponse() {
    }

    public CategoryResponse(Long id, String name, CategoryType type, String icon, Boolean isDefault, Instant createdAt) {
        this(id, name, type, icon, isDefault, false, createdAt);
    }

    public CategoryResponse(Long id, String name, CategoryType type, String icon, Boolean isDefault, Boolean isDeleted, Instant createdAt) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.icon = icon;
        this.isDefault = isDefault;
        this.isDeleted = isDeleted != null ? isDeleted : false;
        this.createdAt = createdAt;
    }

    public static CategoryResponse from(Category category) {
        if (category == null) {
            return null;
        }
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getType(),
                category.getIcon(),
                category.getIsDefault(),
                category.getDeletedAt() != null,
                category.getCreatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public CategoryType getType() {
        return type;
    }

    public void setType(CategoryType type) {
        this.type = type;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public Boolean getIsDefault() {
        return isDefault;
    }

    public void setIsDefault(Boolean isDefault) {
        this.isDefault = isDefault;
    }

    public Boolean getIsDeleted() {
        return isDeleted;
    }

    public void setIsDeleted(Boolean isDeleted) {
        this.isDeleted = isDeleted;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
