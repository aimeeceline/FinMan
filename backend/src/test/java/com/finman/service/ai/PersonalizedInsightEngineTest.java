package com.finman.service.ai;

import com.finman.dto.request.MacroImpactRequest;
import com.finman.dto.response.AiMessageResponse;
import com.finman.dto.response.MacroImpactEvaluationResponse;
import com.finman.dto.response.PersonalizedInsightItem;
import com.finman.dto.response.PersonalizedInsightResponse;
import com.finman.entity.Account;
import com.finman.entity.AiConversation;
import com.finman.entity.Budget;
import com.finman.entity.Category;
import com.finman.entity.Transaction;
import com.finman.entity.User;
import com.finman.entity.enums.AccountType;
import com.finman.entity.enums.CategoryType;
import com.finman.entity.enums.TransactionType;
import com.finman.repository.AccountRepository;
import com.finman.repository.AiConversationRepository;
import com.finman.repository.AiMessageRepository;
import com.finman.repository.BudgetRepository;
import com.finman.repository.CategoryRepository;
import com.finman.repository.TransactionRepository;
import com.finman.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class PersonalizedInsightEngineTest {

    @Autowired
    private PersonalizedInsightEngine insightEngine;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private AiConversationRepository conversationRepository;

    @Autowired
    private AiMessageRepository messageRepository;

    private User testUser;
    private Account bankAccount;
    private Account cashAccount;
    private Category foodCategory;

    @BeforeEach
    void setUp() {
        String unique = UUID.randomUUID().toString().substring(0, 8);
        testUser = userRepository.save(new User(
                "insight_user_" + unique + "@finman.test",
                "hashedpassword",
                "Nguyen Insight " + unique
        ));

        // Tài khoản Ngân hàng có 100.000.000 đ
        bankAccount = accountRepository.save(new Account(
                testUser,
                "Vietcombank Tiết kiệm",
                AccountType.BANK,
                100_000_000L
        ));

        // Tài khoản Tiền mặt có 10.000.000 đ
        cashAccount = accountRepository.save(new Account(
                testUser,
                "Ví Tiền mặt",
                AccountType.CASH,
                10_000_000L
        ));

        // Danh mục Ăn uống
        foodCategory = categoryRepository.save(new Category(
                testUser,
                "Ăn uống & Sinh hoạt",
                CategoryType.EXPENSE,
                "restaurant",
                true
        ));

        // Ngân sách tháng 15.000.000 đ
        String currentMonth = YearMonth.now().toString();
        budgetRepository.save(new Budget(
                testUser,
                foodCategory,
                currentMonth,
                15_000_000L
        ));

        // Giao dịch chi tiêu 5.000.000 đ
        transactionRepository.save(new Transaction(
                testUser,
                bankAccount,
                foodCategory,
                TransactionType.EXPENSE,
                5_000_000L,
                LocalDate.now(),
                "Đi siêu thị mua thực phẩm tháng"
        ));
    }

    @Test
    @DisplayName("Kiểm tra tính toán số học định lượng: Lãi suất, lạm phát và số tháng dự phòng")
    void testMathematicalBaselineCalculations() {
        // 1. Biến động lãi suất: 100.000.000 đ tại +1.0%/năm
        long annualDelta = insightEngine.calculateDepositAnnualYieldDelta(100_000_000L, 1.0);
        long monthlyDelta = insightEngine.calculateDepositMonthlyYieldDelta(100_000_000L, 1.0);
        assertEquals(1_000_000L, annualDelta, "100.000.000 * 1% phải bằng 1.000.000 đ/năm");
        assertEquals(83_333L, monthlyDelta, "1.000.000 / 12 làm tròn phải bằng 83.333 đ/tháng");

        // 2. Tác động lạm phát: Chi tiêu 20.000.000 đ/tháng tăng 5%
        long inflationDelta = insightEngine.calculateMonthlyInflationExpenseDelta(20_000_000L, 5.0);
        assertEquals(1_000_000L, inflationDelta, "20.000.000 * 5% phải bằng 1.000.000 đ/tháng");

        // 3. Số tháng dự phòng khẩn cấp
        // Thanh khoản 110.000.000 đ, chi tiêu 20.000.000 đ -> 5.5 tháng (AN TOÀN)
        double runwaySafe = insightEngine.calculateEmergencyRunwayMonths(110_000_000L, 20_000_000L);
        assertEquals(5.5, runwaySafe, 0.1);
        assertEquals("AN TOÀN", insightEngine.assessEmergencyRunway(runwaySafe));

        // Thanh khoản 20.000.000 đ, chi tiêu 15.000.000 đ -> 1.3 tháng (CẦN TĂNG DỰ PHÒNG)
        double runwayLow = insightEngine.calculateEmergencyRunwayMonths(20_000_000L, 15_000_000L);
        assertEquals("CẦN TĂNG DỰ PHÒNG", insightEngine.assessEmergencyRunway(runwayLow));

        // Thanh khoản 200.000.000 đ, chi tiêu 15.000.000 đ -> 13.3 tháng (THỪA THANH KHOẢN)
        double runwayHigh = insightEngine.calculateEmergencyRunwayMonths(200_000_000L, 15_000_000L);
        assertEquals("THỪA THANH KHOẢN", insightEngine.assessEmergencyRunway(runwayHigh));
    }

    @Test
    @DisplayName("Kiểm tra tổng hợp nhận định cá nhân hóa đa chiều cho người dùng thực tế")
    void testGeneratePersonalizedInsightsFallbackWithRealUser() {
        PersonalizedInsightResponse response = insightEngine.generatePersonalizedInsights(testUser.getId(), "lãi suất tiết kiệm");

        assertNotNull(response);
        assertNotNull(response.getSummary(), "Summary không được null");
        assertFalse(response.getSummary().isBlank());

        assertEquals(110_000_000L, response.getLiquidAssetsVnd(), "Tài sản thanh khoản phải là 100M + 10M = 110M");
        assertNotNull(response.getCashRunwayMonths(), "Số tháng dự phòng không được null");
        assertTrue(response.getCashRunwayMonths() > 0.0);
        assertNotNull(response.getRunwayAssessment());
        assertNotNull(response.getDisclaimer());
        assertTrue(response.getDisclaimer().contains("tham khảo"));

        assertNotNull(response.getInsights());
        assertFalse(response.getInsights().isEmpty(), "Danh sách nhận định không được rỗng");
        assertTrue(response.getInsights().size() >= 3, "Phải có tối thiểu 3 nhóm nhận định");

        // Tìm nhận định về lãi suất
        PersonalizedInsightItem interestInsight = response.getInsights().stream()
                .filter(i -> i.getTopic() != null && i.getTopic().contains("LÃI SUẤT"))
                .findFirst()
                .orElse(null);
        assertNotNull(interestInsight, "Phải có nhận định về lãi suất tiết kiệm");
        assertEquals("POSITIVE", interestInsight.getImpactType());
        assertTrue(interestInsight.getPersonalSituation().contains("ngân hàng"));
        assertTrue(interestInsight.getQuantitativeCalculation().contains("₫"));
        assertEquals(1_000_000L, interestInsight.getEstimatedFinancialImpactVnd());
    }

    @Test
    @DisplayName("Kiểm tra mô phỏng kịch bản giả định biến động vĩ mô: Lãi suất tăng")
    void testEvaluateMacroImpactInterestRateScenario() {
        MacroImpactRequest request = new MacroImpactRequest("Lãi suất tiền gửi tiết kiệm", 1.5);
        MacroImpactEvaluationResponse response = insightEngine.evaluateMacroImpact(testUser.getId(), request);

        assertNotNull(response);
        assertEquals("Lãi suất tiền gửi tiết kiệm", response.getMacroTopic());
        assertEquals(1.5, response.getEstimatedChangePct());
        assertEquals(100_000_000L, response.getAffectedBalanceVnd(), "Số dư chịu tác động là số dư ngân hàng (100M)");

        // 100.000.000 * 1.5% = 1.500.000 đ/năm, monthly = 125.000 đ
        assertEquals(1_500_000L, response.getAnnualImpactVnd());
        assertEquals(125_000L, response.getMonthlyImpactVnd());
        assertNotNull(response.getCalculationFormula());
        assertTrue(response.getCalculationFormula().contains("100.000.000 ₫"));
        assertNotNull(response.getRecommendation());
        assertNotNull(response.getDisclaimer());
    }

    @Test
    @DisplayName("Kiểm tra mô phỏng kịch bản giả định biến động vĩ mô: Giá xăng dầu tăng")
    void testEvaluateMacroImpactFuelScenario() {
        MacroImpactRequest request = new MacroImpactRequest("Giá xăng dầu", 8.0);
        MacroImpactEvaluationResponse response = insightEngine.evaluateMacroImpact(testUser.getId(), request);

        assertNotNull(response);
        assertEquals(8.0, response.getEstimatedChangePct());
        assertNotNull(response.getMonthlyImpactVnd());
        assertTrue(response.getMonthlyImpactVnd() >= 0L);
        assertEquals(response.getMonthlyImpactVnd() * 12, response.getAnnualImpactVnd());
        assertTrue(response.getImpactDescription().contains("xăng"));
    }

    @Test
    @DisplayName("Kiểm tra đàm thoại trợ lý v2: Lưu vết phiên hội thoại, tin nhắn và citations")
    void testAskPersonalizedAssistantEndToEndConversationAndCitations() {
        String userQuery = "Lãi suất tiền gửi có xu hướng tăng, tôi nên xử lý thế nào?";
        AiMessageResponse response = insightEngine.askPersonalizedAssistant(testUser.getId(), null, userQuery);

        assertNotNull(response);
        assertEquals("ASSISTANT", response.getRole());
        assertNotNull(response.getContent());
        assertFalse(response.getContent().isBlank());
        assertNotNull(response.getConversationId(), "Phải tự tạo và trả về conversationId");

        // Kiểm tra trong CSDL
        AiConversation conversation = conversationRepository.findById(response.getConversationId()).orElse(null);
        assertNotNull(conversation);
        assertEquals(testUser.getId(), conversation.getUser().getId());

        long msgCount = messageRepository.countByConversationId(conversation.getId());
        assertEquals(2, msgCount, "Phải lưu đúng 2 tin nhắn: 1 USER và 1 ASSISTANT");
    }

    @Test
    @DisplayName("Bảo mật Multi-tenant: User B không bao giờ thấy số dư hoặc nhận định của User A")
    void testMultiTenantIsolationForPersonalizedInsights() {
        String uniqueB = UUID.randomUUID().toString().substring(0, 8);
        User userB = userRepository.save(new User(
                "isolated_b_" + uniqueB + "@finman.test",
                "hashedpassword",
                "User B " + uniqueB
        ));

        PersonalizedInsightResponse responseB = insightEngine.generatePersonalizedInsights(userB.getId(), null);

        assertNotNull(responseB);
        assertEquals(0L, responseB.getLiquidAssetsVnd(), "User B chưa có tài khoản, thanh khoản phải là 0 đ");
        assertEquals(0L, responseB.getNetWorthVnd(), "User B chưa có tài sản, Net worth phải là 0 đ");
    }
}

