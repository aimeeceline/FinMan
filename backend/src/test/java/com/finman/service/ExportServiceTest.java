package com.finman.service;

import com.finman.dto.response.CategoryAggregationResponse;
import com.finman.entity.Account;
import com.finman.entity.Category;
import com.finman.entity.Transaction;
import com.finman.entity.User;
import com.finman.entity.enums.AccountType;
import com.finman.entity.enums.CategoryType;
import com.finman.entity.enums.TransactionType;
import com.finman.exception.ResourceNotFoundException;
import com.finman.repository.TransactionRepository;
import com.finman.repository.UserRepository;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExportServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ExportService exportService;

    private User testUser;
    private Account testAccount;
    private Category testExpenseCat;
    private Category testIncomeCat;
    private List<Transaction> testTransactions;
    private List<CategoryAggregationResponse> testCategoryAggs;

    @BeforeEach
    void setUp() {
        testUser = new User("khang.nguyen@finman.com", "hashpass", "Nguyễn Minh Khang");
        testUser.setId(1L);

        testAccount = new Account(testUser, "Ví MoMo", AccountType.BANK, 5_000_000L);
        testAccount.setId(10L);

        testExpenseCat = new Category(testUser, "Ăn uống & Cafe", CategoryType.EXPENSE, "restaurant", false);
        testExpenseCat.setId(101L);

        testIncomeCat = new Category(testUser, "Lương & Thưởng", CategoryType.INCOME, "payments", false);
        testIncomeCat.setId(102L);

        Transaction t1 = new Transaction(
                testUser, testAccount, testIncomeCat, TransactionType.INCOME, 6_000_000L,
                LocalDate.of(2026, 9, 1), "Lương công ty chuyển khoản");
        t1.setId(1001L);

        Transaction t2 = new Transaction(
                testUser, testAccount, testExpenseCat, TransactionType.EXPENSE, 90_000L,
                LocalDate.of(2026, 9, 5), "Cà phê sáng Highlands");
        t2.setId(1002L);

        Transaction t3 = new Transaction(
                testUser, testAccount, testExpenseCat, TransactionType.EXPENSE, 1_000_000L,
                LocalDate.of(2026, 9, 12), "Sắm áo sơ mi Zara");
        t3.setId(1003L);

        testTransactions = new ArrayList<>(List.of(t1, t2, t3));

        CategoryAggregationResponse agg1 = new CategoryAggregationResponse(
                101L, "Ăn uống & Cafe", "restaurant", TransactionType.EXPENSE, 1_090_000L, 2L);
        CategoryAggregationResponse agg2 = new CategoryAggregationResponse(
                102L, "Lương & Thưởng", "payments", TransactionType.INCOME, 6_000_000L, 1L);

        testCategoryAggs = new ArrayList<>(List.of(agg1, agg2));
    }

    @Test
    @DisplayName("TC_EXP_01: Xuất Excel thành công - Tạo file .xlsx hợp lệ với đầy đủ 2 Sheet và Unicode tiếng Việt")
    void testExportTransactionsToExcel_Success() throws IOException {
        LocalDate start = LocalDate.of(2026, 9, 1);
        LocalDate end = LocalDate.of(2026, 9, 30);

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(transactionRepository.findTransactionsForExport(
                eq(1L), eq(start), eq(end), isNull(), isNull(), isNull()))
                .thenReturn(testTransactions);
        when(transactionRepository.aggregateByCategory(
                eq(1L), eq(start), eq(end), isNull(), isNull(), isNull()))
                .thenReturn(testCategoryAggs);

        byte[] excelBytes = exportService.exportTransactionsToExcel(1L, start, end, null, null, null);

        assertNotNull(excelBytes);
        assertTrue(excelBytes.length > 0, "File Excel sinh ra không được rỗng");

        // Đọc lại bằng POI để xác thực tính toàn vẹn (TC_EXP_02)
        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(excelBytes))) {
            assertEquals(2, workbook.getNumberOfSheets(), "Excel phải chứa 2 Sheets");

            // Kiểm tra Sheet 1: Lịch sử Giao dịch
            Sheet sheet1 = workbook.getSheetAt(0);
            assertEquals("Lịch sử Giao dịch", sheet1.getSheetName());

            Row titleRow = sheet1.getRow(0);
            assertNotNull(titleRow);
            assertTrue(titleRow.getCell(0).getStringCellValue().contains("FINMAN"));

            // Metadata: Tên chủ tài khoản
            Row metaRow1 = sheet1.getRow(3);
            assertTrue(metaRow1.getCell(1).getStringCellValue().contains("Nguyễn Minh Khang"));

            // KPI row (Row 6): Thu nhập, Chi tiêu, Dòng tiền thuần
            Row kpiRow = sheet1.getRow(6);
            assertEquals(6_000_000.0, kpiRow.getCell(1).getNumericCellValue());
            assertEquals(1_090_000.0, kpiRow.getCell(3).getNumericCellValue());
            assertEquals(4_910_000.0, kpiRow.getCell(5).getNumericCellValue());

            // Header row (Row 8)
            Row headerRow = sheet1.getRow(8);
            assertEquals("STT", headerRow.getCell(0).getStringCellValue());
            assertEquals("Ngày giao dịch", headerRow.getCell(1).getStringCellValue());
            assertEquals("Loại giao dịch", headerRow.getCell(2).getStringCellValue());
            assertEquals("Danh mục", headerRow.getCell(3).getStringCellValue());
            assertEquals("Tài khoản / Ví", headerRow.getCell(4).getStringCellValue());
            assertEquals("Số tiền (VNĐ)", headerRow.getCell(5).getStringCellValue());
            assertEquals("Ghi chú", headerRow.getCell(6).getStringCellValue());

            // Dữ liệu giao dịch 1 (Row 9)
            Row dataRow1 = sheet1.getRow(9);
            assertEquals(1.0, dataRow1.getCell(0).getNumericCellValue());
            assertEquals("Thu nhập", dataRow1.getCell(2).getStringCellValue());
            assertEquals("Lương & Thưởng", dataRow1.getCell(3).getStringCellValue());
            assertEquals(6_000_000.0, dataRow1.getCell(5).getNumericCellValue());

            // Dữ liệu giao dịch 2 (Row 10)
            Row dataRow2 = sheet1.getRow(10);
            assertEquals(2.0, dataRow2.getCell(0).getNumericCellValue());
            assertEquals("Chi tiêu", dataRow2.getCell(2).getStringCellValue());
            assertEquals("Ăn uống & Cafe", dataRow2.getCell(3).getStringCellValue());
            assertEquals(90_000.0, dataRow2.getCell(5).getNumericCellValue());

            // Hàng tổng kết (Row 12)
            Row totalRow = sheet1.getRow(12);
            assertTrue(totalRow.getCell(0).getStringCellValue().contains("TỔNG CỘNG THU - CHI THUẦN"));
            assertEquals(4_910_000.0, totalRow.getCell(5).getNumericCellValue());

            // Kiểm tra Sheet 2: Tổng hợp theo Danh mục
            Sheet sheet2 = workbook.getSheetAt(1);
            assertEquals("Tổng hợp theo Danh mục", sheet2.getSheetName());

            Row catTitle = sheet2.getRow(0);
            assertTrue(catTitle.getCell(0).getStringCellValue().contains("BẢNG TỔNG HỢP THU / CHI THEO DANH MỤC"));

            Row catHeader = sheet2.getRow(5);
            assertEquals("Tên Danh mục", catHeader.getCell(1).getStringCellValue());
            assertEquals("Phân loại", catHeader.getCell(2).getStringCellValue());
            assertEquals("Tổng số tiền (VNĐ)", catHeader.getCell(4).getStringCellValue());
            assertEquals("Tỷ trọng (%)", catHeader.getCell(5).getStringCellValue());

            // Dòng danh mục 1
            Row catRow1 = sheet2.getRow(6);
            assertEquals("Ăn uống & Cafe", catRow1.getCell(1).getStringCellValue());
            assertEquals("Chi tiêu", catRow1.getCell(2).getStringCellValue());
            assertEquals(1_090_000.0, catRow1.getCell(4).getNumericCellValue());
            // Tỷ trọng = 1.090.000 / 1.090.000 = 100%
            assertEquals(1.0, catRow1.getCell(5).getNumericCellValue(), 0.001);
        }
    }

    @Test
    @DisplayName("TC_EXP_02: Xuất Excel khi danh sách giao dịch rỗng - Hiển thị dòng thông báo thân thiện không lỗi")
    void testExportTransactionsToExcel_EmptyData() throws IOException {
        LocalDate start = LocalDate.of(2026, 9, 1);
        LocalDate end = LocalDate.of(2026, 9, 30);

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(transactionRepository.findTransactionsForExport(
                eq(1L), eq(start), eq(end), isNull(), isNull(), isNull()))
                .thenReturn(Collections.emptyList());
        when(transactionRepository.aggregateByCategory(
                eq(1L), eq(start), eq(end), isNull(), isNull(), isNull()))
                .thenReturn(Collections.emptyList());

        byte[] excelBytes = exportService.exportTransactionsToExcel(1L, start, end, null, null, null);

        assertNotNull(excelBytes);
        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(excelBytes))) {
            Sheet sheet1 = workbook.getSheetAt(0);
            Row emptyRow = sheet1.getRow(9);
            assertNotNull(emptyRow);
            assertTrue(emptyRow.getCell(0).getStringCellValue().contains("Không có giao dịch nào phù hợp"));

            Sheet sheet2 = workbook.getSheetAt(1);
            Row emptyCatRow = sheet2.getRow(6);
            assertNotNull(emptyCatRow);
            assertTrue(emptyCatRow.getCell(0).getStringCellValue().contains("Chưa có danh mục nào phát sinh"));
        }
    }

    @Test
    @DisplayName("TC_EXP_03: Ném ngoại lệ ResourceNotFoundException khi người dùng không tồn tại")
    void testExportTransactionsToExcel_UserNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                exportService.exportTransactionsToExcel(999L, null, null, null, null, null));
    }

    @Test
    @DisplayName("TC_EXP_04: Xuất Excel chứa giao dịch TRANSFER - Hiển thị Chuyển khoản, Chuyển khoản nội bộ và Ví nguồn ➔ Ví đích")
    void testExportTransactionsToExcel_WithTransferTransaction() throws IOException {
        LocalDate start = LocalDate.of(2026, 9, 1);
        LocalDate end = LocalDate.of(2026, 9, 30);

        Account toAcc = new Account(testUser, "Nuôi con nhỏ", AccountType.CASH, 2_000_000L);
        toAcc.setId(11L);

        Transaction transferTxn = new Transaction(
                testUser, testAccount, toAcc, null, TransactionType.TRANSFER, 500_000L,
                LocalDate.of(2026, 9, 10), "Trích quỹ nuôi con");
        transferTxn.setId(1004L);

        List<Transaction> txns = List.of(transferTxn);

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(transactionRepository.findTransactionsForExport(
                eq(1L), eq(start), eq(end), isNull(), isNull(), isNull()))
                .thenReturn(txns);
        when(transactionRepository.aggregateByCategory(
                eq(1L), eq(start), eq(end), isNull(), isNull(), isNull()))
                .thenReturn(Collections.emptyList());

        byte[] excelBytes = exportService.exportTransactionsToExcel(1L, start, end, null, null, null);

        assertNotNull(excelBytes);
        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(excelBytes))) {
            Sheet sheet1 = workbook.getSheetAt(0);
            Row row = sheet1.getRow(9);
            assertNotNull(row);
            // Col 2: Loại giao dịch
            assertEquals("Chuyển khoản", row.getCell(2).getStringCellValue());
            // Col 3: Danh mục
            assertEquals("Chuyển khoản nội bộ", row.getCell(3).getStringCellValue());
            // Col 4: Tài khoản nguồn ➔ đích
            assertEquals("Ví MoMo ➔ Nuôi con nhỏ", row.getCell(4).getStringCellValue());
            // Col 5: Số tiền
            assertEquals(500_000.0, row.getCell(5).getNumericCellValue());
            // Col 6: Ghi chú
            assertEquals("Trích quỹ nuôi con", row.getCell(6).getStringCellValue());
        }
    }
}
