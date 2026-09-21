package com.finman.service;

import com.finman.dto.request.CategoryCreateRequest;
import com.finman.dto.request.CategoryUpdateRequest;
import com.finman.dto.response.CategoryResponse;
import com.finman.entity.Category;
import com.finman.entity.User;
import com.finman.entity.enums.CategoryType;
import com.finman.exception.BusinessValidationException;
import com.finman.exception.ResourceNotFoundException;
import com.finman.repository.CategoryRepository;
import com.finman.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CategoryService categoryService;

    private User testUser;
    private Category defaultCategory;
    private Category customCategory;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("user1@example.com");

        defaultCategory = new Category("Ăn uống", CategoryType.EXPENSE, "🍜", true);
        defaultCategory.setId(1L);

        customCategory = new Category(testUser, "Nuôi mèo", CategoryType.EXPENSE, "🐱", false);
        customCategory.setId(100L);
    }

    @Test
    @DisplayName("TC_CAT_01: Lấy danh sách danh mục (hệ thống + người dùng)")
    void testGetCategories_ReturnsAvailableCategories() {
        when(categoryRepository.findAllAvailableForUser(1L))
                .thenReturn(List.of(defaultCategory, customCategory));

        List<CategoryResponse> result = categoryService.getCategories(1L, null);

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Ăn uống", result.get(0).getName());
        assertTrue(result.get(0).getIsDefault());
        assertEquals("Nuôi mèo", result.get(1).getName());
        assertFalse(result.get(1).getIsDefault());
    }

    @Test
    @DisplayName("TC_CAT_02: Tạo danh mục cá nhân mới thành công")
    void testCreateCategory_Success() {
        CategoryCreateRequest request = new CategoryCreateRequest("Nuôi thú cưng", CategoryType.EXPENSE, "🐶");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(categoryRepository.existsByUserIdAndNameIgnoreCase(1L, "Nuôi thú cưng")).thenReturn(false);
        when(categoryRepository.existsByIsDefaultTrueAndNameIgnoreCase("Nuôi thú cưng")).thenReturn(false);

        Category saved = new Category(testUser, "Nuôi thú cưng", CategoryType.EXPENSE, "🐶", false);
        saved.setId(101L);
        when(categoryRepository.save(any(Category.class))).thenReturn(saved);

        CategoryResponse response = categoryService.createCategory(1L, request);

        assertNotNull(response);
        assertEquals(101L, response.getId());
        assertEquals("Nuôi thú cưng", response.getName());
        assertFalse(response.getIsDefault());
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    @DisplayName("Tạo danh mục trùng tên ném BusinessValidationException")
    void testCreateCategory_DuplicateName_ThrowsException() {
        CategoryCreateRequest request = new CategoryCreateRequest("Ăn uống", CategoryType.EXPENSE, "🍜");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(categoryRepository.existsByIsDefaultTrueAndNameIgnoreCase("Ăn uống")).thenReturn(true);

        BusinessValidationException ex = assertThrows(BusinessValidationException.class,
                () -> categoryService.createCategory(1L, request));

        assertTrue(ex.getMessage().contains("đã tồn tại"));
    }

    @Test
    @DisplayName("TC_CAT_03: Ngăn chặn xóa danh mục mặc định của hệ thống")
    void testDeleteCategory_DefaultCategory_ThrowsException() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(defaultCategory));

        BusinessValidationException ex = assertThrows(BusinessValidationException.class,
                () -> categoryService.deleteCategory(1L, 1L));

        assertTrue(ex.getMessage().contains("mặc định của hệ thống"));
        verify(categoryRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Xóa danh mục của người dùng khác ném ResourceNotFoundException")
    void testDeleteCategory_OtherUserCategory_ThrowsException() {
        User otherUser = new User();
        otherUser.setId(2L);
        Category otherCategory = new Category(otherUser, "Riêng tư", CategoryType.EXPENSE, "🔒", false);
        otherCategory.setId(200L);

        when(categoryRepository.findById(200L)).thenReturn(Optional.of(otherCategory));

        assertThrows(ResourceNotFoundException.class,
                () -> categoryService.deleteCategory(1L, 200L));
        verify(categoryRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Xóa danh mục cá nhân thành công")
    void testDeleteCategory_CustomCategory_Success() {
        when(categoryRepository.findById(100L)).thenReturn(Optional.of(customCategory));

        categoryService.deleteCategory(1L, 100L);

        verify(categoryRepository).delete(customCategory);
    }

    @Test
    @DisplayName("Cập nhật danh mục cá nhân thành công")
    void testUpdateCategory_Success() {
        when(categoryRepository.findById(100L)).thenReturn(Optional.of(customCategory));
        when(categoryRepository.existsByUserIdAndNameIgnoreCase(1L, "Chăm sóc mèo")).thenReturn(false);
        when(categoryRepository.existsByIsDefaultTrueAndNameIgnoreCase("Chăm sóc mèo")).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenReturn(customCategory);

        CategoryUpdateRequest request = new CategoryUpdateRequest("Chăm sóc mèo", "🐾");
        CategoryResponse response = categoryService.updateCategory(1L, 100L, request);

        assertNotNull(response);
        assertEquals("Chăm sóc mèo", customCategory.getName());
        assertEquals("🐾", customCategory.getIcon());
    }

    @Test
    @DisplayName("Ngăn chặn sửa danh mục mặc định của hệ thống")
    void testUpdateCategory_DefaultCategory_ThrowsException() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(defaultCategory));

        CategoryUpdateRequest request = new CategoryUpdateRequest("Ăn nhậu", "🍺");
        assertThrows(BusinessValidationException.class,
                () -> categoryService.updateCategory(1L, 1L, request));
    }
}
