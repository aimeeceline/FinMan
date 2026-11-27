package com.finman.service.ai;

import com.finman.dto.response.HybridFinancialContext;
import com.finman.entity.Account;
import com.finman.entity.Budget;
import com.finman.entity.Category;
import com.finman.entity.NewsArticle;
import com.finman.entity.NewsCategory;
import com.finman.entity.NewsSource;
import com.finman.entity.NewsSummary;
import com.finman.entity.Transaction;
import com.finman.entity.User;
import com.finman.entity.enums.AccountType;
import com.finman.entity.enums.CategoryType;
import com.finman.entity.enums.TransactionType;
import com.finman.repository.AccountRepository;
import com.finman.repository.BudgetRepository;
import com.finman.repository.CategoryRepository;
import com.finman.repository.NewsArticleRepository;
import com.finman.repository.NewsCategoryRepository;
import com.finman.repository.NewsSourceRepository;
import com.finman.repository.NewsSummaryRepository;
import com.finman.repository.TransactionRepository;
import com.finman.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class HybridContextBuilderTest {

    @Autowired
    private HybridContextBuilder hybridContextBuilder;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private NewsSourceRepository newsSourceRepository;

    @Autowired
    private NewsCategoryRepository newsCategoryRepository;

    @Autowired
    private NewsArticleRepository newsArticleRepository;

    @Autowired
    private NewsSummaryRepository newsSummaryRepository;

    private User createTestUser(String email, String fullName) {
        User user = new User(email, "hashed_password", fullName);
        return userRepository.save(user);
    }

    @Test
    @DisplayName("Kiểm tra trích xuất ngữ cảnh kết hợp: 5 loại ví, ngân sách tháng, top chi tiêu và tin tức thị trường")
    void testBuildContextWithUserFinancialDataAndNews() {
        LocalDate testDate = LocalDate.of(2026, 11, 17);
        User user = createTestUser("hybrid_user1@finman.com", "Lê Văn Tài Chính");

        // 1. Tạo 5 loại tài khoản mục đích
        Account cash = accountRepository.save(new Account(user, "Ví tiền mặt", AccountType.CASH, 5_000_000L));
        Account bank = accountRepository.save(new Account(user, "Vietcombank", AccountType.BANK, 25_000_000L));
        Account credit = accountRepository.save(new Account(user, "Thẻ Visa Platinum", AccountType.CREDIT_CARD, -2_000_000L));
        Account invest = accountRepository.save(new Account(user, "Tài khoản TCBS", AccountType.INVESTMENT, 100_000_000L));
        Account other = accountRepository.save(new Account(user, "Ví VNPAY", AccountType.OTHER, 10_000_000L));

        // 2. Tạo danh mục và ngân sách
        Category foodCat = categoryRepository.save(new Category(user, "Ăn uống", CategoryType.EXPENSE, "utensils", false));
        Category shopCat = categoryRepository.save(new Category(user, "Mua sắm", CategoryType.EXPENSE, "shopping-bag", false));

        Budget foodBudget = budgetRepository.save(new Budget(user, foodCat, "2026-11", 6_000_000L));

        // 3. Tạo các giao dịch chi tiêu trong tháng (type trước amount)
        Transaction t1 = new Transaction(user, bank, foodCat, TransactionType.EXPENSE, 1_500_000L,
                LocalDate.of(2026, 11, 5), "Ăn nhà hàng cuối tuần");
        Transaction t2 = new Transaction(user, credit, shopCat, TransactionType.EXPENSE, 3_000_000L,
                LocalDate.of(2026, 11, 10), "Mua quần áo mùa đông");
        Transaction t3 = new Transaction(user, cash, foodCat, TransactionType.EXPENSE, 500_000L,
                LocalDate.of(2026, 11, 12), "Đi chợ siêu thị");

        transactionRepository.saveAll(List.of(t1, t2, t3));

        // 4. Tạo tin tức thị trường và tóm tắt AI
        NewsSource source = newsSourceRepository.save(new NewsSource("VNE_TEST", "VnExpress", "https://vnexpress.net", null, true));
        NewsCategory nCat = newsCategoryRepository.save(new NewsCategory("MACRO_TEST", "Kinh tế vĩ mô", "Vĩ mô", 1));

        NewsArticle article1 = new NewsArticle();
        article1.setSource(source);
        article1.setCategory(nCat);
        article1.setTitle("Ngân hàng Nhà nước giữ nguyên mặt bằng lãi suất điều hành");
        article1.setDescription("Mặt bằng lãi suất huy động và cho vay tiếp tục ổn định hỗ trợ tăng trưởng kinh tế.");
        article1.setOriginalUrl("https://vnexpress.net/lai-suat-ngan-hang-2026");
        article1.setTitleHash("hash_lai_suat_2026");
        article1.setPublishedAt(Instant.now());
        article1.setIsAiProcessed(true);
        article1 = newsArticleRepository.save(article1);

        NewsSummary summary1 = new NewsSummary(
                article1,
                "- Lãi suất điều hành giữ nguyên ở mức hỗ trợ.\n- Thanh khoản hệ thống ngân hàng dồi dào.\n- Lãi suất cho vay duy trì mức thấp.",
                "POSITIVE",
                "Chính sách tiền tệ nhất quán và hỗ trợ tăng trưởng",
                "Thúc đẩy đầu tư sản xuất kinh doanh",
                "VCB,BID,CTG",
                "Lãi suất,Ngân hàng,Vĩ mô",
                "gemini-2.5-flash"
        );
        newsSummaryRepository.save(summary1);

        // 5. Thực thi gom ngữ cảnh kết hợp (Hybrid Context Retrieval)
        HybridFinancialContext context = hybridContextBuilder.buildContext(user.getId(), "lãi suất ngân hàng", testDate);

        // 6. Kiểm tra số liệu nội bộ (Internal Context)
        assertThat(context.getUserId()).isEqualTo(user.getId());
        assertThat(context.getAsOfDate()).isEqualTo(testDate);
        assertThat(context.getCurrentMonth()).isEqualTo("2026-11");

        // Kiểm tra 5 loại tài khoản mục đích
        assertThat(context.getAccountContext().getTotalBalance()).isEqualTo(138_000_000L);
        assertThat(context.getAccountContext().getCashBalance()).isEqualTo(5_000_000L);
        assertThat(context.getAccountContext().getBankBalance()).isEqualTo(25_000_000L);
        assertThat(context.getAccountContext().getCreditCardBalance()).isEqualTo(-2_000_000L);
        assertThat(context.getAccountContext().getInvestmentBalance()).isEqualTo(100_000_000L);
        assertThat(context.getAccountContext().getOtherBalance()).isEqualTo(10_000_000L);
        assertThat(context.getAccountContext().getAccounts()).hasSize(5);

        // Kiểm tra ngân sách tháng
        assertThat(context.getBudgetContext().getTotalBudget()).isEqualTo(6_000_000L);
        assertThat(context.getBudgetContext().getTotalSpent()).isEqualTo(2_000_000L); // 1.5M + 0.5M cho Food
        assertThat(context.getBudgetContext().getRemaining()).isEqualTo(4_000_000L);
        assertThat(context.getBudgetContext().getPercentUsed()).isCloseTo(33.33, org.assertj.core.data.Offset.offset(0.1));

        // Kiểm tra Top 3 khoản chi lớn nhất trong tháng
        assertThat(context.getTopExpenses()).hasSize(3);
        assertThat(context.getTopExpenses().get(0).getAmount()).isEqualTo(3_000_000L); // Shopping
        assertThat(context.getTopExpenses().get(0).getCategoryName()).isEqualTo("Mua sắm");
        assertThat(context.getTopExpenses().get(1).getAmount()).isEqualTo(1_500_000L); // Food
        assertThat(context.getTopExpenses().get(2).getAmount()).isEqualTo(500_000L);   // Food

        // Kiểm tra tin tức ngoại vi liên quan
        assertThat(context.getRelevantNews()).isNotEmpty();
        var topNews = context.getRelevantNews().get(0);
        assertThat(topNews.getCitationIndex()).isEqualTo(1);
        assertThat(topNews.getTitle()).contains("lãi suất");
        assertThat(topNews.getSentiment()).isEqualTo("POSITIVE");
        assertThat(topNews.getRelatedTickers()).contains("VCB");

        // Kiểm tra chuỗi định dạng Prompt chuẩn bị cho Gemini Assistant
        String promptString = context.toFullPromptContext();
        assertThat(promptString).contains("=== THÔNG TIN TÀI CHÍNH NỘI BỘ CỦA BẠN");
        assertThat(promptString).contains("138.000.000 ₫");
        assertThat(promptString).contains("6.000.000 ₫");
        assertThat(promptString).contains("3.000.000 ₫");
        assertThat(promptString).contains("<untrusted_external_news>");
        assertThat(promptString).contains("</untrusted_external_news>");
        assertThat(promptString).contains("[1] TIÊU ĐỀ: Ngân hàng Nhà nước");
    }

    @Test
    @DisplayName("Kiểm tra phân quyền nghiêm ngặt cô lập dữ liệu người dùng (Multi-tenant Security)")
    void testMultiTenantStrictIsolation() {
        LocalDate testDate = LocalDate.of(2026, 11, 17);
        User userA = createTestUser("isolation_a@finman.com", "Người Dùng A");
        User userB = createTestUser("isolation_b@finman.com", "Người Dùng B");

        // Dữ liệu User A
        accountRepository.save(new Account(userA, "Ví User A", AccountType.CASH, 10_000_000L));
        Category catA = categoryRepository.save(new Category(userA, "Chi phí A", CategoryType.EXPENSE, "tag", false));
        budgetRepository.save(new Budget(userA, catA, "2026-11", 5_000_000L));

        // Dữ liệu User B
        accountRepository.save(new Account(userB, "Ví User B", AccountType.BANK, 999_000_000L));
        Category catB = categoryRepository.save(new Category(userB, "Chi phí B", CategoryType.EXPENSE, "tag", false));
        budgetRepository.save(new Budget(userB, catB, "2026-11", 500_000_000L));

        // Gom ngữ cảnh cho User A
        HybridFinancialContext ctxA = hybridContextBuilder.buildContext(userA.getId(), "số dư", testDate);
        assertThat(ctxA.getAccountContext().getTotalBalance()).isEqualTo(10_000_000L);
        assertThat(ctxA.getBudgetContext().getTotalBudget()).isEqualTo(5_000_000L);
        assertThat(ctxA.toInternalFinancialContextString()).doesNotContain("999.000.000");
        assertThat(ctxA.toInternalFinancialContextString()).doesNotContain("Ví User B");

        // Gom ngữ cảnh cho User B
        HybridFinancialContext ctxB = hybridContextBuilder.buildContext(userB.getId(), "số dư", testDate);
        assertThat(ctxB.getAccountContext().getTotalBalance()).isEqualTo(999_000_000L);
        assertThat(ctxB.getBudgetContext().getTotalBudget()).isEqualTo(500_000_000L);
        assertThat(ctxB.toInternalFinancialContextString()).doesNotContain("10.000.000");
        assertThat(ctxB.toInternalFinancialContextString()).doesNotContain("Ví User A");
    }

    @Test
    @DisplayName("Kiểm tra cơ chế fallback an toàn khi người dùng mới chưa có dữ liệu và không có từ khóa tìm kiếm")
    void testFallbackWhenUserHasNoDataAndNoSearchKeyword() {
        User emptyUser = createTestUser("empty_user@finman.com", "Người Dùng Mới");

        HybridFinancialContext ctx = hybridContextBuilder.buildContext(emptyUser.getId(), null);

        assertThat(ctx.getAccountContext().getTotalBalance()).isEqualTo(0L);
        assertThat(ctx.getBudgetContext().getTotalBudget()).isEqualTo(0L);
        assertThat(ctx.getTopExpenses()).isEmpty();

        String contextStr = ctx.toInternalFinancialContextString();
        assertThat(contextStr).contains("Tổng tài sản thực tế: 0 ₫");
        assertThat(contextStr).contains("Tháng này bạn chưa thiết lập hạn mức ngân sách.");
        assertThat(contextStr).contains("Chưa ghi nhận khoản chi tiêu nào trong tháng này.");
    }
}
