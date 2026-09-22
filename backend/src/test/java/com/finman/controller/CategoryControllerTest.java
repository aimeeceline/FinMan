package com.finman.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finman.dto.request.CategoryCreateRequest;
import com.finman.entity.Category;
import com.finman.entity.User;
import com.finman.entity.enums.CategoryType;
import com.finman.repository.CategoryRepository;
import com.finman.repository.UserRepository;
import com.finman.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User testUser;
    private String token;

    @BeforeEach
    void setUp() {
        testUser = new User("cat.user@finman.com", "hashpass", "Cat User");
        testUser = userRepository.save(testUser);
        token = jwtTokenProvider.generateToken(testUser.getId(), testUser.getEmail());
    }

    @Test
    @DisplayName("TC_CAT_01: Lấy danh sách danh mục có sẵn của hệ thống")
    void testGetCategories_IncludesDefaults() throws Exception {
        mockMvc.perform(get("/api/v1/categories")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(14)));
    }

    @Test
    @DisplayName("TC_CAT_02: Tạo danh mục cá nhân mới thành công")
    void testCreateCustomCategory_Success() throws Exception {
        CategoryCreateRequest request = new CategoryCreateRequest("Nuôi thú cưng", CategoryType.EXPENSE, "pets");

        mockMvc.perform(post("/api/v1/categories")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Nuôi thú cưng"))
                .andExpect(jsonPath("$.data.type").value("EXPENSE"))
                .andExpect(jsonPath("$.data.icon").value("pets"))
                .andExpect(jsonPath("$.data.isDefault").value(false));
    }

    @Test
    @DisplayName("TC_CAT_03: Ngăn chặn xóa danh mục mặc định của hệ thống")
    void testDeleteDefaultCategory_Fails() throws Exception {
        List<Category> defaults = categoryRepository.findByIsDefaultTrue();
        assertFalse(defaults.isEmpty());
        Category defaultCat = defaults.get(0);

        mockMvc.perform(delete("/api/v1/categories/" + defaultCat.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("BUSINESS_VALIDATION_ERROR"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Không thể xóa danh mục mặc định")));
    }

    @Test
    @DisplayName("Xóa danh mục cá nhân thành công")
    void testDeleteCustomCategory_Success() throws Exception {
        Category custom = new Category(testUser, "Quỹ phát triển", CategoryType.INCOME, "trending_up", false);
        custom = categoryRepository.save(custom);

        mockMvc.perform(delete("/api/v1/categories/" + custom.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Xóa danh mục thành công"));

        assertFalse(categoryRepository.findById(custom.getId()).isPresent());
    }

    @Test
    @DisplayName("Lọc danh mục theo loại INCOME")
    void testFilterCategoriesByType_Income() throws Exception {
        mockMvc.perform(get("/api/v1/categories?type=INCOME")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].type").value("INCOME"));
    }

    @Test
    @DisplayName("Chặn truy cập /api/v1/categories khi không có token")
    void testAccessWithoutTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/categories"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }
}
