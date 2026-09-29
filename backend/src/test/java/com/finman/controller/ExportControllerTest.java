package com.finman.controller;

import com.finman.entity.Account;
import com.finman.entity.Category;
import com.finman.entity.Transaction;
import com.finman.entity.User;
import com.finman.entity.enums.AccountType;
import com.finman.entity.enums.CategoryType;
import com.finman.entity.enums.TransactionType;
import com.finman.repository.AccountRepository;
import com.finman.repository.CategoryRepository;
import com.finman.repository.TransactionRepository;
import com.finman.repository.UserRepository;
import com.finman.security.JwtTokenProvider;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.time.LocalDate;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ExportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User userA;
    private User userB;
    private String tokenA;
    private String tokenB;
    private Account accountA;
    private Category categoryFood;
    private Category categorySalary;

    @BeforeEach
    void setUp() {
        userA = new User("export.user.a@finman.com", "pass123", "Nguyễn Minh Khang");
        userA = userRepository.save(userA);
        tokenA = jwtTokenProvider.generateToken(userA.getId(), userA.getEmail());

        userB = new User("export.user.b@finman.com", "pass123", "Người Dùng Khác");
        userB = userRepository.save(userB);
        tokenB = jwtTokenProvider.generateToken(userB.getId(), userB.getEmail());

        accountA = new Account(userA, "Ví MoMo Cá Nhân", AccountType.BANK, 5_000_000L);
        accountA = accountRepository.save(accountA);

        categoryFood = new Category(userA, "Ăn uống", CategoryType.EXPENSE, "restaurant", false);
        categoryFood = categoryRepository.save(categoryFood);

        categorySalary = new Category(userA, "Tiền lương", CategoryType.INCOME, "payments", false);
        categorySalary = categoryRepository.save(categorySalary);

        // Tạo dữ liệu giao dịch cho user A
        Transaction t1 = new Transaction(
                userA, accountA, categorySalary, TransactionType.INCOME, 10_000_000L,
                LocalDate.of(2026, 9, 5), "Lương tháng 9");
        transactionRepository.save(t1);

        Transaction t2 = new Transaction(
                userA, accountA, categoryFood, TransactionType.EXPENSE, 50_000L,
                LocalDate.of(2026, 9, 10), "Bún bò sáng");
        transactionRepository.save(t2);

        // Tạo dữ liệu giao dịch cho user B (bảo đảm multi-tenant cách ly)
        Account accountB = new Account(userB, "Tài khoản B", AccountType.BANK, 1_000_000L);
        accountB = accountRepository.save(accountB);

        Category categoryB = new Category(userB, "Chi tiêu B", CategoryType.EXPENSE, "shopping_cart", false);
        categoryB = categoryRepository.save(categoryB);

        Transaction tB = new Transaction(
                userB, accountB, categoryB, TransactionType.EXPENSE, 999_000L,
                LocalDate.of(2026, 9, 15), "Giao dịch bí mật của user B");
        transactionRepository.save(tB);
    }

    @Test
    @DisplayName("API_EXP_01: GET /api/v1/export/excel - Tải file Excel lịch sử giao dịch thành công (TC_EXP_01, TC_EXP_02)")
    void testExportExcel_Success() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/export/excel")
                        .header("Authorization", "Bearer " + tokenA)
                        .param("from", "2026-09-01")
                        .param("to", "2026-09-30"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("attachment; filename=\"FinMan_GiaoDich_20260901_20260930.xlsx\"")))
                .andReturn();

        byte[] content = result.getResponse().getContentAsByteArray();
        assertNotNull(content);
        assertTrue(content.length > 0);

        // Kiểm tra nội dung file Excel tải về (TC_EXP_02)
        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(content))) {
            assertEquals(2, workbook.getNumberOfSheets());

            Sheet sheet1 = workbook.getSheetAt(0);
            assertEquals("Lịch sử Giao dịch", sheet1.getSheetName());

            // User A có 2 giao dịch theo thứ tự ngày giảm dần:
            // Row 9 là ngày 10/09 (Chi tiêu: 50.000₫)
            assertEquals("Chi tiêu", sheet1.getRow(9).getCell(2).getStringCellValue());
            assertEquals(50_000.0, sheet1.getRow(9).getCell(5).getNumericCellValue());

            // Row 10 là ngày 05/09 (Thu nhập: 10.000.000₫)
            assertEquals("Thu nhập", sheet1.getRow(10).getCell(2).getStringCellValue());
            assertEquals(10_000_000.0, sheet1.getRow(10).getCell(5).getNumericCellValue());

            // Kiểm tra không chứa dữ liệu của user B
            for (int r = 9; r <= sheet1.getLastRowNum(); r++) {
                if (sheet1.getRow(r) != null && sheet1.getRow(r).getCell(6) != null) {
                    assertFalse(sheet1.getRow(r).getCell(6).getStringCellValue().contains("user B"),
                            "File Excel không được lộ dữ liệu của người dùng khác (Multi-tenant isolation)");
                }
            }
        }
    }

    @Test
    @DisplayName("API_EXP_02: GET /api/v1/export/excel?month=2026-09 - Tải file Excel theo định dạng tham số tháng")
    void testExportExcel_WithMonthParam() throws Exception {
        mockMvc.perform(get("/api/v1/export/excel")
                        .header("Authorization", "Bearer " + tokenA)
                        .param("month", "2026-09"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("FinMan_GiaoDich_20260901_20260930.xlsx")));
    }

    @Test
    @DisplayName("API_EXP_03: GET /api/v1/export/excel - Từ chối truy cập 401 khi chưa đăng nhập")
    void testExportExcel_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/export/excel"))
                .andExpect(status().isUnauthorized());
    }
}
