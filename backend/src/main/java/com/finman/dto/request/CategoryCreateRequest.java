package com.finman.dto.request;

import com.finman.entity.enums.CategoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CategoryCreateRequest {

    @NotBlank(message = "Tên danh mục không được để trống")
    @Size(max = 50, message = "Tên danh mục tối đa 50 ký tự")
    private String name;

    @NotNull(message = "Loại danh mục không được để trống")
    private CategoryType type;

    @Size(max = 50, message = "Icon tối đa 50 ký tự")
    private String icon;

    public CategoryCreateRequest() {
    }

    public CategoryCreateRequest(String name, CategoryType type, String icon) {
        this.name = name;
        this.type = type;
        this.icon = icon;
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
}
