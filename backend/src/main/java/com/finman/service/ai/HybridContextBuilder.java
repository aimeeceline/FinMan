package com.finman.service.ai;

import com.finman.dto.response.HybridFinancialContext;
import com.finman.dto.response.HybridFinancialContext.AccountContext;
import com.finman.dto.response.HybridFinancialContext.AccountItem;
import com.finman.dto.response.HybridFinancialContext.BudgetContext;
import com.finman.dto.response.HybridFinancialContext.CategoryBudgetItem;
import com.finman.dto.response.HybridFinancialContext.RetrievedNewsItem;
import com.finman.dto.response.HybridFinancialContext.TopExpenseItem;
import com.finman.entity.Account;
import com.finman.entity.Budget;
import com.finman.entity.NewsArticle;
import com.finman.entity.NewsSummary;
import com.finman.entity.Transaction;
import com.finman.entity.enums.AccountType;
import com.finman.entity.enums.TransactionType;
import com.finman.repository.AccountRepository;
import com.finman.repository.BudgetRepository;
import com.finman.repository.NewsArticleRepository;
import com.finman.repository.NewsSummaryRepository;
import com.finman.repository.TransactionRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Engine gom ngữ cảnh đa nguồn (Hybrid Context Retrieval Engine) cho AI Assistant.
 * 1. Ngữ cảnh Nội bộ: Số dư 5 loại tài khoản mục đích, ngân sách tháng, top chi tiêu (cô lập 100% theo currentUserId).
 * 2. Ngữ cảnh Ngoại vi: Top 3 bài báo liên quan nhất từ PostgreSQL Full-Text Search (kèm fallback tokenized search).
 * 3. Hiệu năng cao: hoàn tất trong < 50ms.
 */
@Service
public class HybridContextBuilder {

    private static final Logger log = LoggerFactory.getLogger(HybridContextBuilder.class);
    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");
    private static final int DEFAULT_TOP_EXPENSES_LIMIT = 3;
    private static final int DEFAULT_TOP_NEWS_LIMIT = 3;

    private final AccountRepository accountRepository;
    private final BudgetRepository budgetRepository;
    private final TransactionRepository transactionRepository;
    private final NewsArticleRepository newsArticleRepository;
    private final NewsSummaryRepository newsSummaryRepository;
    private final EntityManager entityManager;

    public HybridContextBuilder(AccountRepository accountRepository,
                                BudgetRepository budgetRepository,
                                TransactionRepository transactionRepository,
                                NewsArticleRepository newsArticleRepository,
                                NewsSummaryRepository newsSummaryRepository,
                                EntityManager entityManager) {
        this.accountRepository = accountRepository;
        this.budgetRepository = budgetRepository;
        this.transactionRepository = transactionRepository;
        this.newsArticleRepository = newsArticleRepository;
        this.newsSummaryRepository = newsSummaryRepository;
        this.entityManager = entityManager;
    }

    /**
     * Gom ngữ cảnh kết hợp cho người dùng theo ngày hiện tại của hệ thống.
     *
     * @param userId ID người dùng đang xác thực (bắt buộc)
     * @param userQuery Câu hỏi / từ khóa truy vấn của người dùng
     * @return Ngữ cảnh kết hợp hoàn chỉnh
     */
    @Transactional(readOnly = true)
    public HybridFinancialContext buildContext(Long userId, String userQuery) {
        return buildContext(userId, userQuery, LocalDate.now());
    }

    /**
     * Alias method cho buildContext để phục vụ PersonalizedInsightEngine.
     */
    @Transactional(readOnly = true)
    public HybridFinancialContext buildHybridContext(Long userId, String userQuery) {
        return buildContext(userId, userQuery, LocalDate.now());
    }

