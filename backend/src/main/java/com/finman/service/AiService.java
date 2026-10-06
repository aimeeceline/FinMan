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
import com.finman.dto.response.AiInsightsKeyMetrics;
import com.finman.dto.response.CategoryAggregationResponse;
import com.finman.dto.response.CategorySpendingItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.stream.Collectors;
import java.text.Normalizer;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import com.finman.dto.request.AiChatMessageDto;
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
    private static final String PARSE_TRANSACTION_PROMPT_TEMPLATE = loadPromptTemplate();
    private static final String MONTHLY_INSIGHTS_PROMPT_TEMPLATE = loadMonthlyInsightsPromptTemplate();
    private static final String FINANCIAL_CHATBOT_PROMPT_TEMPLATE = loadFinancialChatbotPromptTemplate();

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
        LocalDate today = LocalDate.now();
        String currentDate = today.toString();
        String yesterdayDate = today.minusDays(1).toString();
        int currentYear = today.getYear();

        StringBuilder catList = new StringBuilder();
        for (Category c : userCategories) {
            catList.append(String.format("- %s [%s]\n", c.getName(), c.getType()));
        }

        StringBuilder accList = new StringBuilder();
        for (Account a : userAccounts) {
            accList.append(String.format("- %s [%s]\n", a.getName(), a.getType()));
        }

        String prompt = String.format(
                PARSE_TRANSACTION_PROMPT_TEMPLATE,
                currentDate,
                yesterdayDate,
                currentYear,
                catList,
                accList,
                text,
                currentDate,
                yesterdayDate,
                currentDate,
                currentDate
        );

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
                    LocalDate txnDate = parseFlexibleDate(dateStr);

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
                LocalDate txnDate = parseFlexibleDate(dateStr);

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
                LocalDate txnDate = extractDateLocally(clauseTrimmed, norm);

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
            LocalDate txnDate = extractDateLocally(text, normalized);

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

    private LocalDate parseFlexibleDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank() || dateStr.equalsIgnoreCase("null")) {
            return LocalDate.now();
        }
        String trimmed = dateStr.trim();
        // 1. ISO format (YYYY-MM-DD)
        try {
            return LocalDate.parse(trimmed);
        } catch (Exception ignored) {
        }
        // 2. Format DD/MM/YYYY or DD-MM-YYYY
        try {
            DateTimeFormatter dmy = DateTimeFormatter.ofPattern("d/M/yyyy");
            return LocalDate.parse(trimmed.replace("-", "/"), dmy);
        } catch (Exception ignored) {
        }
        // 3. Format YYYY/MM/DD
        try {
            DateTimeFormatter ymd = DateTimeFormatter.ofPattern("yyyy/M/d");
            return LocalDate.parse(trimmed.replace("-", "/"), ymd);
        } catch (Exception ignored) {
        }
        // 4. Format DD/MM or DD-MM (gán năm hiện tại)
        try {
            Pattern p = Pattern.compile("^(\\d{1,2})[/-](\\d{1,2})$");
            Matcher m = p.matcher(trimmed);
            if (m.find()) {
                int day = Integer.parseInt(m.group(1));
                int month = Integer.parseInt(m.group(2));
                return LocalDate.of(LocalDate.now().getYear(), month, day);
            }
        } catch (Exception ignored) {
        }
        return LocalDate.now();
    }

    private LocalDate extractDateLocally(String originalClause, String norm) {
        LocalDate now = LocalDate.now();
        // 1. Từ khóa tương đối phổ biến
        if (norm.contains("hom qua")) {
            return now.minusDays(1);
        }
        if (norm.contains("hom kia")) {
            return now.minusDays(2);
        }
        if (norm.contains("ngay mai") || norm.contains("mai")) {
            return now.plusDays(1);
        }
        if (norm.contains("hom nay")) {
            return now;
        }
        if (norm.contains("tuan truoc")) {
            return now.minusWeeks(1);
        }

        // 2. Nhận diện "ngày dd tháng MM (năm yyyy)?"
        Pattern dateTextPattern = Pattern.compile("(?i)(?:ngay\\s+|ngày\\s+|hôm\\s+)?(\\d{1,2})\\s*(?:thang|tháng)\\s*(\\d{1,2})(?:\\s*(?:nam|năm)\\s*(\\d{4}|\\d{2}))?");
        Matcher mText = dateTextPattern.matcher(originalClause);
        if (mText.find()) {
            try {
                int day = Integer.parseInt(mText.group(1));
                int month = Integer.parseInt(mText.group(2));
                int year = now.getYear();
                if (mText.group(3) != null) {
                    int y = Integer.parseInt(mText.group(3));
                    year = y < 100 ? 2000 + y : y;
                }
                if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                    return LocalDate.of(year, month, day);
                }
            } catch (Exception ignored) {
            }
        }

        // 3. Nhận diện "dd/MM/yyyy" hoặc "dd/MM" hoặc "dd-MM-yyyy" hoặc "dd-MM"
        Pattern slashPattern = Pattern.compile("(?i)(?:ngay\\s+|ngày\\s+|vao\\s+|vào\\s+)?\\b(\\d{1,2})[/-](\\d{1,2})(?:[/-](\\d{4}|\\d{2}))?\\b");
        Matcher mSlash = slashPattern.matcher(originalClause);
        if (mSlash.find()) {
            try {
                int day = Integer.parseInt(mSlash.group(1));
                int month = Integer.parseInt(mSlash.group(2));
                int year = now.getYear();
                if (mSlash.group(3) != null) {
                    int y = Integer.parseInt(mSlash.group(3));
                    year = y < 100 ? 2000 + y : y;
                }
                if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                    return LocalDate.of(year, month, day);
                }
            } catch (Exception ignored) {
            }
        }

        // 4. Nhận diện "ngày dd" hoặc "hôm dd" trong tháng hiện tại
        Pattern dayPattern = Pattern.compile("(?i)\\b(?:ngay|ngày|hôm|hom)\\s+(\\d{1,2})\\b(?!\\s*(?:k|nghìn|ngan|tr|triệu|trieu|d|đ|đồng|dong|vnd|%))");
        Matcher mDay = dayPattern.matcher(originalClause);
        if (mDay.find()) {
            try {
                int day = Integer.parseInt(mDay.group(1));
                if (day >= 1 && day <= 31) {
                    return LocalDate.of(now.getYear(), now.getMonthValue(), day);
                }
            } catch (Exception ignored) {
            }
        }

        return now;
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
        cleaned = cleaned.replaceAll("(?i)(hôm nay|hôm qua|hôm kia|hom nay|hom qua|hom kia|tuần trước|tuan truoc|ngày mai|ngay mai)", "");
        cleaned = cleaned.replaceAll("(?i)(?:ngay|ngày|vao|vào)?\\s*\\d{1,2}\\s*(?:thang|tháng)\\s*\\d{1,2}(?:\\s*(?:nam|năm)\\s*\\d{2,4})?", "");
        cleaned = cleaned.replaceAll("(?i)(?:ngay|ngày|vao|vào)?\\s*\\b\\d{1,2}[/-]\\d{1,2}(?:[/-]\\d{2,4})?\\b", "");
        cleaned = cleaned.replaceAll("(?i)\\b(?:ngay|ngày|hôm|hom)\\s+\\d{1,2}\\b", "");
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

        if (normalized.contains("dau tu") || normalized.contains("invest")
                || normalized.contains("chung khoan") || normalized.contains("co phieu")
                || normalized.contains("crypto") || normalized.contains("vang")) {
            Account investment = findAccountByType(userAccounts, AccountType.INVESTMENT);
            if (investment != null)
                return investment;
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
        if (month == null || !month.matches("^\\d{4}-(0[1-9]|1[0-2])$")) {
            throw new BusinessValidationException("Định dạng tháng không hợp lệ (yêu cầu YYYY-MM)");
        }

        YearMonth ym = YearMonth.parse(month);
        LocalDate startDate = ym.atDay(1);
        LocalDate endDate = ym.atEndOfMonth();

        YearMonth prevYm = ym.minusMonths(1);
        LocalDate prevStartDate = prevYm.atDay(1);
        LocalDate prevEndDate = prevYm.atEndOfMonth();

        // 1. Lấy dữ liệu tổng quan thu - chi tháng hiện tại
        Long dbIncome = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                userId, TransactionType.INCOME, startDate, endDate);
        Long dbExpense = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                userId, TransactionType.EXPENSE, startDate, endDate);

        long totalIncome = (dbIncome != null) ? dbIncome : 0L;
        long totalExpense = (dbExpense != null) ? dbExpense : 0L;
        long netSavings = totalIncome - totalExpense;
        double savingsRate = (totalIncome > 0) ? Math.round(((double) netSavings / totalIncome * 100.0) * 10.0) / 10.0 : 0.0;

        // 2. Lấy dữ liệu phân tích theo danh mục chi tiêu & thu nhập
        List<CategoryAggregationResponse> expenseAgg = transactionRepository.aggregateByCategory(
                userId, startDate, endDate, TransactionType.EXPENSE);
        List<CategoryAggregationResponse> incomeAgg = transactionRepository.aggregateByCategory(
                userId, startDate, endDate, TransactionType.INCOME);

        List<CategorySpendingItem> topExpenseCategories = new ArrayList<>();
        String highestExpenseCategory = null;
        Long highestExpenseAmount = null;
        Double highestExpensePercentage = null;

        if (expenseAgg != null && !expenseAgg.isEmpty()) {
            for (CategoryAggregationResponse agg : expenseAgg) {
                long amt = agg.getTotalAmount() != null ? agg.getTotalAmount() : 0L;
                double pct = (totalExpense > 0) ? Math.round(((double) amt / totalExpense * 100.0) * 10.0) / 10.0 : 0.0;
                topExpenseCategories.add(new CategorySpendingItem(
                        agg.getCategoryId(), agg.getCategoryName(), agg.getCategoryIcon(), amt, pct));
            }
            CategorySpendingItem top = topExpenseCategories.get(0);
            highestExpenseCategory = top.getCategoryName();
            highestExpenseAmount = top.getTotalAmount();
            highestExpensePercentage = top.getPercentage();
        }

        // 3. So sánh với tháng trước
        Long prevDbIncome = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                userId, TransactionType.INCOME, prevStartDate, prevEndDate);
        Long prevDbExpense = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                userId, TransactionType.EXPENSE, prevStartDate, prevEndDate);

        long prevIncome = (prevDbIncome != null) ? prevDbIncome : 0L;
        long prevExpense = (prevDbExpense != null) ? prevDbExpense : 0L;
        long prevNetSavings = prevIncome - prevExpense;
        boolean hasPreviousMonthData = (prevIncome > 0 || prevExpense > 0);

        Double incomeChangePercentage = null;
        Double expenseChangePercentage = null;
        Double savingsChangePercentage = null;

        if (hasPreviousMonthData) {
            if (prevIncome > 0) {
                incomeChangePercentage = Math.round(((double) (totalIncome - prevIncome) / prevIncome * 100.0) * 10.0) / 10.0;
            }
            if (prevExpense > 0) {
                expenseChangePercentage = Math.round(((double) (totalExpense - prevExpense) / prevExpense * 100.0) * 10.0) / 10.0;
            }
            if (prevNetSavings != 0) {
                savingsChangePercentage = Math.round(((double) (netSavings - prevNetSavings) / Math.abs(prevNetSavings) * 100.0) * 10.0) / 10.0;
            }
        }

        // 4. Lấy ngân sách và kiểm tra thực thi (tránh N+1)
        Map<Long, Long> expenseByCatId = topExpenseCategories.stream()
                .filter(item -> item.getCategoryId() != null)
                .collect(Collectors.toMap(CategorySpendingItem::getCategoryId, CategorySpendingItem::getTotalAmount, (a, b) -> a));

        List<Budget> budgets = budgetRepository.findByUserIdAndMonthWithCategory(userId, month);
        List<String> budgetAlerts = new ArrayList<>();
        StringBuilder budgetContextBuilder = new StringBuilder();

        if (budgets == null || budgets.isEmpty()) {
            budgetContextBuilder.append("- Người dùng chưa thiết lập hạn mức ngân sách nào trong tháng này.\n");
        } else {
            for (Budget b : budgets) {
                String catName = (b.getCategory() != null && b.getCategory().getName() != null) ? b.getCategory().getName() : "Khác";
                long allocated = (b.getAmount() != null) ? b.getAmount() : 0L;
                long spent = (b.getCategory() != null) ? expenseByCatId.getOrDefault(b.getCategory().getId(), 0L) : 0L;
                double usagePct = (allocated > 0) ? Math.round(((double) spent / allocated * 100.0) * 10.0) / 10.0 : 0.0;

                String statusStr;
                if (usagePct > 100.0) {
                    statusStr = String.format("VƯỢT NGÂN SÁCH (%.1f%%)", usagePct);
                    budgetAlerts.add(String.format("Chi tiêu danh mục '%s' đã vượt ngân sách (%,d / %,d VNĐ - %.1f%%).",
                            catName, spent, allocated, usagePct));
                } else if (usagePct >= 80.0) {
                    statusStr = String.format("GẦN CHẠM HẠN MỨC (%.1f%%)", usagePct);
                    budgetAlerts.add(String.format("Danh mục '%s' đã dùng %.1f%% hạn mức ngân sách (%,d / %,d VNĐ).",
                            catName, usagePct, spent, allocated));
                } else {
                    statusStr = String.format("AN TOÀN (%.1f%%)", usagePct);
                }

                budgetContextBuilder.append(String.format("- %s: Đã chi %,d / %,d VNĐ (%.1f%%) -> Trạng thái: %s\n",
                        catName, spent, allocated, usagePct, statusStr));
            }
        }

        // 5. Xây dựng Financial Context gửi cho Gemini
        StringBuilder context = new StringBuilder();
        context.append(String.format("THÁNG: %s\n\n", month));
        context.append("1. TỔNG QUAN TÀI CHÍNH:\n");
        context.append(String.format("- Tổng thu nhập: %,d VNĐ\n", totalIncome));
        context.append(String.format("- Tổng chi tiêu: %,d VNĐ\n", totalExpense));
        context.append(String.format("- Tiết kiệm ròng: %,d VNĐ\n", netSavings));
        context.append(String.format("- Tỷ lệ tiết kiệm (Savings Rate): %.1f%%\n\n", savingsRate));

        context.append("2. CHI TIÊU THEO DANH MỤC:\n");
        if (topExpenseCategories.isEmpty()) {
            context.append("- Không có giao dịch chi tiêu trong tháng.\n\n");
        } else {
            for (CategorySpendingItem item : topExpenseCategories) {
                context.append(String.format("- %s: %,d VNĐ (%.1f%% tổng chi)\n",
                        item.getCategoryName(), item.getTotalAmount(), item.getPercentage()));
            }
            context.append(String.format("\n* Danh mục chi tiêu lớn nhất: %s (%,d VNĐ - %.1f%% tổng chi)\n\n",
                    highestExpenseCategory, highestExpenseAmount, highestExpensePercentage));
        }

        context.append("3. THU NHẬP THEO DANH MỤC:\n");
        if (incomeAgg == null || incomeAgg.isEmpty()) {
            context.append("- Không có giao dịch thu nhập trong tháng.\n\n");
        } else {
            for (CategoryAggregationResponse inc : incomeAgg) {
                long incAmt = inc.getTotalAmount() != null ? inc.getTotalAmount() : 0L;
                double incPct = (totalIncome > 0) ? Math.round(((double) incAmt / totalIncome * 100.0) * 10.0) / 10.0 : 0.0;
                context.append(String.format("- %s: %,d VNĐ (%.1f%% tổng thu)\n",
                        inc.getCategoryName(), incAmt, incPct));
            }
            context.append("\n");
        }

        context.append(String.format("4. SO SÁNH VỚI THÁNG TRƯỚC (%s):\n", prevYm.toString()));
        if (!hasPreviousMonthData) {
            context.append("- Không có dữ liệu giao dịch tháng trước để so sánh.\n\n");
        } else {
            context.append(String.format("- Thu nhập tháng trước: %,d VNĐ (Thay đổi: %s)\n",
                    prevIncome, incomeChangePercentage != null ? String.format("%+.1f%%", incomeChangePercentage) : "N/A"));
            context.append(String.format("- Chi tiêu tháng trước: %,d VNĐ (Thay đổi: %s)\n",
                    prevExpense, expenseChangePercentage != null ? String.format("%+.1f%%", expenseChangePercentage) : "N/A"));
            context.append(String.format("- Tiết kiệm ròng tháng trước: %,d VNĐ (Thay đổi: %s)\n\n",
                    prevNetSavings, savingsChangePercentage != null ? String.format("%+.1f%%", savingsChangePercentage) : "N/A"));
        }

        context.append("5. TÌNH HÌNH THỰC HIỆN NGÂN SÁCH (BUDGET):\n");
        context.append(budgetContextBuilder);

        // 6. Phân tích qua Gemini hoặc Fallback Rule-based
        String overview = null;
        List<String> recommendations = new ArrayList<>();
        List<String> alerts = new ArrayList<>(budgetAlerts);

        if (geminiConfig.hasApiKey()) {
            try {
                String prompt = MONTHLY_INSIGHTS_PROMPT_TEMPLATE.contains("%s")
                        ? MONTHLY_INSIGHTS_PROMPT_TEMPLATE.replace("%s", context.toString())
                        : (MONTHLY_INSIGHTS_PROMPT_TEMPLATE + "\n\n" + context);
                String jsonResult = geminiClient.generateContent(prompt, true);
                JsonNode root = objectMapper.readTree(jsonResult);
                overview = root.path("overview").asText(null);
                JsonNode recNode = root.path("recommendations");
                if (recNode.isArray()) {
                    for (JsonNode item : recNode) {
                        String txt = item.asText("").trim();
                        if (!txt.isBlank()) {
                            recommendations.add(txt);
                        }
                    }
                }
                JsonNode alertNode = root.path("alerts");
                if (alertNode.isArray()) {
                    for (JsonNode item : alertNode) {
                        String txt = item.asText("").trim();
                        if (!txt.isBlank() && !alerts.contains(txt)) {
                            alerts.add(txt);
                        }
                    }
                }
            } catch (Exception ex) {
                log.warn("Gemini monthly insights generation failed, falling back to local rule-based insights: {}",
                        ex.getMessage());
            }
        }

        // 7. Local Rule-Based Engine (Fallback thông minh sử dụng số liệu thật)
        if (overview == null || overview.isBlank() || recommendations.isEmpty()) {
            recommendations.clear();
            alerts = new ArrayList<>(budgetAlerts);

            if (totalIncome == 0 && totalExpense == 0) {
                overview = String.format("Tháng %s chưa ghi nhận giao dịch tài chính nào trong lịch sử.", month);
                recommendations.add("Hãy bắt đầu ghi chép các khoản chi tiêu hằng ngày để theo dõi dòng tiền.");
                recommendations.add("Thiết lập hạn mức ngân sách tháng cho các nhu cầu thiết yếu như Ăn uống và Sinh hoạt.");
            } else if (netSavings > 0) {
                if (highestExpenseCategory != null) {
                    overview = String.format(
                            "Tình hình tài chính tháng %s rất tích cực! Bạn đã tiết kiệm được %,d VNĐ (tỷ lệ thặng dư đạt %.1f%%). Chi tiêu nhiều nhất ở danh mục '%s' với %,d VNĐ (chiếm %.1f%% tổng chi).",
                            month, netSavings, savingsRate, highestExpenseCategory, highestExpenseAmount, highestExpensePercentage);
                } else {
                    overview = String.format(
                            "Tình hình tài chính tháng %s rất tích cực! Bạn đã tiết kiệm được %,d VNĐ (đạt tỷ lệ thặng dư %.1f%%).",
                            month, netSavings, savingsRate);
                }
                recommendations.add("Cân nhắc chuyển một phần thặng dư vào tài khoản tiết kiệm tích lũy hoặc quỹ dự phòng khẩn cấp.");
                if (highestExpenseCategory != null) {
                    recommendations.add(String.format("Duy trì việc kiểm soát hạn mức chi tiêu cho danh mục '%s' để gia tăng tích lũy.", highestExpenseCategory));
                } else {
                    recommendations.add("Duy trì việc kiểm soát hạn mức chi tiêu để gia tăng tích lũy.");
                }
            } else {
                if (highestExpenseCategory != null) {
                    overview = String.format(
                            "Cảnh báo: Dòng tiền tháng %s đang bị thâm hụt %,d VNĐ so với tổng thu nhập. Chi tiêu lớn nhất tập trung tại danh mục '%s' với %,d VNĐ (chiếm %.1f%% tổng chi).",
                            month, Math.abs(netSavings), highestExpenseCategory, highestExpenseAmount, highestExpensePercentage);
                } else {
                    overview = String.format(
                            "Cảnh báo: Dòng tiền tháng %s đang bị thâm hụt %,d VNĐ so với tổng thu nhập.",
                            month, Math.abs(netSavings));
                }
                alerts.add(0, String.format("Dòng tiền thâm hụt: Chi tiêu vượt thu nhập %,d VNĐ.", Math.abs(netSavings)));
                if (highestExpenseCategory != null) {
                    recommendations.add(String.format("Rà soát và cắt giảm các khoản chi không thiết yếu thuộc danh mục '%s'.", highestExpenseCategory));
                } else {
                    recommendations.add("Rà soát và cắt giảm các khoản chi không thiết yếu trong tháng.");
                }
                recommendations.add("Áp dụng quy tắc quản lý tài chính 50/30/20 để phân bổ lại hạn mức ngân sách các danh mục.");
            }
        }

        AiInsightsKeyMetrics keyMetrics = new AiInsightsKeyMetrics(
                savingsRate,
                highestExpenseCategory,
                highestExpenseAmount,
                highestExpensePercentage,
                incomeChangePercentage,
                expenseChangePercentage,
                savingsChangePercentage
        );

        return new AiInsightsResponse(
                month,
                overview,
                recommendations,
                totalIncome,
                totalExpense,
                netSavings,
                savingsRate,
                keyMetrics,
                topExpenseCategories,
                alerts,
                LocalDateTime.now());
    }

    /**
     * Xử lý câu lệnh hoặc câu hỏi từ người dùng:
     * - Tự động nhận diện ý định (Intent): Báo cáo nhận xét tháng, Truy vấn số
     * liệu, hoặc Ghi nhận giao dịch.
     */
    public AiChatResponse processUserChat(Long userId, String message) {
        return processUserChat(userId, message, null);
    }

    public AiChatResponse processUserChat(Long userId, String message, List<AiChatMessageDto> conversationHistory) {
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
            return executeDataQuery(userId, text, conversationHistory);
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

        // 4. Nếu không thể bóc tách thành giao dịch, chuyển sang trả lời theo dạng trợ lý trò chuyện / tra cứu
        return executeDataQuery(userId, text, conversationHistory);
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
                || norm.contains("so du") || norm.contains("con lai") || norm.contains("tien con")
                || norm.contains("hom qua") || norm.contains("hom nay") || norm.contains("thang truoc")
                || norm.contains("thang nay") || norm.contains("ngan sach") || norm.contains("han muc")
                || norm.contains("danh muc") || norm.contains("chi tieu") || norm.contains("thu nhap")
                || norm.contains("gan day") || norm.contains("tai chinh") || norm.contains("tiet kiem")
                || norm.contains("tong ket") || norm.contains("chao") || norm.contains("xin chao")
                || norm.contains("tro giup") || norm.contains("help");
    }

    /**
     * Thực thi truy vấn dữ liệu tài chính người dùng (qua Gemini RAG hoặc Local Fallback)
     */
    public AiChatResponse executeDataQuery(Long userId, String query) {
        return executeDataQuery(userId, query, null);
    }

    public AiChatResponse executeDataQuery(Long userId, String query, List<AiChatMessageDto> conversationHistory) {
        if (geminiConfig.hasApiKey()) {
            try {
                String answer = queryFinancialDataWithGemini(userId, query, conversationHistory);
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
        return queryFinancialDataWithGemini(userId, userQuery, null);
    }

    public String queryFinancialDataWithGemini(Long userId, String userQuery, List<AiChatMessageDto> conversationHistory) {
        String context = buildUserFinancialContext(userId, conversationHistory);
        String prompt;
        if (FINANCIAL_CHATBOT_PROMPT_TEMPLATE != null && FINANCIAL_CHATBOT_PROMPT_TEMPLATE.contains("%s")) {
            prompt = FINANCIAL_CHATBOT_PROMPT_TEMPLATE
                    .replaceFirst("%s", Matcher.quoteReplacement(context))
                    .replaceFirst("%s", Matcher.quoteReplacement(userQuery));
        } else {
            prompt = String.format(
                    """
                            Bạn là Trợ lý Tài chính cá nhân FinMan AI thông minh, tận tâm và chính xác tại Việt Nam.
                            Dưới đây là DỮ LIỆU TÀI CHÍNH THỰC TẾ của người dùng tại thời điểm hiện tại:

                            %s

                            CÂU HỎI / YÊU CẦU CỦA NGƯỜI DÙNG: "%s"

                            NHIỆM VỤ:
                            1. Trả lời trực tiếp, chính xác, ngắn gọn (1-2 câu), lịch sự và thân thiện bằng tiếng Việt.
                            2. NGUYÊN TẮC HỎI GÌ ĐÁP NẤY: Khi người dùng hỏi tổng tiền hoặc hỏi chi tiêu (ví dụ: "Hôm nay tôi đã tiêu bao nhiêu?"), CHỈ TRẢ LỜI ĐÚNG CON SỐ CHI TIÊU ĐÓ. TUYỆT ĐỐI KHÔNG tự động liệt kê toàn bộ từng giao dịch, không liệt kê số dư ban đầu hoặc thu nhập/chuyển khoản khi chỉ hỏi chi tiêu. Chỉ liệt kê khi người dùng có yêu cầu rõ ràng ("liệt kê", "danh sách", "chi tiết").
                            3. Dựa HOÀN TOÀN vào dữ liệu thực tế được cung cấp ở trên. Tuyệt đối không bịa đặt số liệu hoặc giao dịch không có thật.
                            4. Luôn định dạng số tiền rõ ràng theo chuẩn Việt Nam (ví dụ: 50.000 ₫, 1.250.000 ₫).
                            5. Sử dụng định dạng markdown (in đậm **số tiền**) để câu trả lời trực quan, chuyên nghiệp.
                            6. Nếu người dùng hỏi điều gì mà dữ liệu chưa có, hãy giải thích lịch sự dựa trên dữ liệu hiện có.
                            """,
                    context, userQuery);
        }

        return geminiClient.generateContent(prompt, false);
    }

    /**
     * Bộ giải đáp truy vấn cục bộ (Local Rule-based Query Solver) khi không có mạng
     * hoặc chưa có Gemini Key.
     */
    public String queryFinancialDataLocally(Long userId, String userQuery) {
        String norm = removeAccents(userQuery != null ? userQuery : "").toLowerCase(Locale.ROOT);
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        YearMonth currentMonth = YearMonth.now();
        LocalDate startOfMonth = currentMonth.atDay(1);
        LocalDate endOfMonth = currentMonth.atEndOfMonth();

        boolean wantsList = norm.contains("liet ke") || norm.contains("danh sach") || norm.contains("chi tiet")
                || norm.contains("nhung gi") || norm.contains("giao dich nao") || norm.contains("nhung giao dich")
                || norm.contains("tung vi") || norm.contains("cac vi");

        // 1. Câu hỏi về Số dư / Ví / Tài khoản
        if (norm.contains("so du") || norm.contains("con bao nhieu") || norm.contains("con lai")
                || norm.contains("tien con") || norm.contains("tai khoan") || norm.contains("vi")) {
            List<Account> accounts = accountRepository.findByUserIdAndIsArchivedFalse(userId);
            long totalBalance = accounts.stream().mapToLong(Account::getCurrentBalance).sum();

            for (Account acc : accounts) {
                String accNorm = removeAccents(acc.getName()).toLowerCase(Locale.ROOT);
                if (norm.contains(accNorm)) {
                    return String.format(
                            "Số dư hiện tại của tài khoản **%s** là **%s** (Tổng số dư tất cả các ví: **%s**).",
                            acc.getName(), formatMoney(acc.getCurrentBalance()), formatMoney(totalBalance));
                }
            }

            if (!wantsList) {
                return String.format("Tổng số dư khả dụng hiện tại của bạn là **%s** (trên **%d** tài khoản ví).",
                        formatMoney(totalBalance), accounts.size());
            }

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("Tổng số dư khả dụng hiện tại của bạn là **%s** trên **%d** tài khoản ví:\n",
                    formatMoney(totalBalance), accounts.size()));
            for (Account acc : accounts) {
                sb.append(String.format("- **%s**: %s (%s)\n", acc.getName(), formatMoney(acc.getCurrentBalance()), acc.getType()));
            }
            return sb.toString();
        }

        // 2. Câu hỏi về Hôm qua
        if (norm.contains("hom qua")) {
            Long yExpense = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                    userId, TransactionType.EXPENSE, yesterday, yesterday);
            Long yIncome = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                    userId, TransactionType.INCOME, yesterday, yesterday);
            long exp = yExpense != null ? yExpense : 0L;
            long inc = yIncome != null ? yIncome : 0L;

            boolean isExpenseOnly = (norm.contains("tieu") || norm.contains("chi")) && !norm.contains("thu");
            boolean isIncomeOnly = (norm.contains("thu") || norm.contains("luong")) && !norm.contains("tieu") && !norm.contains("chi");

            if (isExpenseOnly) {
                if (exp == 0) {
                    return String.format("Hôm qua (%s), bạn **không có khoản chi tiêu nào**.", yesterday);
                }
                if (!wantsList) {
                    return String.format("Hôm qua (%s), bạn đã chi tiêu tổng cộng **%s**.", yesterday, formatMoney(exp));
                }
            } else if (isIncomeOnly) {
                if (inc == 0) {
                    return String.format("Hôm qua (%s), bạn **không có khoản thu nhập nào**.", yesterday);
                }
                if (!wantsList) {
                    return String.format("Hôm qua (%s), bạn đã có thu nhập tổng cộng **%s**.", yesterday, formatMoney(inc));
                }
            } else {
                if (exp == 0 && inc == 0) {
                    return String.format("Hôm qua (%s), bạn **không có giao dịch nào** được ghi nhận.", yesterday);
                }
                if (!wantsList) {
                    StringBuilder sb = new StringBuilder();
                    sb.append(String.format("Hôm qua (%s), bạn đã chi tiêu **%s**", yesterday, formatMoney(exp)));
                    if (inc > 0) {
                        sb.append(String.format(" và thu nhập **%s**", formatMoney(inc)));
                    }
                    sb.append(".");
                    return sb.toString();
                }
            }

            // Chỉ liệt kê khi người dùng thực sự yêu cầu
            List<Transaction> yTxns = transactionRepository
                    .findByUserIdAndTransactionDateBetweenOrderByTransactionDateDesc(
                            userId, yesterday, yesterday);
            if (isExpenseOnly) {
                yTxns = yTxns.stream().filter(t -> t.getType() == TransactionType.EXPENSE).collect(Collectors.toList());
            } else if (isIncomeOnly) {
                yTxns = yTxns.stream().filter(t -> t.getType() == TransactionType.INCOME).collect(Collectors.toList());
            }

            if (yTxns.isEmpty()) {
                return String.format("Hôm qua (%s), bạn không có giao dịch nào thỏa mãn yêu cầu.", yesterday);
            }

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("Hôm qua (%s), bạn đã %s tổng cộng **%s** với **%d giao dịch**:\n",
                    yesterday,
                    isExpenseOnly ? "chi tiêu" : (isIncomeOnly ? "thu nhập" : "phát sinh"),
                    formatMoney(isExpenseOnly ? exp : (isIncomeOnly ? inc : exp + inc)),
                    yTxns.size()));
            for (Transaction t : yTxns) {
                sb.append(String.format("- **%s**: %s (%s | %s)\n",
                        t.getNote(), formatMoney(t.getAmount()),
                        getCategoryNameSafe(t),
                        getAccountNameSafe(t)));
            }
            return sb.toString();
        }

        // 3. Câu hỏi về Chi tiêu / Thu nhập Hôm nay
        if (norm.contains("hom nay")) {
            Long todayExpense = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                    userId, TransactionType.EXPENSE, today, today);
            Long todayIncome = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                    userId, TransactionType.INCOME, today, today);
            long exp = todayExpense != null ? todayExpense : 0L;
            long inc = todayIncome != null ? todayIncome : 0L;

            boolean isExpenseOnly = (norm.contains("tieu") || norm.contains("chi")) && !norm.contains("thu");
            boolean isIncomeOnly = (norm.contains("thu") || norm.contains("luong")) && !norm.contains("tieu") && !norm.contains("chi");

            if (isExpenseOnly) {
                if (exp == 0) {
                    return String.format("Hôm nay (%s), bạn **chưa có khoản chi tiêu nào** được ghi nhận.", today);
                }
                if (!wantsList) {
                    return String.format("Hôm nay (%s), bạn đã chi tiêu tổng cộng **%s**.", today, formatMoney(exp));
                }
            } else if (isIncomeOnly) {
                if (inc == 0) {
                    return String.format("Hôm nay (%s), bạn **chưa có khoản thu nhập nào** được ghi nhận.", today);
                }
                if (!wantsList) {
                    return String.format("Hôm nay (%s), bạn đã có thu nhập tổng cộng **%s**.", today, formatMoney(inc));
                }
            } else {
                if (exp == 0 && inc == 0) {
                    return String.format(
                            "Hôm nay (%s), bạn **chưa có giao dịch chi tiêu hoặc thu nhập nào** được ghi nhận.",
                            today.toString());
                }
                if (!wantsList) {
                    StringBuilder sb = new StringBuilder();
                    sb.append(String.format("Hôm nay (%s), bạn đã chi tiêu **%s**", today, formatMoney(exp)));
                    if (inc > 0) {
                        sb.append(String.format(" và thu nhập **%s**", formatMoney(inc)));
                    }
                    sb.append(".");
                    return sb.toString();
                }
            }

            // Chỉ liệt kê khi người dùng thực sự yêu cầu
            List<Transaction> todayTxns = transactionRepository
                    .findByUserIdAndTransactionDateBetweenOrderByTransactionDateDesc(
                            userId, today, today);
            if (isExpenseOnly) {
                todayTxns = todayTxns.stream().filter(t -> t.getType() == TransactionType.EXPENSE).collect(Collectors.toList());
            } else if (isIncomeOnly) {
                todayTxns = todayTxns.stream().filter(t -> t.getType() == TransactionType.INCOME).collect(Collectors.toList());
            }

            if (todayTxns.isEmpty()) {
                return String.format("Hôm nay (%s), bạn không có giao dịch nào thỏa mãn yêu cầu.", today);
            }

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("Hôm nay (%s), bạn đã %s tổng cộng **%s** với **%d giao dịch**:\n",
                    today,
                    isExpenseOnly ? "chi tiêu" : (isIncomeOnly ? "thu nhập" : "phát sinh"),
                    formatMoney(isExpenseOnly ? exp : (isIncomeOnly ? inc : exp + inc)),
                    todayTxns.size()));
            for (Transaction t : todayTxns) {
                sb.append(String.format("- **%s**: %s (%s | %s)\n",
                        t.getNote(), formatMoney(t.getAmount()),
                        getCategoryNameSafe(t),
                        getAccountNameSafe(t)));
            }
            return sb.toString();
        }

        // 4. Ngân sách / Hạn mức
        if (norm.contains("ngan sach") || norm.contains("han muc")) {
            List<Budget> budgets = budgetRepository.findByUserIdAndMonthWithCategory(userId, currentMonth.toString());
            if (budgets.isEmpty()) {
                return String.format("Bạn **chưa thiết lập hạn mức ngân sách** cho tháng %s.", currentMonth);
            }
            List<CategoryAggregationResponse> catAgg = transactionRepository.aggregateByCategory(
                    userId, startOfMonth, endOfMonth, TransactionType.EXPENSE);
            Map<Long, Long> expenseMap = catAgg.stream()
                    .filter(c -> c.getCategoryId() != null)
                    .collect(Collectors.toMap(CategoryAggregationResponse::getCategoryId, CategoryAggregationResponse::getTotalAmount, (a, b) -> a));

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("Tình hình ngân sách tháng **%s** của bạn:\n", currentMonth));
            for (Budget b : budgets) {
                Long catId = b.getCategory() != null ? b.getCategory().getId() : null;
                String catName = b.getCategory() != null ? b.getCategory().getName() : "Danh mục khác";
                Long spent = catId != null ? expenseMap.getOrDefault(catId, 0L) : 0L;
                long budgetAmount = b.getAmount() != null ? b.getAmount() : 0L;
                long remaining = budgetAmount - spent;
                double usedPct = budgetAmount > 0 ? ((double) spent / budgetAmount) * 100.0 : 0.0;

                String status = usedPct > 100.0 ? "⚠️ Vượt hạn mức!" : (usedPct >= 80.0 ? "⚡ Sắp chạm hạn mức" : "✅ An toàn");
                sb.append(String.format(Locale.US, "- **%s**: Đã chi **%s** / Hạn mức **%s** (%.1f%%) - %s (Còn lại: %s)\n",
                        catName, formatMoney(spent), formatMoney(budgetAmount), usedPct, status, formatMoney(remaining)));
            }
            return sb.toString();
        }

        // 5. Chi tiêu theo danh mục
        if (norm.contains("danh muc") || norm.contains("chi vao dau") || norm.contains("chi nhieu nhat")) {
            List<CategoryAggregationResponse> categories = transactionRepository.aggregateByCategory(
                    userId, startOfMonth, endOfMonth, TransactionType.EXPENSE);
            if (categories.isEmpty()) {
                return String.format("Tháng **%s** bạn chưa có khoản chi tiêu nào được ghi nhận.", currentMonth);
            }
            Long monthExpense = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                    userId, TransactionType.EXPENSE, startOfMonth, endOfMonth);
            StringBuilder sb = new StringBuilder();
            sb.append(String.format("Phân bổ chi tiêu theo danh mục tháng **%s** (tổng chi: **%s**):\n", currentMonth, formatMoney(monthExpense)));
            for (CategoryAggregationResponse cat : categories) {
                double pct = monthExpense > 0 ? ((double) cat.getTotalAmount() / monthExpense) * 100.0 : 0.0;
                sb.append(String.format(Locale.US, "- **%s**: %s (chiếm %.1f%%)\n", cat.getCategoryName(), formatMoney(cat.getTotalAmount()), pct));
            }
            return sb.toString();
        }

        // 6. Tháng trước
        if (norm.contains("thang truoc")) {
            YearMonth prevMonth = currentMonth.minusMonths(1);
            Long prevExpense = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                    userId, TransactionType.EXPENSE, prevMonth.atDay(1), prevMonth.atEndOfMonth());
            Long prevIncome = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                    userId, TransactionType.INCOME, prevMonth.atDay(1), prevMonth.atEndOfMonth());
            long prevSavings = prevIncome - prevExpense;
            return String.format("""
                    Tổng quan tài chính **tháng trước (%s)**:
                    - **Tổng thu nhập**: %s
                    - **Tổng chi tiêu**: %s
                    - **Tiết kiệm ròng**: %s %s
                    """,
                    prevMonth.toString(), formatMoney(prevIncome), formatMoney(prevExpense), formatMoney(prevSavings), prevSavings >= 0 ? "✅" : "⚠️");
        }

        // 7. Câu hỏi về Chi tiêu / Thu nhập Tháng này
        if (norm.contains("thang nay") || norm.contains("thang") || norm.contains("tong chi")
                || norm.contains("tong thu") || norm.contains("tiet kiem")) {
            Long monthExpense = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                    userId, TransactionType.EXPENSE, startOfMonth, endOfMonth);
            Long monthIncome = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                    userId, TransactionType.INCOME, startOfMonth, endOfMonth);
            long exp = monthExpense != null ? monthExpense : 0L;
            long inc = monthIncome != null ? monthIncome : 0L;

            boolean isExpenseOnly = (norm.contains("tieu") || norm.contains("chi")) && !norm.contains("thu") && !norm.contains("tiet kiem") && !norm.contains("tong quan");
            boolean isIncomeOnly = (norm.contains("thu") || norm.contains("luong")) && !norm.contains("tieu") && !norm.contains("chi") && !norm.contains("tiet kiem") && !norm.contains("tong quan");

            if (isExpenseOnly) {
                return String.format("Trong tháng **%s**, bạn đã chi tiêu tổng cộng **%s**.", currentMonth, formatMoney(exp));
            }
            if (isIncomeOnly) {
                return String.format("Trong tháng **%s**, tổng thu nhập của bạn là **%s**.", currentMonth, formatMoney(inc));
            }

            long netSavings = inc - exp;
            double savingsRate = inc > 0 ? ((double) netSavings / inc) * 100.0 : 0.0;

            return String.format(Locale.US, """
                    Tổng quan tình hình tài chính tháng **%s** của bạn:
                    - **Tổng thu nhập**: %s
                    - **Tổng chi tiêu**: %s
                    - **Tiết kiệm ròng**: %s %s
                    - **Tỷ lệ tiết kiệm**: %.1f%%
                    """,
                    currentMonth.toString(),
                    formatMoney(inc),
                    formatMoney(exp),
                    formatMoney(netSavings),
                    netSavings >= 0 ? "✅" : "⚠️",
                    savingsRate);
        }

        // 8. Câu hỏi về Giao dịch gần đây
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
                String sign = t.getType() == TransactionType.INCOME ? "+" : (t.getType() == TransactionType.TRANSFER ? "⇄ " : "-");
                sb.append(String.format("- **%s** (%s): %s%s | %s | Ví: %s\n",
                        t.getNote(),
                        t.getTransactionDate(),
                        sign,
                        formatMoney(t.getAmount()),
                        getCategoryNameSafe(t),
                        getAccountNameSafe(t)));
            }
            return sb.toString();
        }

        // 9. Câu trả lời mặc định tóm tắt nhanh tình trạng tài chính
        List<Account> accounts = accountRepository.findByUserIdAndIsArchivedFalse(userId);
        long totalBalance = accounts.stream().mapToLong(Account::getCurrentBalance).sum();
        Long todayExpense = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                userId, TransactionType.EXPENSE, today, today);
        Long monthExpense = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                userId, TransactionType.EXPENSE, startOfMonth, endOfMonth);

        return String.format(
                """
                        Dưới đây là tóm tắt nhanh tình hình tài chính của bạn:
                        - **Tổng tài sản/số dư hiện tại**: %s (trên %d tài khoản ví)
                        - **Chi tiêu hôm nay (%s)**: %s
                        - **Tổng chi tiêu tháng này (%s)**: %s
                        - Bạn có thể hỏi tôi chi tiết: *"Hôm nay tôi đã tiêu bao nhiêu?"*, *"Hôm qua tôi tiêu gì?"*, *"Ngân sách tháng này thế nào?"*, hoặc *"So sánh chi tiêu với tháng trước"*.
                        """,
                formatMoney(totalBalance), accounts.size(), today.toString(), formatMoney(todayExpense), currentMonth.toString(), formatMoney(monthExpense));
    }

    /**
     * Tổng hợp dữ liệu tài chính thực tế của người dùng làm ngữ cảnh cho Gemini RAG.
     */
    public String buildUserFinancialContext(Long userId) {
        return buildUserFinancialContext(userId, null);
    }

    public String buildUserFinancialContext(Long userId, List<AiChatMessageDto> conversationHistory) {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        YearMonth currentMonth = YearMonth.now();
        LocalDate startOfMonth = currentMonth.atDay(1);
        LocalDate endOfMonth = currentMonth.atEndOfMonth();
        YearMonth prevMonth = currentMonth.minusMonths(1);
        LocalDate startOfPrevMonth = prevMonth.atDay(1);
        LocalDate endOfPrevMonth = prevMonth.atEndOfMonth();

        StringBuilder sb = new StringBuilder();
        sb.append("DỮ LIỆU TÀI CHÍNH THỰC TẾ CỦA NGƯỜI DÙNG (SOURCE OF TRUTH TỪ FINMAN DATABASE):\n\n");

        // [NHÓM A: THỜI GIAN THAM CHIẾU HỆ THỐNG]
        sb.append("[NHÓM A: THỜI GIAN THAM CHIẾU HỆ THỐNG]\n");
        sb.append(String.format("- Ngày hệ thống hiện tại (Hôm nay): %s (%s)\n", today, getVietnameseDayOfWeek(today.getDayOfWeek())));
        sb.append(String.format("- Hôm qua: %s (%s)\n", yesterday, getVietnameseDayOfWeek(yesterday.getDayOfWeek())));
        sb.append(String.format("- Tháng hiện tại: %s (từ %s đến %s)\n", currentMonth, startOfMonth, endOfMonth));
        sb.append(String.format("- Tháng trước: %s (từ %s đến %s)\n\n", prevMonth, startOfPrevMonth, endOfPrevMonth));

        // [NHÓM B: TÀI KHOẢN VÀ VÍ TIỀN]
        List<Account> accounts = accountRepository.findByUserIdAndIsArchivedFalse(userId);
        long totalBalance = accounts.stream().mapToLong(Account::getCurrentBalance).sum();
        sb.append("[NHÓM B: TÀI KHOẢN VÀ VÍ TIỀN]\n");
        sb.append(String.format("- Tổng số dư khả dụng hiện tại: %s (trên %d tài khoản ví)\n", formatMoney(totalBalance), accounts.size()));
        if (accounts.isEmpty()) {
            sb.append("- Người dùng chưa tạo tài khoản nào trong hệ thống.\n");
        } else {
            for (Account acc : accounts) {
                sb.append(String.format("  + %s (%s): %s\n", acc.getName(), acc.getType(), formatMoney(acc.getCurrentBalance())));
            }
        }
        sb.append("\n");

        // [NHÓM C: TỔNG QUAN TÀI CHÍNH THÁNG HIỆN TẠI]
        Long monthExpense = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                userId, TransactionType.EXPENSE, startOfMonth, endOfMonth);
        Long monthIncome = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                userId, TransactionType.INCOME, startOfMonth, endOfMonth);
        long netSavings = monthIncome - monthExpense;
        double savingsRate = monthIncome > 0 ? ((double) netSavings / monthIncome) * 100.0 : 0.0;

        sb.append(String.format("[NHÓM C: TỔNG QUAN THÁNG HIỆN TẠI (%s)]\n", currentMonth));
        sb.append(String.format("- Tổng thu nhập tháng: %s\n", formatMoney(monthIncome)));
        sb.append(String.format("- Tổng chi tiêu tháng: %s\n", formatMoney(monthExpense)));
        sb.append(String.format("- Tiết kiệm ròng: %s %s\n", formatMoney(netSavings), netSavings >= 0 ? "(Dương/Thặng dư)" : "(Âm/Thâm hụt)"));
        sb.append(String.format(Locale.US, "- Tỷ lệ tiết kiệm (savingsRate): %.1f%%\n", savingsRate));

        // Category Breakdown
        List<CategoryAggregationResponse> expenseAgg = transactionRepository.aggregateByCategory(
                userId, startOfMonth, endOfMonth, TransactionType.EXPENSE);
        sb.append("- Phân bổ chi tiêu theo danh mục (sắp xếp giảm dần):\n");
        if (expenseAgg.isEmpty()) {
            sb.append("  + Chưa có chi tiêu nào trong tháng này.\n");
        } else {
            for (CategoryAggregationResponse cat : expenseAgg) {
                double pct = monthExpense > 0 ? ((double) cat.getTotalAmount() / monthExpense) * 100.0 : 0.0;
                sb.append(String.format(Locale.US, "  + %s: %s (chiếm %.1f%% tổng chi, %d giao dịch)\n",
                        cat.getCategoryName(), formatMoney(cat.getTotalAmount()), pct, cat.getTransactionCount()));
            }
        }
        sb.append("\n");

        // [NHÓM D: HẠN MỨC NGÂN SÁCH THÁNG HIỆN TẠI (NO N+1 QUERY)]
        List<Budget> budgets = budgetRepository.findByUserIdAndMonthWithCategory(userId, currentMonth.toString());
        Map<Long, Long> expenseByCategoryId = expenseAgg.stream()
                .filter(c -> c.getCategoryId() != null)
                .collect(Collectors.toMap(
                        CategoryAggregationResponse::getCategoryId,
                        CategoryAggregationResponse::getTotalAmount,
                        (existing, replacement) -> existing
                ));

        sb.append(String.format("[NHÓM D: HẠN MỨC NGÂN SÁCH THÁNG HIỆN TẠI (%s)]\n", currentMonth));
        if (budgets.isEmpty()) {
            sb.append("- Người dùng chưa thiết lập hạn mức ngân sách cho tháng này.\n");
        } else {
            for (Budget b : budgets) {
                Long catId = (b.getCategory() != null) ? b.getCategory().getId() : null;
                String catName = (b.getCategory() != null) ? b.getCategory().getName() : "Danh mục khác";
                Long spent = catId != null ? expenseByCategoryId.getOrDefault(catId, 0L) : 0L;
                long budgetAmount = b.getAmount() != null ? b.getAmount() : 0L;
                long remaining = budgetAmount - spent;
                double usedPct = budgetAmount > 0 ? ((double) spent / budgetAmount) * 100.0 : 0.0;

                String status;
                if (usedPct > 100.0) {
                    status = String.format("VƯỢT NGÂN SÁCH (vượt %s)", formatMoney(Math.abs(remaining)));
                } else if (usedPct >= 80.0) {
                    status = String.format("CẢNH BÁO (sắp chạm hạn mức, còn %s)", formatMoney(remaining));
                } else {
                    status = String.format("An toàn (còn lại %s)", formatMoney(remaining));
                }
                sb.append(String.format(Locale.US, "  + %s: Đã chi %s / Hạn mức %s (Đã dùng %.1f%%) -> Trạng thái: %s\n",
                        catName, formatMoney(spent), formatMoney(budgetAmount), usedPct, status));
            }
        }
        sb.append("\n");

        // [NHÓM E: GIAO DỊCH HÔM NAY VÀ HÔM QUA]
        Long todayExpense = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(userId, TransactionType.EXPENSE, today, today);
        Long todayIncome = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(userId, TransactionType.INCOME, today, today);
        List<Transaction> todayTxns = transactionRepository.findByUserIdAndTransactionDateBetweenOrderByTransactionDateDesc(userId, today, today);

        Long yesterdayExpense = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(userId, TransactionType.EXPENSE, yesterday, yesterday);
        Long yesterdayIncome = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(userId, TransactionType.INCOME, yesterday, yesterday);
        List<Transaction> yesterdayTxns = transactionRepository.findByUserIdAndTransactionDateBetweenOrderByTransactionDateDesc(userId, yesterday, yesterday);

        sb.append("[NHÓM E: GIAO DỊCH HÔM NAY VÀ HÔM QUA]\n");
        sb.append(String.format("1. Hôm nay (%s): Tổng chi: %s | Tổng thu: %s\n", today, formatMoney(todayExpense), formatMoney(todayIncome)));
        if (todayTxns.isEmpty()) {
            sb.append("   - Hôm nay chưa có giao dịch nào được ghi nhận.\n");
        } else {
            for (Transaction t : todayTxns) {
                sb.append(String.format("   + %s: %s | %s | %s | Ví: %s\n",
                        t.getNote(), formatMoney(t.getAmount()), t.getType(), getCategoryNameSafe(t), getAccountNameSafe(t)));
            }
        }

        sb.append(String.format("2. Hôm qua (%s): Tổng chi: %s | Tổng thu: %s\n", yesterday, formatMoney(yesterdayExpense), formatMoney(yesterdayIncome)));
        if (yesterdayTxns.isEmpty()) {
            sb.append("   - Hôm qua không có giao dịch nào được ghi nhận.\n");
        } else {
            for (Transaction t : yesterdayTxns) {
                sb.append(String.format("   + %s: %s | %s | %s | Ví: %s\n",
                        t.getNote(), formatMoney(t.getAmount()), t.getType(), getCategoryNameSafe(t), getAccountNameSafe(t)));
            }
        }
        sb.append("\n");

        // [NHÓM F: SO SÁNH VỚI THÁNG TRƯỚC (MoM)]
        Long prevMonthExpense = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                userId, TransactionType.EXPENSE, startOfPrevMonth, endOfPrevMonth);
        Long prevMonthIncome = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                userId, TransactionType.INCOME, startOfPrevMonth, endOfPrevMonth);
        long prevNetSavings = prevMonthIncome - prevMonthExpense;

        sb.append(String.format("[NHÓM F: SO SÁNH BIẾN ĐỘNG VỚI THÁNG TRƯỚC (%s vs %s)]\n", prevMonth, currentMonth));
        if (prevMonthExpense == 0 && prevMonthIncome == 0) {
            sb.append(String.format("- Tháng trước (%s) người dùng chưa có dữ liệu giao dịch để so sánh biến động.\n", prevMonth));
        } else {
            long expenseDiff = monthExpense - prevMonthExpense;
            long incomeDiff = monthIncome - prevMonthIncome;
            String expenseDiffDesc;
            if (prevMonthExpense > 0) {
                double pctChange = ((double) expenseDiff / prevMonthExpense) * 100.0;
                expenseDiffDesc = String.format(Locale.US, "%s %s (%+.1f%% so với tháng trước)",
                        expenseDiff > 0 ? "TĂNG" : (expenseDiff < 0 ? "GIẢM" : "KHÔNG ĐỔI"),
                        formatMoney(Math.abs(expenseDiff)), pctChange);
            } else {
                expenseDiffDesc = String.format("Tháng này chi %s (tháng trước là 0 ₫)", formatMoney(monthExpense));
            }

            String incomeDiffDesc;
            if (prevMonthIncome > 0) {
                double pctChange = ((double) incomeDiff / prevMonthIncome) * 100.0;
                incomeDiffDesc = String.format(Locale.US, "%s %s (%+.1f%% so với tháng trước)",
                        incomeDiff > 0 ? "TĂNG" : (incomeDiff < 0 ? "GIẢM" : "KHÔNG ĐỔI"),
                        formatMoney(Math.abs(incomeDiff)), pctChange);
            } else {
                incomeDiffDesc = String.format("Tháng này thu %s (tháng trước là 0 ₫)", formatMoney(monthIncome));
            }

            sb.append(String.format("- Tháng trước (%s): Tổng thu %s | Tổng chi %s | Tiết kiệm ròng %s\n",
                    prevMonth, formatMoney(prevMonthIncome), formatMoney(prevMonthExpense), formatMoney(prevNetSavings)));
            sb.append(String.format("- Biến động chi tiêu MoM: %s\n", expenseDiffDesc));
            sb.append(String.format("- Biến động thu nhập MoM: %s\n", incomeDiffDesc));
        }
        sb.append("\n");

        // [NHÓM G: CÁC GIAO DỊCH GẦN ĐÂY NHẤT]
        Page<Transaction> recentPage = transactionRepository.findByUserId(
                userId, PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "transactionDate", "createdAt")));
        List<Transaction> recentTxns = recentPage.getContent();
        sb.append("[NHÓM G: CÁC GIAO DỊCH GẦN ĐÂY NHẤT (TỐI ĐA 10 GIAO DỊCH)]\n");
        if (recentTxns.isEmpty()) {
            sb.append("- Chưa có giao dịch nào được ghi nhận trong lịch sử.\n");
        } else {
            for (Transaction t : recentTxns) {
                sb.append(String.format("  + %s | %s: %s%s | %s | %s | Ví: %s\n",
                        t.getTransactionDate(), t.getNote(),
                        t.getType() == TransactionType.INCOME ? "+" : "-",
                        formatMoney(t.getAmount()), t.getType(),
                        getCategoryNameSafe(t),
                        getAccountNameSafe(t)));
            }
        }
        sb.append("\n");

        // [NHÓM H: LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ]
        if (conversationHistory != null && !conversationHistory.isEmpty()) {
            sb.append("[NHÓM H: LỊCH SỬ HỘI THOẠI GẦN ĐÂY (CONTEXT)]\n");
            int startIdx = Math.max(0, conversationHistory.size() - 6);
            for (int i = startIdx; i < conversationHistory.size(); i++) {
                AiChatMessageDto msg = conversationHistory.get(i);
                if (msg != null && msg.getContent() != null && !msg.getContent().isBlank()) {
                    String role = "user".equalsIgnoreCase(msg.getRole()) ? "Người dùng" : "Trợ lý";
                    sb.append(String.format("- %s: %s\n", role, msg.getContent().trim()));
                }
            }
            sb.append("\n");
        }

        return sb.toString();
    }

    private String getVietnameseDayOfWeek(DayOfWeek dayOfWeek) {
        if (dayOfWeek == null) return "Không xác định";
        return switch (dayOfWeek) {
            case MONDAY -> "Thứ Hai";
            case TUESDAY -> "Thứ Ba";
            case WEDNESDAY -> "Thứ Tư";
            case THURSDAY -> "Thứ Năm";
            case FRIDAY -> "Thứ Sáu";
            case SATURDAY -> "Thứ Bảy";
            case SUNDAY -> "Chủ Nhật";
        };
    }

    private String getCategoryNameSafe(Transaction t) {
        try {
            if (t == null)
                return "Khác";
            if (t.getType() == TransactionType.TRANSFER) {
                return "Chuyển khoản nội bộ";
            }
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
            String fromName = (a != null && a.getName() != null) ? a.getName() : "Ví";
            if (t.getType() == TransactionType.TRANSFER) {
                Account to = t.getToAccount();
                String toName = (to != null && to.getName() != null) ? to.getName() : "Ví nhận";
                return fromName + " ➔ " + toName;
            }
            return fromName;
        } catch (Exception e) {
            return "Ví";
        }
    }

    private static String formatMoney(Long amount) {
        if (amount == null) amount = 0L;
        return String.format(Locale.US, "%,d", amount).replace(',', '.') + " ₫";
    }

    private static String removeAccents(String s) {
        if (s == null)
            return "";
        String normalized = Normalizer.normalize(s, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        return pattern.matcher(normalized).replaceAll("").replace('đ', 'd').replace('Đ', 'D').trim();
    }

    private static String loadPromptTemplate() {
        // 1. Thử nạp từ file dev ngoài project nếu có (để dev/tinh chỉnh prompt nhanh không cần build lại)
        String[] devPaths = {
                "promts/parse",
                "../promts/parse",
                "backend/src/main/resources/prompts/parse-transaction.txt",
                "src/main/resources/prompts/parse-transaction.txt"
        };
        for (String p : devPaths) {
            try {
                Path path = Paths.get(p);
                if (Files.exists(path)) {
                    String raw = Files.readString(path, StandardCharsets.UTF_8);
                    String cleaned = cleanPromptText(raw);
                    if (!cleaned.isBlank()) {
                        log.info("Đã nạp AI prompt template từ file ngoài: {}", path.toAbsolutePath());
                        return cleaned;
                    }
                }
            } catch (Exception ignored) {
            }
        }

        // 2. Nạp từ Classpath Resource (chuẩn đóng gói JAR / Production)
        try (InputStream is = AiService.class.getClassLoader().getResourceAsStream("prompts/parse-transaction.txt")) {
            if (is != null) {
                String raw = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                String cleaned = cleanPromptText(raw);
                if (!cleaned.isBlank()) {
                    return cleaned;
                }
            }
        } catch (Exception e) {
            log.warn("Không thể nạp prompt template từ classpath: {}", e.getMessage());
        }

        // 3. Fallback tối thiểu dự phòng
        return """
                Bạn là AI chuyên trích xuất giao dịch tài chính cho ứng dụng FinMan tại Việt Nam.
                Hôm nay: %s. Hôm qua: %s. Năm: %d.
                Danh mục: %s
                Tài khoản: %s
                Nội dung: %s
                Hôm nay: %s, Hôm qua: %s, Mặc định: %s, %s
                """;
    }

    private static String loadMonthlyInsightsPromptTemplate() {
        String[] devPaths = {
                "backend/src/main/resources/prompts/monthly-insights.txt",
                "src/main/resources/prompts/monthly-insights.txt"
        };
        for (String p : devPaths) {
            try {
                Path path = Paths.get(p);
                if (Files.exists(path)) {
                    String raw = Files.readString(path, StandardCharsets.UTF_8);
                    String cleaned = cleanPromptText(raw);
                    if (!cleaned.isBlank()) {
                        log.info("Đã nạp AI monthly insights prompt template từ file ngoài: {}", path.toAbsolutePath());
                        return cleaned;
                    }
                }
            } catch (Exception ignored) {
            }
        }

        try (InputStream is = AiService.class.getClassLoader().getResourceAsStream("prompts/monthly-insights.txt")) {
            if (is != null) {
                String raw = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                String cleaned = cleanPromptText(raw);
                if (!cleaned.isBlank()) {
                    return cleaned;
                }
            }
        } catch (Exception e) {
            log.warn("Không thể nạp monthly insights prompt template từ classpath: {}", e.getMessage());
        }

        return """
                Bạn là chuyên gia tài chính cá nhân cho FinMan.
                Dữ liệu tài chính:
                %s
                Trả về JSON có overview, recommendations và alerts.
                """;
    }

    private static String loadFinancialChatbotPromptTemplate() {
        String[] devPaths = {
                "backend/src/main/resources/prompts/financial-chatbot.txt",
                "src/main/resources/prompts/financial-chatbot.txt"
        };
        for (String p : devPaths) {
            try {
                Path path = Paths.get(p);
                if (Files.exists(path)) {
                    String raw = Files.readString(path, StandardCharsets.UTF_8);
                    String cleaned = cleanPromptText(raw);
                    if (!cleaned.isBlank()) {
                        log.info("Đã nạp AI financial chatbot prompt template từ file ngoài: {}", path.toAbsolutePath());
                        return cleaned;
                    }
                }
            } catch (Exception ignored) {
            }
        }

        try (InputStream is = AiService.class.getClassLoader().getResourceAsStream("prompts/financial-chatbot.txt")) {
            if (is != null) {
                String raw = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                String cleaned = cleanPromptText(raw);
                if (!cleaned.isBlank()) {
                    return cleaned;
                }
            }
        } catch (Exception e) {
            log.warn("Không thể nạp financial chatbot prompt template từ classpath: {}", e.getMessage());
        }

        return """
                Bạn là Trợ lý Tài chính FinMan AI.
                DỮ LIỆU TÀI CHÍNH:
                %s

                CÂU HỎI: "%s"
                Trả lời trực tiếp, chính xác, định dạng tiền VNĐ.
                """;
    }

    private static String cleanPromptText(String raw) {
        if (raw == null) {
            return "";
        }
        int firstTriple = raw.indexOf("\"\"\"");
        int lastTriple = raw.lastIndexOf("\"\"\"");
        if (firstTriple >= 0 && lastTriple > firstTriple) {
            raw = raw.substring(firstTriple + 3, lastTriple);
        }
        return raw.stripIndent().trim();
    }
}
