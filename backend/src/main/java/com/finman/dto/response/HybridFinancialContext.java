package com.finman.dto.response;

import com.finman.entity.enums.AccountType;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

/**
 * DTO đại diện cho Ngữ cảnh Tài chính Đa nguồn (Hybrid Financial Context).
 * Kết hợp dữ liệu nội bộ (Số dư ví, ngân sách, top chi tiêu của user)
 * và dữ liệu ngoại vi (Tin tức thị trường liên quan có dẫn nguồn).
 */
public class HybridFinancialContext {

    private Long userId;
    private LocalDate asOfDate;
    private String currentMonth;
    private long retrievalDurationMs;

    private AccountContext accountContext = new AccountContext();
    private BudgetContext budgetContext = new BudgetContext();
    private List<TopExpenseItem> topExpenses = new ArrayList<>();
    private List<RetrievedNewsItem> relevantNews = new ArrayList<>();

    public HybridFinancialContext() {
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public LocalDate getAsOfDate() {
        return asOfDate;
    }

    public void setAsOfDate(LocalDate asOfDate) {
        this.asOfDate = asOfDate;
    }

    public String getCurrentMonth() {
        return currentMonth;
    }

    public void setCurrentMonth(String currentMonth) {
        this.currentMonth = currentMonth;
    }

    public long getRetrievalDurationMs() {
        return retrievalDurationMs;
    }

    public void setRetrievalDurationMs(long retrievalDurationMs) {
        this.retrievalDurationMs = retrievalDurationMs;
    }

    public AccountContext getAccountContext() {
        return accountContext;
    }

    public void setAccountContext(AccountContext accountContext) {
        this.accountContext = accountContext != null ? accountContext : new AccountContext();
    }

    public BudgetContext getBudgetContext() {
        return budgetContext;
    }

    public void setBudgetContext(BudgetContext budgetContext) {
        this.budgetContext = budgetContext != null ? budgetContext : new BudgetContext();
    }

    public List<TopExpenseItem> getTopExpenses() {
        return topExpenses;
    }

    public void setTopExpenses(List<TopExpenseItem> topExpenses) {
        this.topExpenses = topExpenses != null ? topExpenses : new ArrayList<>();
    }

    public List<RetrievedNewsItem> getRelevantNews() {
        return relevantNews;
    }

    public void setRelevantNews(List<RetrievedNewsItem> relevantNews) {
        this.relevantNews = relevantNews != null ? relevantNews : new ArrayList<>();
    }

    // ==========================================
    // INNER CLASSES: Sub-contexts
    // ==========================================

    public static class AccountContext {
        private long totalBalance = 0L;
        private long cashBalance = 0L;
        private long bankBalance = 0L;
        private long creditCardBalance = 0L;
        private long investmentBalance = 0L;
        private long otherBalance = 0L;
        private List<AccountItem> accounts = new ArrayList<>();

        public long getTotalBalance() {
            return totalBalance;
        }

        public void setTotalBalance(long totalBalance) {
            this.totalBalance = totalBalance;
        }

        public long getCashBalance() {
            return cashBalance;
        }

        public void setCashBalance(long cashBalance) {
            this.cashBalance = cashBalance;
        }

        public long getBankBalance() {
            return bankBalance;
        }

        public void setBankBalance(long bankBalance) {
            this.bankBalance = bankBalance;
        }

        public long getCreditCardBalance() {
            return creditCardBalance;
        }

        public void setCreditCardBalance(long creditCardBalance) {
            this.creditCardBalance = creditCardBalance;
        }

        public long getInvestmentBalance() {
            return investmentBalance;
        }

        public void setInvestmentBalance(long investmentBalance) {
            this.investmentBalance = investmentBalance;
        }

        public long getOtherBalance() {
            return otherBalance;
        }

        public void setOtherBalance(long otherBalance) {
            this.otherBalance = otherBalance;
        }

        public List<AccountItem> getAccounts() {
            return accounts;
        }

        public void setAccounts(List<AccountItem> accounts) {
            this.accounts = accounts != null ? accounts : new ArrayList<>();
        }
    }

    public static class AccountItem {
        private Long id;
        private String name;
        private AccountType type;
        private long currentBalance;
        private String accountNumber;

        public AccountItem() {
        }

        public AccountItem(Long id, String name, AccountType type, long currentBalance, String accountNumber) {
            this.id = id;
            this.name = name;
            this.type = type;
            this.currentBalance = currentBalance;
            this.accountNumber = accountNumber;
        }

        public Long getId() {
            return id;
        }

        public String getName() {
            return name;
        }

        public AccountType getType() {
            return type;
        }

        public long getCurrentBalance() {
            return currentBalance;
        }

        public String getAccountNumber() {
            return accountNumber;
        }
    }

    public static class BudgetContext {
        private String month;
        private long totalBudget = 0L;
        private long totalSpent = 0L;
        private long remaining = 0L;
        private double percentUsed = 0.0;
        private List<CategoryBudgetItem> categoryBudgets = new ArrayList<>();

        public String getMonth() {
            return month;
        }

        public void setMonth(String month) {
            this.month = month;
        }

        public long getTotalBudget() {
            return totalBudget;
        }

        public long getTotalBudgetAmount() {
            return totalBudget;
        }

        public void setTotalBudget(long totalBudget) {
            this.totalBudget = totalBudget;
        }

        public long getTotalSpent() {
            return totalSpent;
        }

        public void setTotalSpent(long totalSpent) {
            this.totalSpent = totalSpent;
        }

        public long getRemaining() {
            return remaining;
        }

        public void setRemaining(long remaining) {
            this.remaining = remaining;
        }

        public double getPercentUsed() {
            return percentUsed;
        }

        public void setPercentUsed(double percentUsed) {
            this.percentUsed = percentUsed;
        }

        public List<CategoryBudgetItem> getCategoryBudgets() {
            return categoryBudgets;
        }

        public void setCategoryBudgets(List<CategoryBudgetItem> categoryBudgets) {
            this.categoryBudgets = categoryBudgets != null ? categoryBudgets : new ArrayList<>();
        }
    }

    public static class CategoryBudgetItem {
        private Long categoryId;
        private String categoryName;
        private long budgetAmount;
        private long spentAmount;
        private long remainingAmount;
        private double percentUsed;

        public CategoryBudgetItem() {
        }

        public CategoryBudgetItem(Long categoryId, String categoryName, long budgetAmount, long spentAmount) {
            this.categoryId = categoryId;
            this.categoryName = categoryName;
            this.budgetAmount = budgetAmount;
            this.spentAmount = spentAmount;
            this.remainingAmount = budgetAmount - spentAmount;
            this.percentUsed = budgetAmount > 0 ? ((double) spentAmount / budgetAmount) * 100.0 : 0.0;
        }

        public Long getCategoryId() {
            return categoryId;
        }

        public String getCategoryName() {
            return categoryName;
        }

        public long getBudgetAmount() {
            return budgetAmount;
        }

        public long getSpentAmount() {
            return spentAmount;
        }

        public long getRemainingAmount() {
            return remainingAmount;
        }

        public double getPercentUsed() {
            return percentUsed;
        }
    }

    public static class TopExpenseItem {
        private Long transactionId;
        private long amount;
        private LocalDate transactionDate;
        private String categoryName;
        private String accountName;
        private String note;

        public TopExpenseItem() {
        }

        public TopExpenseItem(Long transactionId, long amount, LocalDate transactionDate,
                              String categoryName, String accountName, String note) {
            this.transactionId = transactionId;
            this.amount = amount;
            this.transactionDate = transactionDate;
            this.categoryName = categoryName;
            this.accountName = accountName;
            this.note = note;
        }

        public Long getTransactionId() {
            return transactionId;
        }

        public long getAmount() {
            return amount;
        }

        public LocalDate getTransactionDate() {
            return transactionDate;
        }

        public String getCategoryName() {
            return categoryName;
        }

        public String getAccountName() {
            return accountName;
        }

        public String getNote() {
            return note;
        }
    }

    public static class RetrievedNewsItem {
        private int citationIndex;
        private Long articleId;
        private String title;
        private String sourceName;
        private String originalUrl;
        private String publishedAt;
        private String snippet;
        private String sentiment;
        private String sentimentReason;
        private String bulletPoints;
        private String relatedTickers;

        public RetrievedNewsItem() {
        }

        public RetrievedNewsItem(int citationIndex, Long articleId, String title, String sourceName,
                                 String originalUrl, String publishedAt, String snippet,
                                 String sentiment, String sentimentReason, String bulletPoints,
                                 String relatedTickers) {
            this.citationIndex = citationIndex;
            this.articleId = articleId;
            this.title = title;
            this.sourceName = sourceName;
            this.originalUrl = originalUrl;
            this.publishedAt = publishedAt;
            this.snippet = snippet;
            this.sentiment = sentiment;
            this.sentimentReason = sentimentReason;
            this.bulletPoints = bulletPoints;
            this.relatedTickers = relatedTickers;
        }

        public int getCitationIndex() {
            return citationIndex;
        }

        public Long getArticleId() {
            return articleId;
        }

        public String getTitle() {
            return title;
        }

        public String getSourceName() {
            return sourceName;
        }

        public String getOriginalUrl() {
            return originalUrl;
        }

        public String getPublishedAt() {
            return publishedAt;
        }

        public String getSnippet() {
            return snippet;
        }

        public String getSentiment() {
            return sentiment;
        }

        public String getSentimentReason() {
            return sentimentReason;
        }

        public String getBulletPoints() {
            return bulletPoints;
        }

        public String getRelatedTickers() {
            return relatedTickers;
        }
    }

    // ==========================================
    // PROMPT FORMATTING UTILITIES
    // ==========================================

    private static String formatMoney(long amount) {
        return String.format(Locale.US, "%,d", amount).replace(',', '.') + " ₫";
    }

    /**
     * Xuất chuỗi ngữ cảnh nội bộ người dùng (User Internal Financial Context).
     */
    public String toInternalFinancialContextString() {
        StringBuilder sb = new StringBuilder();
        sb.append("=== THÔNG TIN TÀI CHÍNH NỘI BỘ CỦA BẠN (CẬP NHẬT: ").append(asOfDate).append(") ===\n");

        // 1. Phân bổ số dư 5 loại tài khoản
        sb.append("[1. SỐ DƯ TÀI KHOẢN THEO 5 MỤC ĐÍCH]:\n");
        sb.append(String.format("- Tổng tài sản thực tế: %s\n", formatMoney(accountContext.totalBalance)));
        sb.append(String.format("  + Tiền mặt (CASH): %s\n", formatMoney(accountContext.cashBalance)));
        sb.append(String.format("  + Tài khoản ngân hàng (BANK): %s\n", formatMoney(accountContext.bankBalance)));
        sb.append(String.format("  + Dư nợ thẻ tín dụng (CREDIT_CARD): %s\n", formatMoney(accountContext.creditCardBalance)));
        sb.append(String.format("  + Danh mục đầu tư (INVESTMENT): %s\n", formatMoney(accountContext.investmentBalance)));
        sb.append(String.format("  + Tài sản / Ví khác (OTHER): %s\n", formatMoney(accountContext.otherBalance)));

        if (!accountContext.accounts.isEmpty()) {
            sb.append("  * Chi tiết từng ví/tài khoản:\n");
            for (AccountItem acc : accountContext.accounts) {
                sb.append(String.format("    - %s (%s): %s\n", acc.name, acc.type, formatMoney(acc.currentBalance)));
            }
        }
        sb.append("\n");

        // 2. Ngân sách chi tiêu tháng
        sb.append(String.format("[2. TÌNH HÌNH NGÂN SÁCH THÁNG %s]:\n", currentMonth));
        if (budgetContext.totalBudget > 0) {
            sb.append(String.format("- Tổng hạn mức ngân sách: %s | Đã chi: %s (%.1f%%) | Còn lại: %s\n",
                    formatMoney(budgetContext.totalBudget),
                    formatMoney(budgetContext.totalSpent),
                    budgetContext.percentUsed,
                    formatMoney(budgetContext.remaining)));
            if (!budgetContext.categoryBudgets.isEmpty()) {
                sb.append("  * Tiến độ theo từng danh mục:\n");
                for (CategoryBudgetItem b : budgetContext.categoryBudgets) {
                    sb.append(String.format("    - %s: Ngân sách %s | Đã chi %s (%.1f%%) | Còn %s\n",
                            b.categoryName,
                            formatMoney(b.budgetAmount),
                            formatMoney(b.spentAmount),
                            b.percentUsed,
                            formatMoney(b.remainingAmount)));
                }
            }
        } else {
            sb.append("- Tháng này bạn chưa thiết lập hạn mức ngân sách.\n");
        }
        sb.append("\n");

        // 3. Top chi tiêu lớn nhất trong tháng
        sb.append(String.format("[3. TOP KHOẢN CHI TIÊU LỚN NHẤT THÁNG %s]:\n", currentMonth));
        if (!topExpenses.isEmpty()) {
            for (int i = 0; i < topExpenses.size(); i++) {
                TopExpenseItem exp = topExpenses.get(i);
                String cat = exp.categoryName != null ? exp.categoryName : "Không phân loại";
                String note = exp.note != null && !exp.note.isBlank() ? " (" + exp.note + ")" : "";
                sb.append(String.format("  %d. %s - %s: %s%s (từ ví %s)\n",
                        i + 1,
                        exp.transactionDate,
                        cat,
                        formatMoney(exp.amount),
                        note,
                        exp.accountName != null ? exp.accountName : "N/A"));
            }
        } else {
            sb.append("- Chưa ghi nhận khoản chi tiêu nào trong tháng này.\n");
        }

        return sb.toString();
    }

    /**
     * Xuất chuỗi tin tức ngoại vi bọc trong thẻ sandbox <untrusted_external_news>
     * để triệt tiêu nguy cơ Prompt Injection từ các bài báo bên ngoài.
     */
    public String toUntrustedExternalNewsString() {
        StringBuilder sb = new StringBuilder();
        sb.append("<untrusted_external_news>\n");
        sb.append("=== NGUỒN TIN TỨC TÀI CHÍNH THAM KHẢO (ĐÃ ĐƯỢC XÁC THỰC) ===\n");
        if (relevantNews.isEmpty()) {
            sb.append("Không có bản tin thị trường nào trực tiếp liên quan hoặc chưa có dữ liệu báo mới.\n");
        } else {
            for (RetrievedNewsItem news : relevantNews) {
                sb.append(String.format("[%d] TIÊU ĐỀ: %s\n", news.citationIndex, news.title));
                sb.append(String.format("    Nguồn báo: %s | Ngày đăng: %s\n", news.sourceName != null ? news.sourceName : "Kinh tế", news.publishedAt));
                if (news.sentiment != null && !news.sentiment.isBlank()) {
                    sb.append(String.format("    Sắc thái thị trường: %s (%s)\n", news.sentiment, news.sentimentReason != null ? news.sentimentReason : ""));
                }
                if (news.relatedTickers != null && !news.relatedTickers.isBlank()) {
                    sb.append(String.format("    Mã cổ phiếu liên quan: %s\n", news.relatedTickers));
                }
                if (news.bulletPoints != null && !news.bulletPoints.isBlank()) {
                    sb.append(String.format("    Tóm tắt ý chính: %s\n", news.bulletPoints.replace("\n", " ; ")));
                } else if (news.snippet != null && !news.snippet.isBlank()) {
                    sb.append(String.format("    Nội dung tóm lược: %s\n", news.snippet));
                }
                sb.append(String.format("    URL gốc: %s\n", news.originalUrl != null ? news.originalUrl : ""));
            }
        }
        sb.append("</untrusted_external_news>");
        return sb.toString();
    }

    /**
     * Xuất toàn bộ ngữ cảnh tổng hợp chuẩn bị đưa vào Gemini Assistant Prompt.
     */
    public String toFullPromptContext() {
        return toInternalFinancialContextString() + "\n" + toUntrustedExternalNewsString();
    }
}