    /**
     * Gom ngữ cảnh kết hợp cho người dùng với ngày tham chiếu cụ thể (hỗ trợ kiểm thử và giả lập).
     */
    @Transactional(readOnly = true)
    public HybridFinancialContext buildContext(Long userId, String userQuery, LocalDate referenceDate) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID không được để trống khi xây dựng ngữ cảnh tài chính");
        }

        long startTime = System.currentTimeMillis();
        LocalDate asOfDate = referenceDate != null ? referenceDate : LocalDate.now();
        YearMonth currentYearMonth = YearMonth.from(asOfDate);
        String currentMonthStr = currentYearMonth.format(MONTH_FORMATTER);

        HybridFinancialContext context = new HybridFinancialContext();
        context.setUserId(userId);
        context.setAsOfDate(asOfDate);
        context.setCurrentMonth(currentMonthStr);

        // 1. Dữ liệu Nội bộ: Số dư 5 loại tài khoản mục đích
        AccountContext accountCtx = buildAccountContext(userId);
        context.setAccountContext(accountCtx);

        // 2. Dữ liệu Nội bộ: Tình hình ngân sách tháng
        BudgetContext budgetCtx = buildBudgetContext(userId, currentYearMonth);
        context.setBudgetContext(budgetCtx);

        // 3. Dữ liệu Nội bộ: Top khoản chi lớn nhất trong tháng
        List<TopExpenseItem> topExpenses = buildTopExpenses(userId, currentYearMonth, DEFAULT_TOP_EXPENSES_LIMIT);
        context.setTopExpenses(topExpenses);

        // 4. Dữ liệu Ngoại vi: Top bài báo tài chính liên quan nhất (có dẫn nguồn)
        List<RetrievedNewsItem> relevantNews = retrieveTopNews(userQuery, DEFAULT_TOP_NEWS_LIMIT);
        context.setRelevantNews(relevantNews);

        long duration = System.currentTimeMillis() - startTime;
        context.setRetrievalDurationMs(duration);

        log.debug("Built Hybrid Context for userId={} in {} ms (Accounts={}, Budgets={}, TopExpenses={}, News={})",
                userId, duration, accountCtx.getAccounts().size(), budgetCtx.getCategoryBudgets().size(),
                topExpenses.size(), relevantNews.size());

        return context;
    }

    /**
     * Trích xuất số dư 5 loại tài khoản mục đích (CASH, BANK, CREDIT_CARD, INVESTMENT, OTHER) của user.
     */
    public AccountContext buildAccountContext(Long userId) {
        List<Account> accounts = accountRepository.findByUserIdAndIsArchivedFalseAndDeletedAtIsNull(userId);
        AccountContext ctx = new AccountContext();

        long cash = 0L;
        long bank = 0L;
        long credit = 0L;
        long invest = 0L;
        long other = 0L;
        long total = 0L;

        List<AccountItem> items = new ArrayList<>();
        for (Account a : accounts) {
            long bal = a.getCurrentBalance() != null ? a.getCurrentBalance() : 0L;
            total += bal;
            AccountType type = a.getType() != null ? a.getType() : AccountType.OTHER;

            switch (type) {
                case CASH -> cash += bal;
                case BANK -> bank += bal;
                case CREDIT_CARD -> credit += bal;
                case INVESTMENT -> invest += bal;
                case OTHER -> other += bal;
            }

            items.add(new AccountItem(a.getId(), a.getName(), type, bal, a.getAccountNumber()));
        }

        ctx.setTotalBalance(total);
        ctx.setCashBalance(cash);
        ctx.setBankBalance(bank);
        ctx.setCreditCardBalance(credit);
        ctx.setInvestmentBalance(invest);
        ctx.setOtherBalance(other);
        ctx.setAccounts(items);

        return ctx;
    }

    /**
     * Trích xuất tình hình ngân sách tháng và tiến độ chi tiêu theo từng danh mục.
     */
    public BudgetContext buildBudgetContext(Long userId, YearMonth yearMonth) {
        String monthStr = yearMonth.format(MONTH_FORMATTER);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        List<Budget> budgets = budgetRepository.findByUserIdAndMonthWithCategory(userId, monthStr);
        BudgetContext ctx = new BudgetContext();
        ctx.setMonth(monthStr);

        long totalBudget = 0L;
        long totalSpent = 0L;
        List<CategoryBudgetItem> items = new ArrayList<>();

        for (Budget b : budgets) {
            long bAmount = b.getAmount() != null ? b.getAmount() : 0L;
            totalBudget += bAmount;

            Long spentLong = null;
            if (b.getCategory() != null && b.getCategory().getId() != null) {
                spentLong = transactionRepository.sumAmountByUserIdAndCategoryIdAndDateBetween(
                        userId, b.getCategory().getId(), TransactionType.EXPENSE, startDate, endDate);
            }
            long spent = spentLong != null ? spentLong : 0L;
            totalSpent += spent;

            String catName = (b.getCategory() != null && b.getCategory().getName() != null)
                    ? b.getCategory().getName() : "Danh mục #" + (b.getCategory() != null ? b.getCategory().getId() : 0);

            items.add(new CategoryBudgetItem(
                    b.getCategory() != null ? b.getCategory().getId() : null,
                    catName,
                    bAmount,
                    spent
            ));
        }

        ctx.setTotalBudget(totalBudget);
        ctx.setTotalSpent(totalSpent);
        ctx.setRemaining(totalBudget - totalSpent);
        ctx.setPercentUsed(totalBudget > 0 ? ((double) totalSpent / totalBudget) * 100.0 : 0.0);
        ctx.setCategoryBudgets(items);

        return ctx;
    }

    /**
     * Trích xuất Top N khoản chi lớn nhất trong tháng của người dùng.
     */
    public List<TopExpenseItem> buildTopExpenses(Long userId, YearMonth yearMonth, int limit) {
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        List<Transaction> transactions = transactionRepository.findTopTransactionsByType(
                userId,
                TransactionType.EXPENSE,
                startDate,
                endDate,
                PageRequest.of(0, Math.max(1, limit))
        );

        List<TopExpenseItem> items = new ArrayList<>();
        for (Transaction t : transactions) {
            String catName = (t.getCategory() != null && t.getCategory().getName() != null)
                    ? t.getCategory().getName() : "Không phân loại";
            String accName = (t.getAccount() != null && t.getAccount().getName() != null)
                    ? t.getAccount().getName() : "Ví";

            items.add(new TopExpenseItem(
                    t.getId(),
                    t.getAmount() != null ? t.getAmount() : 0L,
                    t.getTransactionDate(),
                    catName,
                    accName,
                    t.getNote()
            ));
        }

        return items;
    }

    /**
     * Tìm kiếm Top N bài báo thị trường liên quan nhất.
     * Thứ tự ưu tiên:
     * 1. PostgreSQL Full-Text Search (nếu truy vấn có từ khóa và DB hỗ trợ to_tsvector).
     * 2. JPA Specification tokenized search (fallback tương thích cho H2/PostgreSQL).
     * 3. Tin tức mới nhất đã xuất bản (nếu không có từ khóa hoặc kết quả tìm kiếm rỗng).
     */
    public List<RetrievedNewsItem> retrieveTopNews(String userQuery, int limit) {
        int safeLimit = Math.max(1, limit);
        List<NewsArticle> articles = Collections.emptyList();
        String cleanedQuery = extractSearchKeywords(userQuery);

        // 1. Thử gọi PostgreSQL Full-Text Search nếu có từ khóa
        if (!cleanedQuery.isBlank()) {
            articles = executePostgresFts(cleanedQuery, safeLimit);
        }

        // 2. Fallback sang Specification tokenized LIKE nếu FTS không trả kết quả
        if (articles.isEmpty() && !cleanedQuery.isBlank()) {
            articles = executeSpecificationSearch(cleanedQuery, safeLimit);
        }

        // 3. Fallback sang tin tức mới nhất nếu vẫn rỗng hoặc không có từ khóa truy vấn
        if (articles.isEmpty()) {
            articles = newsArticleRepository.findAll(
                    PageRequest.of(0, safeLimit, Sort.by(Sort.Direction.DESC, "publishedAt"))
            ).getContent();
        }

        if (articles.isEmpty()) {
            return Collections.emptyList();
        }

        // 4. Nạp tóm tắt AI (NewsSummary) cho các bài báo đã tìm thấy
        List<Long> articleIds = articles.stream().map(NewsArticle::getId).toList();
        Map<Long, NewsSummary> summaryMap = new HashMap<>();
        if (!articleIds.isEmpty()) {
            for (NewsSummary s : newsSummaryRepository.findByArticleIdIn(articleIds)) {
                if (s.getArticle() != null && s.getArticle().getId() != null) {
                    summaryMap.put(s.getArticle().getId(), s);
                }
            }
        }

        // 5. Ánh xạ sang RetrievedNewsItem kèm chỉ số trích dẫn [1], [2], [3]
        List<RetrievedNewsItem> result = new ArrayList<>();
        int citationIndex = 1;
        for (NewsArticle a : articles) {
            NewsSummary s = summaryMap.get(a.getId());
            String publishedStr = a.getPublishedAt() != null ? a.getPublishedAt().toString() : "Vừa cập nhật";
            String sourceName = (a.getSource() != null && a.getSource().getName() != null)
                    ? a.getSource().getName() : "Tin tài chính";

            result.add(new RetrievedNewsItem(
                    citationIndex++,
                    a.getId(),
                    a.getTitle(),
                    sourceName,
                    a.getOriginalUrl(),
                    publishedStr,
                    a.getDescription() != null ? a.getDescription() : a.getContentSnippet(),
                    s != null ? s.getSentiment() : null,
                    s != null ? s.getSentimentReason() : null,
                    s != null ? s.getBulletPoints() : null,
                    s != null ? s.getRelatedTickers() : null
            ));
        }

        return result;
    }

    /**
     * Thực thi PostgreSQL Full-Text Search thông qua Native Query.
     * Tự động bắt lỗi nếu chạy trên dialect không hỗ trợ to_tsvector (như H2 trong test suite).
     */
    @SuppressWarnings("unchecked")
    private List<NewsArticle> executePostgresFts(String queryStr, int limit) {
        try {
            String sql = "SELECT * FROM news_articles " +
                    "WHERE to_tsvector('simple', title || ' ' || COALESCE(description, '')) @@ plainto_tsquery('simple', :query) " +
                    "ORDER BY published_at DESC LIMIT :limit";

            Query query = entityManager.createNativeQuery(sql, NewsArticle.class);
            query.setParameter("query", queryStr);
            query.setParameter("limit", limit);
            return query.getResultList();
        } catch (Exception ex) {
            log.debug("PostgreSQL FTS query skipped (fallback to Specification): {}", ex.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Tìm kiếm bằng JPA Specification (tương thích 100% mọi cơ sở dữ liệu kể cả H2 in-memory).
     */
    private List<NewsArticle> executeSpecificationSearch(String queryStr, int limit) {
        String[] tokens = queryStr.toLowerCase(Locale.ROOT).split("\\s+");
        Specification<NewsArticle> spec = (root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            for (String token : tokens) {
                if (token.isBlank()) continue;
                String pattern = "%" + token + "%";
                var titleMatch = cb.like(cb.lower(root.get("title")), pattern);
                var descMatch = cb.and(
                        cb.isNotNull(root.get("description")),
                        cb.like(cb.lower(root.get("description")), pattern)
                );
                predicates.add(cb.or(titleMatch, descMatch));
            }
            return predicates.isEmpty() ? null : cb.or(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        return newsArticleRepository.findAll(
                spec,
                PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "publishedAt"))
        ).getContent();
    }

    /**
     * Bóc tách từ khóa tìm kiếm kinh tế/tài chính từ câu hỏi tự nhiên của người dùng.
     */
    private String extractSearchKeywords(String userQuery) {
        if (userQuery == null || userQuery.isBlank()) {
            return "";
        }
        // Loại bỏ ký tự đặc biệt, chuẩn hóa khoảng trắng
        String cleaned = userQuery.replaceAll("[^\\p{L}\\p{Nd}\\s]", " ").trim();
        return cleaned.replaceAll("\\s+", " ");
    }
}

