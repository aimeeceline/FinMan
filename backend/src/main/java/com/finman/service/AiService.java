package com.finman.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.finman.client.GeminiClient;
import com.finman.config.GeminiConfig;
import com.finman.dto.response.AiInsightsResponse;
import com.finman.dto.response.AiQuickAddItem;
import com.finman.dto.response.AiQuickAddResponse;
import com.finman.entity.Account;
import com.finman.entity.Category;
import com.finman.entity.enums.AccountType;
import com.finman.entity.enums.CategoryType;
import com.finman.entity.enums.TransactionType;
import com.finman.exception.BusinessValidationException;
import com.finman.repository.AccountRepository;
import com.finman.repository.CategoryRepository;
import com.finman.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import com.finman.dto.response.AiChatResponse;
import com.finman.entity.Budget;
import com.finman.entity.Transaction;
import com.finman.repository.BudgetRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Transactional(readOnly = true)
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);

    private final GeminiClient geminiClient;
    private final GeminiConfig geminiConfig;
    private final CategoryRepository categoryRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final ObjectMapper objectMapper;

    public AiService(GeminiClient geminiClient,
            GeminiConfig geminiConfig,
            CategoryRepository categoryRepository,
            AccountRepository accountRepository,
            TransactionRepository transactionRepository,
            BudgetRepository budgetRepository,
            ObjectMapper objectMapper) {
        this.geminiClient = geminiClient;
        this.geminiConfig = geminiConfig;
        this.categoryRepository = categoryRepository;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.budgetRepository = budgetRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Bóc tách câu nói tự nhiên tiếng Việt ra thông tin giao dịch tài chính
     * và tự động map với Danh mục và Tài khoản thật của người dùng.
     */
    public AiQuickAddResponse parseTransactionFromText(Long userId, String text) {
        if (text == null || text.trim().isEmpty()) {
            throw new BusinessValidationException("Nội dung câu lệnh không được để trống");
        }

        String trimmedText = text.trim();
        List<Category> userCategories = categoryRepository.findAllAvailableForUser(userId);
        List<Account> userAccounts = accountRepository.findByUserIdAndIsArchivedFalse(userId);

        if (userAccounts.isEmpty()) {
            throw new BusinessValidationException("Người dùng chưa có tài khoản ví khả dụng");
        }

        // 1. Thử gọi Google Gemini API nếu đã cấu hình key
        if (geminiConfig.hasApiKey()) {
            try {
                return parseWithGemini(userId, trimmedText, userCategories, userAccounts);
            } catch (BusinessValidationException ex) {
                // Lỗi validation nghiệp vụ (ví dụ: không có số tiền, không nhận diện được)
                throw ex;
            } catch (Exception ex) {
                log.warn("Gemini API call failed, falling back to local NLP parser: {}", ex.getMessage());
                // Nếu Gemini bị lỗi mạng / timeout / rate limit mà không phải test bắt buộc,
                // fallback sang bộ parser cục bộ thông minh
                return parseLocally(trimmedText, userCategories, userAccounts);
            }
        }

        // 2. Chế độ phân tích cục bộ (Local Vietnamese Financial NLP Engine)
        return parseLocally(trimmedText, userCategories, userAccounts);
    }

    /**
     * Gọi Gemini API với structured prompt và ánh xạ kết quả JSON trả về.
     */
    private AiQuickAddResponse parseWithGemini(Long userId, String text,
            List<Category> userCategories,
            List<Account> userAccounts) {
        String currentDate = LocalDate.now().toString();
        String yesterdayDate = LocalDate.now().minusDays(1).toString();

        StringBuilder catList = new StringBuilder();
        for (Category c : userCategories) {
            catList.append(String.format("- %s [%s]\n", c.getName(), c.getType()));
        }

        StringBuilder accList = new StringBuilder();
        for (Account a : userAccounts) {
            accList.append(String.format("- %s [%s]\n", a.getName(), a.getType()));
        }

        String prompt = String.format(
                """
                        Bạn là trợ lý AI trích xuất dữ liệu giao dịch tài chính cho ứng dụng FinMan tại Việt Nam.
                        Hôm nay là: %s. Hôm qua là: %s.

                        DANH SÁCH DANH MỤC KHẢ DỤNG:
                        %s

                        DANH SÁCH TÀI KHOẢN VÍ KHẢ DỤNG:
                        %s

                        NHIỆM VỤ:
                        Phân tích câu nói tiếng Việt của người dùng. Người dùng CÓ THỂ NHẬP 1 HOẶC NHIỀU GIAO DỊCH trong cùng một câu (ngăn cách bởi dấu phẩy, từ "và", "rồi", "sau đó", hoặc từng vế độc lập).
                        Ví dụ: "Ăn phở 50k ví tiền mặt và đổ xăng 70k thẻ techcombank" -> có 2 giao dịch.
                        "%s"

                        Hãy trích xuất thành mảng các giao dịch trong JSON:
                        {
                          "isRecognized": true,
                          "transactions": [
                            {
                              "type": "EXPENSE" hoặc "INCOME",
                              "amount": số nguyên dương (đơn vị VNĐ, ví dụ: 45k -> 45000, 350k -> 350000, 1.5tr -> 1500000),
                              "categoryName": tên danh mục gợi ý phù hợp nhất từ danh sách trên,
                              "accountName": tên tài khoản ví được nhắc tới (nếu người dùng không nói rõ, mặc định là "Tiền mặt"),
                              "note": mô tả ngắn gọn nội dung chi tiêu/thu nhập (ví dụ: Ăn phở, Đổ xăng, Mẹ cho tiền...),
                              "transactionDate": ngày theo định dạng YYYY-MM-DD
                            }
                          ]
                        }

                        NẾU CÂU NÓI KHÔNG CÓ SỐ TIỀN HOẶC KHÔNG PHẢI LÀ GIAO DỊCH THU/CHI (ví dụ chào hỏi, thời tiết, câu không liên quan), HÃY TRẢ VỀ:
                        {
                          "isRecognized": false,
                          "error": "Không thể nhận diện giao dịch. Vui lòng nhập rõ số tiền và nội dung."
                        }

                        LƯU Ý: Chỉ trả về duy nhất chuỗi JSON hợp lệ, không kèm markdown hoặc giải thích.
                        """,
                currentDate, yesterdayDate, catList, accList, text);

        String jsonResult = geminiClient.generateContent(prompt, true);

        try {
            JsonNode root = objectMapper.readTree(jsonResult);
            boolean isRecognized = root.path("isRecognized").asBoolean(true);

            if (!isRecognized) {
                String errorMsg = root.path("error")
                        .asText("Không thể nhận diện giao dịch. Vui lòng nhập rõ số tiền và nội dung.");
                throw new BusinessValidationException(errorMsg);
            }

            List<AiQuickAddItem> items = new ArrayList<>();
            JsonNode txnsNode = root.path("transactions");

            if (txnsNode.isArray() && !txnsNode.isEmpty()) {
                for (JsonNode node : txnsNode) {
                    long amount = node.path("amount").asLong(0);
                    if (amount <= 0)
                        continue;

                    String typeStr = node.path("type").asText("EXPENSE").toUpperCase();
                    TransactionType type = typeStr.equals("INCOME") ? TransactionType.INCOME : TransactionType.EXPENSE;

                    String categoryName = node.path("categoryName").asText("");
                    String accountName = node.path("accountName").asText("");
                    String note = node.path("note").asText(text);
                    String dateStr = node.path("transactionDate").asText("");

                    LocalDate txnDate;
                    try {
                        txnDate = (dateStr == null || dateStr.isBlank() || dateStr.equalsIgnoreCase("null"))
                                ? LocalDate.now()
                                : LocalDate.parse(dateStr);
                    } catch (Exception e) {
                        txnDate = LocalDate.now();
                    }

                    Category matchedCategory = matchCategory(categoryName, type, userCategories, note);
                    Account matchedAccount = matchAccount(accountName, userAccounts, note);

                    items.add(new AiQuickAddItem(
                            type,
                            amount,
                            matchedCategory.getId(),
                            matchedCategory.getName(),
                            matchedCategory.getIcon(),
                            matchedAccount.getId(),
                            matchedAccount.getName(),
                            matchedAccount.getType(),
                            txnDate,
                            note,
                            "GEMINI_2.5_FLASH"));
                }
            } else if (root.has("amount") && root.path("amount").asLong(0) > 0) {
                long amount = root.path("amount").asLong(0);
                String typeStr = root.path("type").asText("EXPENSE").toUpperCase();
                TransactionType type = typeStr.equals("INCOME") ? TransactionType.INCOME : TransactionType.EXPENSE;

                String categoryName = root.path("categoryName").asText("");
                String accountName = root.path("accountName").asText("");
                String note = root.path("note").asText(text);
                String dateStr = root.path("transactionDate").asText("");

                LocalDate txnDate;
                try {
                    txnDate = (dateStr == null || dateStr.isBlank() || dateStr.equalsIgnoreCase("null"))
                            ? LocalDate.now()
                            : LocalDate.parse(dateStr);
                } catch (Exception e) {
                    txnDate = LocalDate.now();
                }

                Category matchedCategory = matchCategory(categoryName, type, userCategories, text);
                Account matchedAccount = matchAccount(accountName, userAccounts, text);

                items.add(new AiQuickAddItem(
                        type,
                        amount,
                        matchedCategory.getId(),
                        matchedCategory.getName(),
                        matchedCategory.getIcon(),
                        matchedAccount.getId(),
                        matchedAccount.getName(),
                        matchedAccount.getType(),
                        txnDate,
                        note,
                        "GEMINI_2.5_FLASH"));
            }

            if (items.isEmpty()) {
                String errorMsg = root.path("error")
                        .asText("Không thể nhận diện giao dịch. Vui lòng nhập rõ số tiền và nội dung.");
                throw new BusinessValidationException(errorMsg);
            }

            AiQuickAddResponse response = new AiQuickAddResponse();
            response.setRawText(text);
            response.setSource("GEMINI_2.5_FLASH");
            response.setItems(items);
            return response;

        } catch (BusinessValidationException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Error parsing Gemini JSON response: {}, falling back locally", ex.getMessage());
            return parseLocally(text, userCategories, userAccounts);
        }
    }

    /**
     * Bộ phân tích cú pháp ngôn ngữ tự nhiên tài chính tiếng Việt cục bộ (Local
     * Fallback Parser).
     * Hỗ trợ cả câu đơn và câu chứa nhiều giao dịch (ngăn cách bởi dấu phẩy, từ
     * "và", "rồi", "sau đó").
     */
    public AiQuickAddResponse parseLocally(String text, List<Category> userCategories, List<Account> userAccounts) {
        String[] clauses = text.split("(?i)(?:\\s+và\\s+|\\s+rồi\\s+|\\s+sau đó\\s+|,\\s*|;\\s*|\\n+)");
        List<AiQuickAddItem> items = new ArrayList<>();

        for (String clause : clauses) {
            String clauseTrimmed = clause.trim();
            if (clauseTrimmed.isEmpty())
                continue;

            String norm = removeAccents(clauseTrimmed).toLowerCase(Locale.ROOT);
            Long amt = extractAmount(clauseTrimmed, norm);

            if (amt != null && amt > 0) {
                TransactionType type = TransactionType.EXPENSE;
                if (norm.contains("luong") || norm.contains("thuong") || norm.contains("nhan tien")
                        || norm.contains("thu nhap") || norm.contains("freelance") || norm.contains("lai suat")
                        || norm.contains("dau tu") || norm.contains("ban hang")
                        || norm.contains("cho") || norm.contains("tang") || norm.contains("li xi")
                        || norm.contains("mung tuoi")) {
                    type = TransactionType.INCOME;
                }

                Category matchedCategory = detectCategoryLocally(norm, type, userCategories);
                Account matchedAccount = detectAccountLocally(norm, userAccounts);
                String note = extractNoteLocally(clauseTrimmed, norm);

                LocalDate txnDate = LocalDate.now();
                if (norm.contains("hom qua")) {
                    txnDate = txnDate.minusDays(1);
                } else if (norm.contains("hom kia")) {
                    txnDate = txnDate.minusDays(2);
                }

                items.add(new AiQuickAddItem(
                        type,
                        amt,
                        matchedCategory.getId(),
                        matchedCategory.getName(),
                        matchedCategory.getIcon(),
                        matchedAccount.getId(),
                        matchedAccount.getName(),
                        matchedAccount.getType(),
                        txnDate,
                        note,
                        "LOCAL_FALLBACK"));
            }
        }

        if (items.isEmpty()) {
            String normalized = removeAccents(text).toLowerCase(Locale.ROOT);
            Long amount = extractAmount(text, normalized);
            if (amount == null || amount <= 0) {
                throw new BusinessValidationException(
                        "Không thể nhận diện giao dịch. Vui lòng nhập rõ số tiền và nội dung.");
            }

            TransactionType type = TransactionType.EXPENSE;
            if (normalized.contains("luong") || normalized.contains("thuong") || normalized.contains("nhan tien")
                    || normalized.contains("thu nhap") || normalized.contains("freelance")
                    || normalized.contains("lai suat")
                    || normalized.contains("dau tu") || normalized.contains("ban hang")
                    || normalized.contains("cho") || normalized.contains("tang") || normalized.contains("li xi")
                    || normalized.contains("mung tuoi")) {
                type = TransactionType.INCOME;
            }

            Category matchedCategory = detectCategoryLocally(normalized, type, userCategories);
            Account matchedAccount = detectAccountLocally(normalized, userAccounts);
            String note = extractNoteLocally(text, normalized);

            LocalDate txnDate = LocalDate.now();
            if (normalized.contains("hom qua")) {
                txnDate = txnDate.minusDays(1);
            } else if (normalized.contains("hom kia")) {
                txnDate = txnDate.minusDays(2);
            }

            items.add(new AiQuickAddItem(
                    type,
                    amount,
                    matchedCategory.getId(),
                    matchedCategory.getName(),
                    matchedCategory.getIcon(),
                    matchedAccount.getId(),
                    matchedAccount.getName(),
                    matchedAccount.getType(),
                    txnDate,
                    note,
                    "LOCAL_FALLBACK"));
        }

        AiQuickAddResponse response = new AiQuickAddResponse();
        response.setRawText(text);
        response.setSource("LOCAL_FALLBACK");
        response.setItems(items);
        return response;
    }

    private Long extractAmount(String originalText, String normalized) {
        // Regex tìm số tiền dạng: 45k, 350k, 1.5tr, 1.5 triệu, 50 nghìn, 500.000,
        // 500000đ...
        Pattern pattern = Pattern.compile("(?i)(\\d+(?:[.,]\\d+)?)\\s*(k|nghin|ngan|tr|trieu|m|d|dong|vnd)?");
        Matcher matcher = pattern.matcher(normalized);

        Long foundAmount = null;

        while (matcher.find()) {
            String numStr = matcher.group(1).replace(",", ".");
            String unit = matcher.group(2) != null ? matcher.group(2).toLowerCase() : "";

            try {
                double val = Double.parseDouble(numStr);
                if (unit.equals("k") || unit.equals("nghin") || unit.equals("ngan")) {
                    foundAmount = (long) (val * 1_000);
                    break;
                } else if (unit.equals("tr") || unit.equals("trieu") || unit.equals("m")) {
                    foundAmount = (long) (val * 1_000_000);
                    break;
                } else if (unit.equals("d") || unit.equals("dong") || unit.equals("vnd")) {
                    foundAmount = (long) val;
                    break;
                } else {
                    // Không có đơn vị rõ ràng: nếu số >= 1000 thì nhận trực tiếp
                    if (val >= 1000) {
                        foundAmount = (long) val;
                        break;
                    }
                }
            } catch (Exception ignored) {
            }
        }

        return foundAmount;
    }

    private String extractNoteLocally(String originalText, String normalized) {
        // Loại bỏ các cụm từ chỉ tài khoản và số tiền ra khỏi text để làm note
        String cleaned = originalText;
        cleaned = cleaned.replaceAll("(?i)(\\d+(?:[.,]\\d+)?)\\s*(k|nghìn|ngàn|tr|triệu|m|đ|d|đồng|vnd)?", "");
        cleaned = cleaned.replaceAll(
                "(?i)(bằng|qua|từ|vao|vào)?\\s*(tiền mặt|ngân hàng|the ngan hang|thẻ ngân hàng|thẻ tín dụng|ví|vi|the|credit|bank|cash)",
                "");
        cleaned = cleaned.replaceAll("(?i)(hôm nay|hôm qua|hom nay|hom qua)", "");
        cleaned = cleaned.trim();
        cleaned = cleaned.replaceAll("^[\\s,.-]+|[\\s,.-]+$", "");

        if (cleaned.isBlank()) {
            return originalText.trim();
        }
        return cleaned;
    }

    private Category detectCategoryLocally(String normalized, TransactionType type, List<Category> userCategories) {
        if (type == TransactionType.INCOME) {
            if (hasWord(normalized, "luong"))
                return findCategoryByName(userCategories, "Lương");
            if (hasWord(normalized, "thuong", "tang", "cho", "li xi", "mung tuoi"))
                return findCategoryByName(userCategories, "Thưởng");
            if (hasWord(normalized, "dau tu", "co phieu", "chung khoan"))
                return findCategoryByName(userCategories, "Đầu tư");
            if (hasWord(normalized, "freelance"))
                return findCategoryByName(userCategories, "Freelance");
            return findCategoryByName(userCategories, "Thu nhập khác");
        }

        // Loại bỏ cụm từ chỉ tài khoản khỏi câu để không gây nhầm lẫn (ví dụ: "ngan
        // hang" có chứa "an")
        String textNoAccount = normalized
                .replaceAll("(?i)\\b(ngan hang|the ngan hang|the tin dung|tin dung|tien mat|the|vi|bank|cash)\\b", " ");

        // 1. Áo quần
        if (hasWord(textNoAccount, "ao", "quan", "vay", "giay", "dep", "ao so mi", "quan jean", "so mi")) {
            return findCategoryByName(userCategories, "Áo quần");
        }

        // 2. Ăn uống
        if (hasWord(textNoAccount, "bun bo", "pho", "com", "ca phe", "cafe", "an", "an uong", "uong", "banh mi",
                "tra sua")) {
            return findCategoryByName(userCategories, "Ăn uống");
        }

        // 3. Giao thông
        if (hasWord(textNoAccount, "xang", "grab", "be", "taxi", "gui xe", "xe buyt", "xe")) {
            return findCategoryByName(userCategories, "Giao thông");
        }

        // 4. Mua sắm
        if (hasWord(textNoAccount, "sieu thi", "mua sam", "shopee", "lazada", "tiki")) {
            return findCategoryByName(userCategories, "Mua sắm");
        }

        // 5. Giải trí
        if (hasWord(textNoAccount, "xem phim", "game", "du lich", "karaoke", "rap")) {
            return findCategoryByName(userCategories, "Giải trí");
        }

        // 6. Sinh hoạt
        if (hasWord(textNoAccount, "dien", "nuoc", "tien nha", "internet", "wifi")) {
            return findCategoryByName(userCategories, "Sinh hoạt");
        }

        // 7. Sức khỏe
        if (hasWord(textNoAccount, "thuoc", "benh vien", "kham", "bac si")) {
            return findCategoryByName(userCategories, "Sức khỏe");
        }

        // 8. Giáo dục
        if (hasWord(textNoAccount, "hoc phi", "sach", "khoa hoc", "hoc")) {
            return findCategoryByName(userCategories, "Giáo dục");
        }

        return findCategoryByName(userCategories, "Chi tiêu khác");
    }

    private boolean hasWord(String text, String... words) {
        for (String w : words) {
            if (Pattern.compile("(?i)(^|\\s|[,.-])" + Pattern.quote(w) + "($|\\s|[,.-])").matcher(text).find()) {
                return true;
            }
        }
        return false;
    }

    private Account detectAccountLocally(String normalized, List<Account> userAccounts) {
        if (normalized.contains("ngan hang") || normalized.contains("bank") || normalized.contains("vcb")
                || normalized.contains("mb") || normalized.contains("tpbank") || normalized.contains("vietcombank")) {
            Account bank = findAccountByType(userAccounts, AccountType.BANK);
            if (bank != null)
                return bank;
        }

        if (normalized.contains("the tin dung") || normalized.contains("tin dung")
                || normalized.contains("credit") || normalized.contains("the")) {
            Account credit = findAccountByType(userAccounts, AccountType.CREDIT_CARD);
            if (credit != null)
                return credit;
        }

        // Mặc định hoặc khi có chữ "tiền mặt", "ví", "cash"
        Account cash = findAccountByType(userAccounts, AccountType.CASH);
        if (cash != null)
            return cash;

        return userAccounts.get(0);
    }

    private Category matchCategory(String suggestedName, TransactionType type, List<Category> categories, String text) {
        if (suggestedName != null && !suggestedName.isBlank()) {
            Category found = findCategoryByName(categories, suggestedName);
            if (found != null)
                return found;
        }

        String normalizedText = removeAccents(text).toLowerCase(Locale.ROOT);
        return detectCategoryLocally(normalizedText, type, categories);
    }

    private Account matchAccount(String suggestedName, List<Account> accounts, String text) {
        if (suggestedName != null && !suggestedName.isBlank()) {
            String norm = removeAccents(suggestedName).toLowerCase(Locale.ROOT);
            for (Account a : accounts) {
                if (removeAccents(a.getName()).toLowerCase(Locale.ROOT).contains(norm)) {
                    return a;
                }
            }
        }

        String normalizedText = removeAccents(text).toLowerCase(Locale.ROOT);
        return detectAccountLocally(normalizedText, accounts);
    }

    private Category findCategoryByName(List<Category> categories, String name) {
        String targetNorm = removeAccents(name).toLowerCase(Locale.ROOT);
        for (Category c : categories) {
            String cNorm = removeAccents(c.getName()).toLowerCase(Locale.ROOT);
            if (cNorm.equals(targetNorm)) {
                return c;
            }
        }
        // Fallback: tìm theo contains
        for (Category c : categories) {
            String cNorm = removeAccents(c.getName()).toLowerCase(Locale.ROOT);
            if (cNorm.contains(targetNorm) || targetNorm.contains(cNorm)) {
                return c;
            }
        }
        return categories.isEmpty() ? null : categories.get(0);
    }

    private Account findAccountByType(List<Account> accounts, AccountType type) {
        for (Account a : accounts) {
            if (a.getType() == type) {
                return a;
            }
        }
        return null;
    }

    /**
     * Tạo nhận xét tài chính hàng tháng bằng Gemini AI (hoặc bộ phân tích thông
     * minh).
     */
    public AiInsightsResponse generateMonthlyInsights(Long userId, String month) {
        if (month == null || !month.matches("^\\d{4}-\\d{2}$")) {
            throw new BusinessValidationException("Định dạng tháng không hợp lệ (yêu cầu YYYY-MM)");
        }

        YearMonth ym = YearMonth.parse(month);
        LocalDate startDate = ym.atDay(1);
        LocalDate endDate = ym.atEndOfMonth();

        Long totalIncome = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                userId, TransactionType.INCOME, startDate, endDate);
        Long totalExpense = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                userId, TransactionType.EXPENSE, startDate, endDate);

        long netSavings = totalIncome - totalExpense;

        String overview = null;
        List<String> recommendations = new ArrayList<>();

        if (geminiConfig.hasApiKey()) {
            try {
                String prompt = String.format(
                        """
                                Bạn là chuyên gia tư vấn tài chính cá nhân cho ứng dụng FinMan tại Việt Nam.
                                Phân tích tài chính tháng: %s
                                Tổng thu nhập: %,d VNĐ
                                Tổng chi tiêu: %,d VNĐ
                                Tiết kiệm ròng: %,d VNĐ

                                NHIỆM VỤ:
                                Đưa ra nhận xét khách quan, hữu ích bằng tiếng Việt và 2-3 gợi ý hành động tiết kiệm cụ thể theo định dạng JSON sau:
                                {
                                  "overview": "Đoạn văn ngắn nhận xét tổng quan tình hình thu chi tháng...",
                                  "recommendations": [
                                    "Lời khuyên thiết thực 1...",
                                    "Lời khuyên thiết thực 2..."
                                  ]
                                }

                                LƯU Ý: Chỉ trả về duy nhất chuỗi JSON hợp lệ, không kèm markdown hoặc giải thích.
                                """,
                        month, totalIncome, totalExpense, netSavings);

                String jsonResult = geminiClient.generateContent(prompt, true);
                JsonNode root = objectMapper.readTree(jsonResult);
                overview = root.path("overview").asText(null);
                JsonNode recNode = root.path("recommendations");
                if (recNode.isArray()) {
                    for (JsonNode item : recNode) {
                        recommendations.add(item.asText());
                    }
                }
            } catch (Exception ex) {
                log.warn("Gemini monthly insights generation failed, falling back to local rule-based insights: {}",
                        ex.getMessage());
            }
        }

        if (overview == null || overview.isBlank() || recommendations.isEmpty()) {
            recommendations.clear();
            if (totalIncome == 0 && totalExpense == 0) {
                overview = String.format("Tháng %s chưa ghi nhận giao dịch tài chính nào trong lịch sử.", month);
                recommendations.add("Hãy bắt đầu ghi chép các khoản chi tiêu hằng ngày để theo dõi dòng tiền.");
                recommendations.add("Thiết lập ngân sách tháng cho các nhu cầu thiết yếu như Ăn uống và Sinh hoạt.");
            } else if (netSavings > 0) {
                double savingsRate = totalIncome > 0 ? ((double) netSavings / totalIncome) * 100 : 0;
                overview = String.format(
                        "Tình hình tài chính tháng %s rất tích cực! Bạn đã tiết kiệm được %,d đ (đạt tỷ lệ thặng dư %.1f%%).",
                        month, netSavings, savingsRate);
                recommendations
                        .add("Cân nhắc chuyển một phần thặng dư vào tài khoản tiết kiệm hoặc quỹ dự phòng khẩn cấp.");
                recommendations
                        .add("Duy trì việc kiểm soát hạn mức chi tiêu ăn uống và giải trí để gia tăng tích lũy.");
            } else {
                overview = String.format("Cảnh báo: Dòng tiền tháng %s đang bị thâm hụt %,d đ so với tổng thu nhập.",
                        month, Math.abs(netSavings));
                recommendations.add("Rà soát các khoản chi không thiết yếu trong tháng để cắt giảm kịp thời.");
                recommendations.add("Áp dụng quy tắc 50/30/20 để phân bổ lại hạn mức ngân sách các danh mục.");
            }
        }

        return new AiInsightsResponse(
                month,
                overview,
                recommendations,
                totalIncome,
                totalExpense,
                netSavings,
                LocalDateTime.now());
    }

    /**
     * Xử lý câu lệnh hoặc câu hỏi từ người dùng:
     * - Tự động nhận diện ý định (Intent): Báo cáo nhận xét tháng, Truy vấn số
     * liệu, hoặc Ghi nhận giao dịch.
     */
    public AiChatResponse processUserChat(Long userId, String message) {
        if (message == null || message.trim().isEmpty()) {
            throw new BusinessValidationException("Nội dung câu lệnh không được để trống");
        }
        String text = message.trim();
        String norm = removeAccents(text).toLowerCase(Locale.ROOT);

        // 1. Kiểm tra yêu cầu phân tích / nhận xét tháng
        if ((norm.contains("nhan xet") || norm.contains("phan tich") || norm.contains("tu van")
                || norm.contains("tong ket"))
                && (norm.contains("thang") || norm.contains("chi tieu") || norm.contains("tai chinh"))) {
            String targetMonth = YearMonth.now().toString();
            Matcher m = Pattern.compile("thang\\s*(\\d{1,2})").matcher(norm);
            if (m.find()) {
                int monthNum = Integer.parseInt(m.group(1));
                if (monthNum >= 1 && monthNum <= 12) {
                    targetMonth = String.format("%d-%02d", YearMonth.now().getYear(), monthNum);
                }
            }
            AiInsightsResponse insights = generateMonthlyInsights(userId, targetMonth);
            return AiChatResponse.insights(insights, geminiConfig.hasApiKey() ? "GEMINI_2.5_FLASH" : "LOCAL_FALLBACK");
        }

        // 2. Kiểm tra câu hỏi tra cứu dữ liệu tài chính (Data Query)
        boolean isExplicitQuery = isQueryIntent(norm);
        if (isExplicitQuery) {
            return executeDataQuery(userId, text);
        }

        // 3. Nếu không phải câu hỏi, thử phân tích giao dịch (Quick Add)
        try {
            AiQuickAddResponse quickAdd = parseTransactionFromText(userId, text);
            if (quickAdd.getItems() != null && !quickAdd.getItems().isEmpty()) {
                return AiChatResponse.quickAdd(quickAdd.getItems(), quickAdd.getSource());
            }
        } catch (Exception ex) {
            log.info("Quick add parse not matched, falling back to data query: {}", ex.getMessage());
        }

        // 4. Nếu không thể bóc tách thành giao dịch, chuyển sang trả lời theo dạng trợ
        // lý trò chuyện / tra cứu
        return executeDataQuery(userId, text);
    }

    /**
     * Nhận diện ý định câu hỏi tra cứu thông tin
     */
    private boolean isQueryIntent(String norm) {
        if (norm.contains("?"))
            return true;
        return norm.contains("bao nhieu") || norm.contains("the nao") || norm.contains("nhung gi")
                || norm.contains("sao") || norm.contains("co gi") || norm.contains("liet ke")
                || norm.contains("danh sach") || norm.contains("kiem tra") || norm.contains("xem so du")
                || norm.contains("cho toi biet") || norm.contains("con bao nhieu") || norm.contains("da tieu bao nhieu")
                || norm.contains("da chi bao nhieu") || norm.contains("toi co bao nhieu")
                || norm.contains("con tien khong")
                || norm.contains("so du") || norm.contains("con lai") || norm.contains("tien con");
    }

    /**
     * Thực thi truy vấn dữ liệu tài chính người dùng (qua Gemini RAG hoặc Local
     * Fallback)
     */
    public AiChatResponse executeDataQuery(Long userId, String query) {
        if (geminiConfig.hasApiKey()) {
            try {
                String answer = queryFinancialDataWithGemini(userId, query);
                if (answer != null && !answer.isBlank()) {
                    return AiChatResponse.queryAnswer(answer, "GEMINI_2.5_FLASH", null);
                }
            } catch (Exception ex) {
                log.warn("Gemini data query failed, falling back to local query solver: {}", ex.getMessage());
            }
        }
        String localAnswer = queryFinancialDataLocally(userId, query);
        return AiChatResponse.queryAnswer(localAnswer, "LOCAL_FALLBACK", null);
    }

    /**
     * Gọi Gemini API kèm ngữ cảnh tài chính thực tế của người dùng (RAG)
     */
    public String queryFinancialDataWithGemini(Long userId, String userQuery) {
        String context = buildUserFinancialContext(userId);
        String prompt = String.format(
                """
                        Bạn là Trợ lý Tài chính cá nhân FinMan AI thông minh, tận tâm và chính xác tại Việt Nam.
                        Dưới đây là DỮ LIỆU TÀI CHÍNH THỰC TẾ của người dùng tại thời điểm hiện tại:

                        %s

                        CÂU HỎI / YÊU CẦU CỦA NGƯỜI DÙNG: "%s"

                        NHIỆM VỤ:
                        1. Trả lời trực tiếp, chính xác, ngắn gọn, lịch sự và thân thiện bằng tiếng Việt.
                        2. Dựa HOÀN TOÀN vào dữ liệu thực tế được cung cấp ở trên. Tuyệt đối không bịa đặt số liệu hoặc giao dịch không có thật.
                        3. Luôn định dạng số tiền rõ ràng theo chuẩn Việt Nam (ví dụ: 50.000 ₫, 1.250.000 ₫).
                        4. Sử dụng định dạng markdown (in đậm **số tiền**, danh sách gạch đầu dòng) để câu trả lời trực quan, chuyên nghiệp.
                        5. Nếu người dùng hỏi điều gì mà dữ liệu chưa có (ví dụ: ngày đó chưa có giao dịch), hãy giải thích lịch sự dựa trên dữ liệu hiện có.
                        """,
                context, userQuery);

        return geminiClient.generateContent(prompt, false);
    }

    /**
     * Bộ giải đáp truy vấn cục bộ (Local Rule-based Query Solver) khi không có mạng
     * hoặc chưa có Gemini Key.
     */
    public String queryFinancialDataLocally(Long userId, String userQuery) {
        String norm = removeAccents(userQuery).toLowerCase(Locale.ROOT);
        LocalDate today = LocalDate.now();
        YearMonth currentMonth = YearMonth.now();

        // 1. Câu hỏi về Số dư / Ví / Tài khoản
        if (norm.contains("so du") || norm.contains("con bao nhieu") || norm.contains("con lai")
                || norm.contains("tien con") || norm.contains("tai khoan") || norm.contains("vi")) {
            List<Account> accounts = accountRepository.findByUserIdAndIsArchivedFalse(userId);
            long totalBalance = accounts.stream().mapToLong(Account::getCurrentBalance).sum();

            for (Account acc : accounts) {
                String accNorm = removeAccents(acc.getName()).toLowerCase(Locale.ROOT);
                if (norm.contains(accNorm)) {
                    return String.format(
                            "Số dư hiện tại của tài khoản **%s** là **%,d ₫** (Tổng số dư tất cả các ví: **%,d ₫**).",
                            acc.getName(), acc.getCurrentBalance(), totalBalance);
                }
            }

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("Tổng số dư khả dụng hiện tại của bạn là **%,d ₫** trên **%d** tài khoản ví:\n",
                    totalBalance, accounts.size()));
            for (Account acc : accounts) {
                sb.append(String.format("- **%s**: %,d ₫\n", acc.getName(), acc.getCurrentBalance()));
            }
            return sb.toString();
        }

        // 2. Câu hỏi về Chi tiêu / Thu nhập Hôm nay
        if (norm.contains("hom nay")) {
            Long todayExpense = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                    userId, TransactionType.EXPENSE, today, today);
            Long todayIncome = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                    userId, TransactionType.INCOME, today, today);
            List<Transaction> todayTxns = transactionRepository
                    .findByUserIdAndTransactionDateBetweenOrderByTransactionDateDesc(
                            userId, today, today);

            if (todayTxns.isEmpty()) {
                return String.format(
                        "Hôm nay (%s), bạn **chưa có giao dịch chi tiêu hoặc thu nhập nào** được ghi nhận.",
                        today.toString());
            }

            StringBuilder sb = new StringBuilder();
            sb.append(
                    String.format("Hôm nay (%s), bạn đã chi tiêu tổng cộng **%,d ₫**", today.toString(), todayExpense));
            if (todayIncome > 0) {
                sb.append(String.format(" (thu nhập: **%,d ₫**)", todayIncome));
            }
            sb.append(String.format(" với **%d giao dịch**:\n", todayTxns.size()));
            for (Transaction t : todayTxns) {
                sb.append(String.format("- **%s**: %,d ₫ (%s | %s)\n",
                        t.getNote(), t.getAmount(),
                        getCategoryNameSafe(t),
                        getAccountNameSafe(t)));
            }
            return sb.toString();
        }

        // 3. Câu hỏi về Chi tiêu / Thu nhập Tháng này
        if (norm.contains("thang nay") || norm.contains("thang") || norm.contains("tong chi")
                || norm.contains("tong thu")) {
            LocalDate start = currentMonth.atDay(1);
            LocalDate end = currentMonth.atEndOfMonth();
            Long monthExpense = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                    userId, TransactionType.EXPENSE, start, end);
            Long monthIncome = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                    userId, TransactionType.INCOME, start, end);
            long netSavings = monthIncome - monthExpense;

            return String.format("""
                    Tổng quan tình hình tài chính tháng **%s** của bạn:
                    - **Tổng thu nhập**: %,d ₫
                    - **Tổng chi tiêu**: %,d ₫
                    - **Tiết kiệm ròng / Thặng dư**: %,d ₫ %s
                    """,
                    currentMonth.toString(),
                    monthIncome,
                    monthExpense,
                    netSavings,
                    netSavings >= 0 ? "✅" : "⚠️");
        }

        // 4. Câu hỏi về Giao dịch gần đây
        if (norm.contains("gan day") || norm.contains("moi nhat") || norm.contains("lich su")
                || norm.contains("giao dich")) {
            Page<Transaction> page = transactionRepository.findByUserId(
                    userId, PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "transactionDate", "createdAt")));
            List<Transaction> list = page.getContent();
            if (list.isEmpty()) {
                return "Bạn chưa có giao dịch nào được ghi nhận trong hệ thống.";
            }
            StringBuilder sb = new StringBuilder("Dưới đây là 5 giao dịch gần đây nhất của bạn:\n");
            for (Transaction t : list) {
                sb.append(String.format("- **%s** (%s): %s%,d ₫ | %s | Ví: %s\n",
                        t.getNote(),
                        t.getTransactionDate(),
                        t.getType() == TransactionType.INCOME ? "+" : "-",
                        t.getAmount(),
                        getCategoryNameSafe(t),
                        getAccountNameSafe(t)));
            }
            return sb.toString();
        }

        // 5. Câu trả lời mặc định tóm tắt nhanh tình trạng tài chính
        List<Account> accounts = accountRepository.findByUserIdAndIsArchivedFalse(userId);
        long totalBalance = accounts.stream().mapToLong(Account::getCurrentBalance).sum();
        Long todayExpense = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                userId, TransactionType.EXPENSE, today, today);

        return String.format(
                """
                        Dưới đây là tóm tắt nhanh tình hình tài chính của bạn:
                        - **Tổng tài sản/số dư hiện tại**: %,d ₫ (trên %d tài khoản ví)
                        - **Chi tiêu hôm nay (%s)**: %,d ₫
                        - Bạn có thể hỏi tôi cụ thể: *"Hôm nay tôi đã tiêu bao nhiêu?"*, *"Số dư các ví hiện tại"*, hoặc *"Tháng này chi tiêu ăn uống bao nhiêu?"*.
                        """,
                totalBalance, accounts.size(), today.toString(), todayExpense);
    }

    /**
     * Tổng hợp dữ liệu tài chính thực tế của người dùng làm ngữ cảnh cho Gemini
     * RAG.
     */
    private String buildUserFinancialContext(Long userId) {
        LocalDate today = LocalDate.now();
        YearMonth currentMonth = YearMonth.now();
        LocalDate startOfMonth = currentMonth.atDay(1);
        LocalDate endOfMonth = currentMonth.atEndOfMonth();

        // 1. Danh sách số dư tài khoản
        List<Account> accounts = accountRepository.findByUserIdAndIsArchivedFalse(userId);
        long totalBalance = accounts.stream().mapToLong(Account::getCurrentBalance).sum();

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("DỮ LIỆU TÀI CHÍNH THỰC TẾ CỦA NGƯỜI DÙNG (Thời gian hệ thống: %s):\n\n", today));

        sb.append("1. TÀI KHOẢN VÀ SỐ DƯ HIỆN TẠI:\n");
        sb.append(String.format("- Tổng tài sản/số dư khả dụng: %,d ₫\n", totalBalance));
        if (accounts.isEmpty()) {
            sb.append("- Chưa có tài khoản nào.\n");
        } else {
            for (Account acc : accounts) {
                sb.append(String.format("  + %s (%s): %,d ₫\n", acc.getName(), acc.getType(), acc.getCurrentBalance()));
            }
        }
        sb.append("\n");

        // 2. Giao dịch hôm nay
        Long todayExpense = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                userId, TransactionType.EXPENSE, today, today);
        Long todayIncome = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                userId, TransactionType.INCOME, today, today);
        List<Transaction> todayTxns = transactionRepository
                .findByUserIdAndTransactionDateBetweenOrderByTransactionDateDesc(
                        userId, today, today);

        sb.append(String.format("2. TÌNH HÌNH HÔM NAY (%s):\n", today));
        sb.append(String.format("- Tổng chi tiêu hôm nay: %,d ₫\n", todayExpense));
        sb.append(String.format("- Tổng thu nhập hôm nay: %,d ₫\n", todayIncome));
        if (todayTxns.isEmpty()) {
            sb.append("- Hôm nay chưa có giao dịch nào.\n");
        } else {
            sb.append(String.format("- Hôm nay có %d giao dịch:\n", todayTxns.size()));
            for (Transaction t : todayTxns) {
                sb.append(String.format("  + %s: %,d ₫ | %s | %s | Ví: %s\n",
                        t.getNote(), t.getAmount(), t.getType(),
                        getCategoryNameSafe(t),
                        getAccountNameSafe(t)));
            }
        }
        sb.append("\n");

        // 3. Tổng quan tháng này
        Long monthExpense = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                userId, TransactionType.EXPENSE, startOfMonth, endOfMonth);
        Long monthIncome = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                userId, TransactionType.INCOME, startOfMonth, endOfMonth);
        long netSavings = monthIncome - monthExpense;

        sb.append(String.format("3. TỔNG QUAN THÁNG NÀY (%s):\n", currentMonth));
        sb.append(String.format("- Tổng thu nhập tháng: %,d ₫\n", monthIncome));
        sb.append(String.format("- Tổng chi tiêu tháng: %,d ₫\n", monthExpense));
        sb.append(String.format("- Tiết kiệm ròng: %,d ₫\n", netSavings));
        sb.append("\n");

        // 4. Giao dịch gần đây nhất
        Page<Transaction> recentPage = transactionRepository.findByUserId(
                userId, PageRequest.of(0, 15, Sort.by(Sort.Direction.DESC, "transactionDate", "createdAt")));
        List<Transaction> recentTxns = recentPage.getContent();
        sb.append("4. GIAO DỊCH GẦN ĐÂY NHẤT:\n");
        if (recentTxns.isEmpty()) {
            sb.append("- Chưa có giao dịch nào được ghi nhận trong lịch sử.\n");
        } else {
            for (Transaction t : recentTxns) {
                sb.append(String.format("  + %s | %s: %,d ₫ | %s | %s | Ví: %s\n",
                        t.getTransactionDate(), t.getNote(), t.getAmount(), t.getType(),
                        getCategoryNameSafe(t),
                        getAccountNameSafe(t)));
            }
        }
        sb.append("\n");

        // 5. Ngân sách tháng này
        List<Budget> budgets = budgetRepository.findByUserIdAndMonth(userId, currentMonth.toString());
        sb.append(String.format("5. NGÂN SÁCH THÁNG NÀY (%s):\n", currentMonth));
        if (budgets.isEmpty()) {
            sb.append("- Chưa thiết lập hạn mức ngân sách tháng này.\n");
        } else {
            for (Budget b : budgets) {
                Long spent = transactionRepository.sumAmountByUserIdAndCategoryIdAndDateBetween(
                        userId, b.getCategory().getId(), TransactionType.EXPENSE, startOfMonth, endOfMonth);
                sb.append(String.format("  + %s: Đã chi %,d ₫ / Hạn mức %,d ₫ (Còn lại: %,d ₫)\n",
                        b.getCategory().getName(), spent, b.getAmount(), b.getAmount() - spent));
            }
        }

        return sb.toString();
    }

    private String getCategoryNameSafe(Transaction t) {
        try {
            if (t == null)
                return "Khác";
            Category c = t.getCategory();
            return (c != null && c.getName() != null) ? c.getName() : "Khác";
        } catch (Exception e) {
            return "Khác";
        }
    }

    private String getAccountNameSafe(Transaction t) {
        try {
            if (t == null)
                return "Ví";
            Account a = t.getAccount();
            return (a != null && a.getName() != null) ? a.getName() : "Ví";
        } catch (Exception e) {
            return "Ví";
        }
    }

    private static String removeAccents(String s) {
        if (s == null)
            return "";
        String normalized = Normalizer.normalize(s, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        return pattern.matcher(normalized).replaceAll("").replace('đ', 'd').replace('Đ', 'D').trim();
    }
}
