package com.finman.service;

import com.finman.dto.response.CategoryAggregationResponse;
import com.finman.entity.Transaction;
import com.finman.entity.User;
import com.finman.entity.enums.TransactionType;
import com.finman.exception.ResourceNotFoundException;
import com.finman.repository.TransactionRepository;
import com.finman.repository.UserRepository;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.DataFormat;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.DefaultIndexedColorMap;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ExportService {

    private static final Logger log = LoggerFactory.getLogger(ExportService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public ExportService(TransactionRepository transactionRepository, UserRepository userRepository) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    /**
     * Xuất danh sách giao dịch sang file Excel (.xlsx) chuẩn Apache POI với Unicode tiếng Việt,
     * định dạng tiền tệ chuyên nghiệp và sheet thống kê tổng hợp theo danh mục.
     */
    @Transactional(readOnly = true)
    public byte[] exportTransactionsToExcel(
            Long userId,
            LocalDate startDate,
            LocalDate endDate,
            Long accountId,
            Long categoryId,
            TransactionType type) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        LocalDate effectiveStart = startDate != null ? startDate : LocalDate.of(1970, 1, 1);
        LocalDate effectiveEnd = endDate != null ? endDate : LocalDate.of(2099, 12, 31);

        List<Transaction> transactions = transactionRepository.findTransactionsForExport(
                userId, effectiveStart, effectiveEnd, accountId, categoryId, type);

        List<CategoryAggregationResponse> categoryAggregations = transactionRepository.aggregateByCategory(
                userId, effectiveStart, effectiveEnd, accountId, categoryId, type);

        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            DefaultIndexedColorMap colorMap = new DefaultIndexedColorMap();

            // Định nghĩa bảng màu thiết kế thương hiệu FinMan
            XSSFColor navyHeaderColor = new XSSFColor(new byte[]{(byte) 19, (byte) 27, (byte) 46}, colorMap); // #131B2E
            XSSFColor lightBgColor = new XSSFColor(new byte[]{(byte) 218, (byte) 226, (byte) 253}, colorMap); // #DAE2FD
            XSSFColor altRowColor = new XSSFColor(new byte[]{(byte) 248, (byte) 249, (byte) 255}, colorMap); // Subtle zebra
            XSSFColor greenColor = new XSSFColor(new byte[]{(byte) 0, (byte) 108, (byte) 74}, colorMap); // #006C4A
            XSSFColor redColor = new XSSFColor(new byte[]{(byte) 183, (byte) 0, (byte) 17}, colorMap); // #B70011
            XSSFColor grayBorderColor = new XSSFColor(new byte[]{(byte) 215, (byte) 220, (byte) 235}, colorMap);
            XSSFColor blueTransferColor = new XSSFColor(new byte[]{(byte) 30, (byte) 64, (byte) 175}, colorMap); // #1E40AF

            DataFormat dataFormat = workbook.createDataFormat();
            short currencyFormat = dataFormat.getFormat("#,##0 ₫");
            short percentFormat = dataFormat.getFormat("0.0%");

            // Fonts
            XSSFFont titleFont = workbook.createFont();
            titleFont.setFontName("Calibri");
            titleFont.setFontHeightInPoints((short) 16);
            titleFont.setBold(true);
            titleFont.setColor(new XSSFColor(new byte[]{(byte) 255, (byte) 255, (byte) 255}, colorMap));

            XSSFFont headerFont = workbook.createFont();
            headerFont.setFontName("Calibri");
            headerFont.setFontHeightInPoints((short) 11);
            headerFont.setBold(true);
            headerFont.setColor(navyHeaderColor);

            XSSFFont regularFont = workbook.createFont();
            regularFont.setFontName("Calibri");
            regularFont.setFontHeightInPoints((short) 10);

            XSSFFont boldFont = workbook.createFont();
            boldFont.setFontName("Calibri");
            boldFont.setFontHeightInPoints((short) 10);
            boldFont.setBold(true);

            XSSFFont incomeFont = workbook.createFont();
            incomeFont.setFontName("Calibri");
            incomeFont.setFontHeightInPoints((short) 10);
            incomeFont.setBold(true);
            incomeFont.setColor(greenColor);

            XSSFFont expenseFont = workbook.createFont();
            expenseFont.setFontName("Calibri");
            expenseFont.setFontHeightInPoints((short) 10);
            expenseFont.setBold(true);
            expenseFont.setColor(redColor);

            XSSFFont transferFont = workbook.createFont();
            transferFont.setFontName("Calibri");
            transferFont.setFontHeightInPoints((short) 10);
            transferFont.setBold(true);
            transferFont.setColor(blueTransferColor);

            // ==================== SHEET 1: LỊCH SỬ GIAO DỊCH ====================
            Sheet sheet1 = workbook.createSheet("Lịch sử Giao dịch");
            sheet1.setDisplayGridlines(true);

            // Styles Sheet 1
            XSSFCellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);
            titleStyle.setFillForegroundColor(navyHeaderColor);
            titleStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);
            titleStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            XSSFCellStyle metaLabelStyle = workbook.createCellStyle();
            metaLabelStyle.setFont(boldFont);

            XSSFCellStyle metaValueStyle = workbook.createCellStyle();
            metaValueStyle.setFont(regularFont);

            XSSFCellStyle tableHeaderStyle = workbook.createCellStyle();
            tableHeaderStyle.setFont(headerFont);
            tableHeaderStyle.setFillForegroundColor(lightBgColor);
            tableHeaderStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            tableHeaderStyle.setAlignment(HorizontalAlignment.CENTER);
            tableHeaderStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            applyBorders(tableHeaderStyle, grayBorderColor);

            XSSFCellStyle textCenterStyle = workbook.createCellStyle();
            textCenterStyle.setFont(regularFont);
            textCenterStyle.setAlignment(HorizontalAlignment.CENTER);
            applyBorders(textCenterStyle, grayBorderColor);

            XSSFCellStyle textLeftStyle = workbook.createCellStyle();
            textLeftStyle.setFont(regularFont);
            textLeftStyle.setAlignment(HorizontalAlignment.LEFT);
            applyBorders(textLeftStyle, grayBorderColor);

            XSSFCellStyle incomeTypeStyle = workbook.createCellStyle();
            incomeTypeStyle.setFont(incomeFont);
            incomeTypeStyle.setAlignment(HorizontalAlignment.CENTER);
            applyBorders(incomeTypeStyle, grayBorderColor);

            XSSFCellStyle expenseTypeStyle = workbook.createCellStyle();
            expenseTypeStyle.setFont(expenseFont);
            expenseTypeStyle.setAlignment(HorizontalAlignment.CENTER);
            applyBorders(expenseTypeStyle, grayBorderColor);

            XSSFCellStyle incomeAmountStyle = workbook.createCellStyle();
            incomeAmountStyle.setFont(incomeFont);
            incomeAmountStyle.setDataFormat(currencyFormat);
            incomeAmountStyle.setAlignment(HorizontalAlignment.RIGHT);
            applyBorders(incomeAmountStyle, grayBorderColor);

            XSSFCellStyle expenseAmountStyle = workbook.createCellStyle();
            expenseAmountStyle.setFont(expenseFont);
            expenseAmountStyle.setDataFormat(currencyFormat);
            expenseAmountStyle.setAlignment(HorizontalAlignment.RIGHT);
            applyBorders(expenseAmountStyle, grayBorderColor);

            XSSFCellStyle transferTypeStyle = workbook.createCellStyle();
            transferTypeStyle.setFont(transferFont);
            transferTypeStyle.setAlignment(HorizontalAlignment.CENTER);
            applyBorders(transferTypeStyle, grayBorderColor);

            XSSFCellStyle transferAmountStyle = workbook.createCellStyle();
            transferAmountStyle.setFont(transferFont);
            transferAmountStyle.setDataFormat(currencyFormat);
            transferAmountStyle.setAlignment(HorizontalAlignment.RIGHT);
            applyBorders(transferAmountStyle, grayBorderColor);

            XSSFCellStyle zebraTextLeftStyle = workbook.createCellStyle();
            zebraTextLeftStyle.cloneStyleFrom(textLeftStyle);
            zebraTextLeftStyle.setFillForegroundColor(altRowColor);
            zebraTextLeftStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            XSSFCellStyle zebraTextCenterStyle = workbook.createCellStyle();
            zebraTextCenterStyle.cloneStyleFrom(textCenterStyle);
            zebraTextCenterStyle.setFillForegroundColor(altRowColor);
            zebraTextCenterStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            XSSFCellStyle totalLabelStyle = workbook.createCellStyle();
            totalLabelStyle.setFont(boldFont);
            totalLabelStyle.setAlignment(HorizontalAlignment.RIGHT);
            totalLabelStyle.setFillForegroundColor(lightBgColor);
            totalLabelStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            applyBorders(totalLabelStyle, grayBorderColor);
            totalLabelStyle.setBorderBottom(BorderStyle.DOUBLE);

            XSSFCellStyle totalAmountStyle = workbook.createCellStyle();
            totalAmountStyle.setFont(boldFont);
            totalAmountStyle.setDataFormat(currencyFormat);
            totalAmountStyle.setAlignment(HorizontalAlignment.RIGHT);
            totalAmountStyle.setFillForegroundColor(lightBgColor);
            totalAmountStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            applyBorders(totalAmountStyle, grayBorderColor);
            totalAmountStyle.setBorderBottom(BorderStyle.DOUBLE);

            // 1. Title Banner (Rows 0-1)
            Row titleRow = sheet1.createRow(0);
            titleRow.setHeightInPoints(40);
            org.apache.poi.ss.usermodel.Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("FINMAN - BÁO CÁO LỊCH SỬ GIAO DỊCH TÀI CHÍNH");
            titleCell.setCellStyle(titleStyle);
            sheet1.addMergedRegion(new CellRangeAddress(0, 1, 0, 6));

            // Fill merged region dummy cells with style so background is uniform
            for (int r = 0; r <= 1; r++) {
                Row row = sheet1.getRow(r) != null ? sheet1.getRow(r) : sheet1.createRow(r);
                for (int c = 0; c <= 6; c++) {
                    org.apache.poi.ss.usermodel.Cell cell = row.getCell(c) != null ? row.getCell(c) : row.createCell(c);
                    cell.setCellStyle(titleStyle);
                }
            }

            // 2. Metadata (Rows 3-5)
            Row metaRow1 = sheet1.createRow(3);
            createCell(metaRow1, 0, "Chủ tài khoản:", metaLabelStyle);
            createCell(metaRow1, 1, user.getFullName() + " (" + user.getEmail() + ")", metaValueStyle);
            createCell(metaRow1, 4, "Khoảng thời gian:", metaLabelStyle);
            String timeRangeStr = (startDate != null ? startDate.format(DATE_FORMATTER) : "Toàn bộ")
                    + "  đến  "
                    + (endDate != null ? endDate.format(DATE_FORMATTER) : "Hiện tại");
            createCell(metaRow1, 5, timeRangeStr, metaValueStyle);

            Row metaRow2 = sheet1.createRow(4);
            createCell(metaRow2, 0, "Ngày xuất file:", metaLabelStyle);
            createCell(metaRow2, 1, LocalDateTime.now().format(DATETIME_FORMATTER), metaValueStyle);
            createCell(metaRow2, 4, "Tổng số giao dịch:", metaLabelStyle);
            createCell(metaRow2, 5, String.valueOf(transactions.size()), metaValueStyle);

            // Tính toán tổng thu / chi
            long sumIncome = 0L;
            long sumExpense = 0L;
            for (Transaction t : transactions) {
                if (t.getType() == TransactionType.INCOME) {
                    sumIncome += t.getAmount();
                } else if (t.getType() == TransactionType.EXPENSE) {
                    sumExpense += t.getAmount();
                }
            }
            long netCashflow = sumIncome - sumExpense;

            // Summary mini metrics (Row 6)
            Row kpiRow = sheet1.createRow(6);
            createCell(kpiRow, 0, "Tổng Thu Nhập:", metaLabelStyle);
            org.apache.poi.ss.usermodel.Cell kpiIncCell = kpiRow.createCell(1);
            kpiIncCell.setCellValue(sumIncome);
            kpiIncCell.setCellStyle(incomeAmountStyle);

            createCell(kpiRow, 2, "Tổng Chi Tiêu:", metaLabelStyle);
            org.apache.poi.ss.usermodel.Cell kpiExpCell = kpiRow.createCell(3);
            kpiExpCell.setCellValue(sumExpense);
            kpiExpCell.setCellStyle(expenseAmountStyle);

            createCell(kpiRow, 4, "Dòng Tiền Thuần:", metaLabelStyle);
            org.apache.poi.ss.usermodel.Cell kpiNetCell = kpiRow.createCell(5);
            kpiNetCell.setCellValue(netCashflow);
            kpiNetCell.setCellStyle(netCashflow >= 0 ? incomeAmountStyle : expenseAmountStyle);

            // 3. Table Headers (Row 8)
            String[] headers = {
                    "STT",
                    "Ngày giao dịch",
                    "Loại giao dịch",
                    "Danh mục",
                    "Tài khoản / Ví",
                    "Số tiền (VNĐ)",
                    "Ghi chú"
            };

            Row headerRow = sheet1.createRow(8);
            headerRow.setHeightInPoints(26);
            for (int i = 0; i < headers.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(tableHeaderStyle);
            }

            // 4. Data Rows
            int currentRow = 9;
            if (transactions.isEmpty()) {
                Row emptyRow = sheet1.createRow(currentRow);
                org.apache.poi.ss.usermodel.Cell emptyCell = emptyRow.createCell(0);
                emptyCell.setCellValue("Không có giao dịch nào phù hợp với bộ lọc trong khoảng thời gian này.");
                emptyCell.setCellStyle(textLeftStyle);
                sheet1.addMergedRegion(new CellRangeAddress(currentRow, currentRow, 0, 6));
                currentRow++;
            } else {
                int stt = 1;
                for (Transaction t : transactions) {
                    Row row = sheet1.createRow(currentRow);
                    boolean isZebra = (stt % 2 == 0);

                    // Col 0: STT
                    org.apache.poi.ss.usermodel.Cell cStt = row.createCell(0);
                    cStt.setCellValue(stt);
                    cStt.setCellStyle(isZebra ? zebraTextCenterStyle : textCenterStyle);

                    // Col 1: Ngày
                    org.apache.poi.ss.usermodel.Cell cDate = row.createCell(1);
                    cDate.setCellValue(t.getTransactionDate().format(DATE_FORMATTER));
                    cDate.setCellStyle(isZebra ? zebraTextCenterStyle : textCenterStyle);

                    // Col 2: Loại
                    org.apache.poi.ss.usermodel.Cell cType = row.createCell(2);
                    boolean isIncome = (t.getType() == TransactionType.INCOME);
                    boolean isTransfer = (t.getType() == TransactionType.TRANSFER);
                    if (isIncome) {
                        cType.setCellValue("Thu nhập");
                        cType.setCellStyle(incomeTypeStyle);
                    } else if (isTransfer) {
                        cType.setCellValue("Chuyển khoản");
                        cType.setCellStyle(transferTypeStyle);
                    } else {
                        cType.setCellValue("Chi tiêu");
                        cType.setCellStyle(expenseTypeStyle);
                    }

                    // Col 3: Danh mục
                    org.apache.poi.ss.usermodel.Cell cCat = row.createCell(3);
                    if (isTransfer) {
                        cCat.setCellValue("Chuyển khoản nội bộ");
                    } else {
                        cCat.setCellValue(t.getCategory() != null ? t.getCategory().getName() : "Khác");
                    }
                    cCat.setCellStyle(isZebra ? zebraTextLeftStyle : textLeftStyle);

                    // Col 4: Tài khoản
                    org.apache.poi.ss.usermodel.Cell cAcc = row.createCell(4);
                    if (isTransfer) {
                        String fromName = t.getAccount() != null ? t.getAccount().getName() : "Không xác định";
                        String toName = t.getToAccount() != null ? t.getToAccount().getName() : "Không xác định";
                        cAcc.setCellValue(fromName + " ➔ " + toName);
                    } else {
                        cAcc.setCellValue(t.getAccount() != null ? t.getAccount().getName() : "Không xác định");
                    }
                    cAcc.setCellStyle(isZebra ? zebraTextLeftStyle : textLeftStyle);

                    // Col 5: Số tiền
                    org.apache.poi.ss.usermodel.Cell cAmt = row.createCell(5);
                    cAmt.setCellValue(t.getAmount());
                    if (isIncome) {
                        cAmt.setCellStyle(incomeAmountStyle);
                    } else if (isTransfer) {
                        cAmt.setCellStyle(transferAmountStyle);
                    } else {
                        cAmt.setCellStyle(expenseAmountStyle);
                    }

                    // Col 6: Ghi chú
                    org.apache.poi.ss.usermodel.Cell cNote = row.createCell(6);
                    cNote.setCellValue(t.getNote() != null ? t.getNote() : "");
                    cNote.setCellStyle(isZebra ? zebraTextLeftStyle : textLeftStyle);

                    stt++;
                    currentRow++;
                }

                // Total Summary Row
                Row totalRow = sheet1.createRow(currentRow);
                totalRow.setHeightInPoints(22);

                for (int c = 0; c <= 4; c++) {
                    org.apache.poi.ss.usermodel.Cell cLabel = totalRow.createCell(c);
                    cLabel.setCellStyle(totalLabelStyle);
                }
                totalRow.getCell(0).setCellValue("TỔNG CỘNG THU - CHI THUẦN:");
                sheet1.addMergedRegion(new CellRangeAddress(currentRow, currentRow, 0, 4));

                org.apache.poi.ss.usermodel.Cell cTotalAmt = totalRow.createCell(5);
                cTotalAmt.setCellValue(netCashflow);
                cTotalAmt.setCellStyle(totalAmountStyle);

                org.apache.poi.ss.usermodel.Cell cTotalNote = totalRow.createCell(6);
                cTotalNote.setCellValue("");
                cTotalNote.setCellStyle(totalLabelStyle);
            }

            // Auto-size Sheet 1 columns
            for (int i = 0; i < headers.length; i++) {
                sheet1.autoSizeColumn(i);
                int width = sheet1.getColumnWidth(i);
                sheet1.setColumnWidth(i, Math.max(width + 1200, 3400));
            }

            // ==================== SHEET 2: TỔNG HỢP THEO DANH MỤC ====================
            Sheet sheet2 = workbook.createSheet("Tổng hợp theo Danh mục");
            sheet2.setDisplayGridlines(true);

            // Title Banner Sheet 2
            Row titleRow2 = sheet2.createRow(0);
            titleRow2.setHeightInPoints(36);
            org.apache.poi.ss.usermodel.Cell titleCell2 = titleRow2.createCell(0);
            titleCell2.setCellValue("FINMAN - BẢNG TỔNG HỢP THU / CHI THEO DANH MỤC");
            titleCell2.setCellStyle(titleStyle);
            sheet2.addMergedRegion(new CellRangeAddress(0, 1, 0, 5));

            for (int r = 0; r <= 1; r++) {
                Row row = sheet2.getRow(r) != null ? sheet2.getRow(r) : sheet2.createRow(r);
                for (int c = 0; c <= 5; c++) {
                    org.apache.poi.ss.usermodel.Cell cell = row.getCell(c) != null ? row.getCell(c) : row.createCell(c);
                    cell.setCellStyle(titleStyle);
                }
            }

            // Sheet 2 Metadata
            Row metaRow2_1 = sheet2.createRow(3);
            createCell(metaRow2_1, 0, "Chủ tài khoản:", metaLabelStyle);
            createCell(metaRow2_1, 1, user.getFullName(), metaValueStyle);
            createCell(metaRow2_1, 3, "Kỳ báo cáo:", metaLabelStyle);
            createCell(metaRow2_1, 4, timeRangeStr, metaValueStyle);

            // Sheet 2 Table Headers
            String[] catHeaders = {
                    "STT",
                    "Tên Danh mục",
                    "Phân loại",
                    "Số lượt giao dịch",
                    "Tổng số tiền (VNĐ)",
                    "Tỷ trọng (%)"
            };

            Row headerRow2 = sheet2.createRow(5);
            headerRow2.setHeightInPoints(24);
            for (int i = 0; i < catHeaders.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow2.createCell(i);
                cell.setCellValue(catHeaders[i]);
                cell.setCellStyle(tableHeaderStyle);
            }

            XSSFCellStyle percentCellStyle = workbook.createCellStyle();
            percentCellStyle.setFont(boldFont);
            percentCellStyle.setDataFormat(percentFormat);
            percentCellStyle.setAlignment(HorizontalAlignment.RIGHT);
            applyBorders(percentCellStyle, grayBorderColor);

            int catRowIdx = 6;
            if (categoryAggregations.isEmpty()) {
                Row emptyRow2 = sheet2.createRow(catRowIdx);
                org.apache.poi.ss.usermodel.Cell emptyCell2 = emptyRow2.createCell(0);
                emptyCell2.setCellValue("Chưa có danh mục nào phát sinh chi tiêu hoặc thu nhập.");
                emptyCell2.setCellStyle(textLeftStyle);
                sheet2.addMergedRegion(new CellRangeAddress(catRowIdx, catRowIdx, 0, 5));
            } else {
                int catStt = 1;
                for (CategoryAggregationResponse agg : categoryAggregations) {
                    Row row = sheet2.createRow(catRowIdx);
                    boolean isIncome = (agg.getType() == TransactionType.INCOME);
                    long baseTotal = isIncome ? sumIncome : sumExpense;
                    double pct = baseTotal > 0 ? (double) agg.getTotalAmount() / baseTotal : 0.0;

                    // Col 0: STT
                    org.apache.poi.ss.usermodel.Cell c0 = row.createCell(0);
                    c0.setCellValue(catStt);
                    c0.setCellStyle(textCenterStyle);

                    // Col 1: Tên Danh mục
                    org.apache.poi.ss.usermodel.Cell c1 = row.createCell(1);
                    c1.setCellValue(agg.getCategoryName() != null ? agg.getCategoryName() : "Khác");
                    c1.setCellStyle(textLeftStyle);

                    // Col 2: Phân loại
                    org.apache.poi.ss.usermodel.Cell c2 = row.createCell(2);
                    c2.setCellValue(isIncome ? "Thu nhập" : "Chi tiêu");
                    c2.setCellStyle(isIncome ? incomeTypeStyle : expenseTypeStyle);

                    // Col 3: Số lượt giao dịch
                    org.apache.poi.ss.usermodel.Cell c3 = row.createCell(3);
                    c3.setCellValue(agg.getTransactionCount());
                    c3.setCellStyle(textCenterStyle);

                    // Col 4: Tổng số tiền
                    org.apache.poi.ss.usermodel.Cell c4 = row.createCell(4);
                    c4.setCellValue(agg.getTotalAmount());
                    c4.setCellStyle(isIncome ? incomeAmountStyle : expenseAmountStyle);

                    // Col 5: Tỷ trọng
                    org.apache.poi.ss.usermodel.Cell c5 = row.createCell(5);
                    c5.setCellValue(pct);
                    c5.setCellStyle(percentCellStyle);

                    catStt++;
                    catRowIdx++;
                }
            }

            // Auto-size Sheet 2 columns
            for (int i = 0; i < catHeaders.length; i++) {
                sheet2.autoSizeColumn(i);
                int width = sheet2.getColumnWidth(i);
                sheet2.setColumnWidth(i, Math.max(width + 1200, 3400));
            }

            workbook.write(out);
            log.info("Xuất file Excel thành công cho người dùng id={}, tổng giao dịch={}", userId, transactions.size());
            return out.toByteArray();

        } catch (IOException e) {
            log.error("Lỗi khi ghi luồng Excel: ", e);
            throw new RuntimeException("Lỗi hệ thống khi khởi tạo file Excel: " + e.getMessage(), e);
        }
    }

    private void createCell(Row row, int col, String value, CellStyle style) {
        org.apache.poi.ss.usermodel.Cell cell = row.createCell(col);
        cell.setCellValue(value != null ? value : "");
        cell.setCellStyle(style);
    }

    private void applyBorders(XSSFCellStyle style, XSSFColor color) {
        style.setBorderTop(BorderStyle.THIN);
        style.setTopBorderColor(color);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBottomBorderColor(color);
        style.setBorderLeft(BorderStyle.THIN);
        style.setLeftBorderColor(color);
        style.setBorderRight(BorderStyle.THIN);
        style.setRightBorderColor(color);
    }
}
