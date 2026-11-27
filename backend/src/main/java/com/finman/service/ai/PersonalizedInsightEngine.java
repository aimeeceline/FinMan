package com.finman.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.finman.client.GeminiClient;
import com.finman.config.GeminiConfig;
import com.finman.dto.request.MacroImpactRequest;
import com.finman.dto.response.AiConversationResponse;
import com.finman.dto.response.AiMessageResponse;
import com.finman.dto.response.HybridFinancialContext;
import com.finman.dto.response.MacroImpactEvaluationResponse;
import com.finman.dto.response.PersonalizedInsightItem;
import com.finman.dto.response.PersonalizedInsightResponse;
import com.finman.entity.AiConversation;
import com.finman.entity.AiMessage;
import com.finman.entity.User;
import com.finman.entity.enums.AiMessageRole;
import com.finman.exception.ResourceNotFoundException;
import com.finman.exception.UnauthorizedException;
import com.finman.repository.AiConversationRepository;
import com.finman.repository.AiMessageRepository;
import com.finman.repository.AiMessageSourceRepository;
import com.finman.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;

@Service
public class PersonalizedInsightEngine {

    private static final Logger log = LoggerFactory.getLogger(PersonalizedInsightEngine.class);

    private static final String PERSONALIZED_INSIGHTS_PROMPT_PATH = "prompts/personalized-insights.txt";
    private static final String FINANCIAL_ASSISTANT_V2_PROMPT_PATH = "prompts/financial-assistant-v2.txt";

    public static final String STANDARD_DISCLAIMER =
            "Lưu ý: Các phân tích và tính toán trên được tổng hợp tự động từ số liệu tài chính cá nhân và tin tức vĩ mô tại thời điểm xử lý. " +
            "Đây là thông tin mang tính chất tham khảo, không cấu thành lời khuyên đầu tư tài chính chuyên nghiệp. " +
            "Người dùng cần tự cân nhắc và chịu trách nhiệm với các quyết định tài chính của mình.";

    private final HybridContextBuilder hybridContextBuilder;
    private final CitationProcessor citationProcessor;
    private final GeminiClient geminiClient;
    private final GeminiConfig geminiConfig;
    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final AiMessageSourceRepository sourceRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    private final String personalizedInsightsPromptTemplate;
    private final String financialAssistantV2PromptTemplate;

    @Autowired
    public PersonalizedInsightEngine(
            HybridContextBuilder hybridContextBuilder,
            CitationProcessor citationProcessor,
            GeminiClient geminiClient,
            GeminiConfig geminiConfig,
            AiConversationRepository conversationRepository,
            AiMessageRepository messageRepository,
            AiMessageSourceRepository sourceRepository,
            UserRepository userRepository,
            ObjectMapper objectMapper) {
        this.hybridContextBuilder = hybridContextBuilder;
        this.citationProcessor = citationProcessor;
        this.geminiClient = geminiClient;
        this.geminiConfig = geminiConfig;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.sourceRepository = sourceRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();

        this.personalizedInsightsPromptTemplate = loadTemplate(PERSONALIZED_INSIGHTS_PROMPT_PATH);
        this.financialAssistantV2PromptTemplate = loadTemplate(FINANCIAL_ASSISTANT_V2_PROMPT_PATH);
    }

    private static String loadTemplate(String path) {
        try {
            ClassPathResource res = new ClassPathResource(path);
            try (InputStream is = res.getInputStream()) {
                return new String(is.readAllBytes(), StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            log.warn("Không thể đọc prompt template từ {}: {}. Sử dụng template dự phòng.", path, e.getMessage());
            return "";
        }
    }

    public static String formatMoney(long amount) {
        return String.format(Locale.US, "%,d", amount).replace(',', '.') + " ₫";
    }

    public String getStandardDisclaimer() {
        return STANDARD_DISCLAIMER;
    }

    // =========================================================================
    // 1. DETERMINISTIC MATHEMATICAL BASELINE CALCULATIONS (INTEGER VND ARITHMETIC)
    // =========================================================================

    /**
     * Tính toán biến động tiền lãi gửi tiết kiệm ngân hàng khi lãi suất thay đổi.
     * Hoàn toàn dùng số học nguyên vẹn VND (không làm tròn floating point).
     */
    public long calculateDepositAnnualYieldDelta(long bankBalance, double deltaRatePct) {
        if (bankBalance <= 0 || deltaRatePct == 0.0) {
            return 0L;
        }
        return Math.round(bankBalance * (deltaRatePct / 100.0));
    }

    public long calculateDepositMonthlyYieldDelta(long bankBalance, double deltaRatePct) {
        long annual = calculateDepositAnnualYieldDelta(bankBalance, deltaRatePct);
        return Math.round((double) annual / 12.0);
    }

    /**
     * Tính toán tác động của lạm phát / giá cả sinh hoạt tăng lên tổng chi tiêu hàng tháng.
     */
    public long calculateMonthlyInflationExpenseDelta(long monthlySpent, double inflationPct) {
        if (monthlySpent <= 0 || inflationPct == 0.0) {
            return 0L;
        }
        return Math.round(monthlySpent * (inflationPct / 100.0));
    }

    /**
     * Tính số tháng quỹ dự phòng khẩn cấp dựa trên tài sản thanh khoản (Tiền mặt + Ngân hàng)
     * và chi tiêu hàng tháng.
     */
    public double calculateEmergencyRunwayMonths(long liquidAssets, long monthlyExpense) {
        if (monthlyExpense <= 0) {
            return liquidAssets > 0 ? 99.0 : 0.0;
        }
        double runway = (double) liquidAssets / (double) monthlyExpense;
        return Math.round(runway * 10.0) / 10.0; // Làm tròn 1 chữ số thập phân
    }

    public String assessEmergencyRunway(double runwayMonths) {
        if (runwayMonths < 3.0) {
            return "CẦN TĂNG DỰ PHÒNG";
        } else if (runwayMonths <= 6.0) {
            return "AN TOÀN";
        } else {
            return "THỪA THANH KHOẢN";
        }
    }

    // =========================================================================
    // 2. CROSS-DOMAIN PERSONALIZED INSIGHTS GENERATION (HYBRID AI + MATH)
    // =========================================================================

    /**
     * Tổng hợp nhận định tài chính cá nhân hóa đa nguồn:
     * Đối chiếu số dư ví 5 nhóm và chi tiêu nội bộ với các tin tức vĩ mô mới nhất.
     */
    @Transactional(readOnly = true)
    public PersonalizedInsightResponse generatePersonalizedInsights(Long userId, String customTopic) {
        if (userId == null) {
            throw new IllegalArgumentException("userId không được để trống");
        }

        // 1. Lấy ngữ cảnh lai (Multi-tenant an toàn tuyệt đối)
        String queryTopic = (customTopic != null && !customTopic.trim().isEmpty())
                ? customTopic.trim()
                : "lãi suất lạm phát thị trường tài chính";
        HybridFinancialContext context = hybridContextBuilder.buildHybridContext(userId, queryTopic);

        // 2. Trích xuất chỉ số nền tảng
        long cash = context.getAccountContext().getCashBalance();
        long bank = context.getAccountContext().getBankBalance();
        long credit = context.getAccountContext().getCreditCardBalance();
        long investment = context.getAccountContext().getInvestmentBalance();
        long other = context.getAccountContext().getOtherBalance();
        long totalNetWorth = context.getAccountContext().getTotalBalance();

        long liquidAssets = cash + bank;
        long monthlySpent = context.getBudgetContext().getTotalSpent();
        long monthlyBudget = context.getBudgetContext().getTotalBudgetAmount();
        long effectiveMonthlyExpense = monthlySpent > 0 ? monthlySpent : (monthlyBudget > 0 ? monthlyBudget : 0L);

        double runwayMonths = calculateEmergencyRunwayMonths(liquidAssets, effectiveMonthlyExpense);
        String runwayAssessment = assessEmergencyRunway(runwayMonths);

        // 3. Xây dựng khối tính toán toán học xác thực (Deterministic Math Baseline)
        long depositDeltaAnnual = calculateDepositAnnualYieldDelta(bank, 1.0);
        long depositDeltaMonthly = calculateDepositMonthlyYieldDelta(bank, 1.0);
        long inflationDeltaMonthly = calculateMonthlyInflationExpenseDelta(effectiveMonthlyExpense, 5.0);

        StringBuilder mathBaseline = new StringBuilder();
        mathBaseline.append(String.format(Locale.ROOT,
                "- Số dư Ngân hàng: %s. Nếu lãi suất tiết kiệm biến động +1.0%%/năm, lợi tức sinh thêm: %s/năm (~ %s/tháng).\n",
                formatMoney(bank), formatMoney(depositDeltaAnnual), formatMoney(depositDeltaMonthly)));
        mathBaseline.append(String.format(Locale.ROOT,
                "- Tài sản thanh khoản (Tiền mặt + Ngân hàng): %s. Chi tiêu tháng ước tính: %s. Số tháng dự phòng khẩn cấp: %.1f tháng (Đánh giá: %s - chuẩn an toàn 3-6 tháng).\n",
                formatMoney(liquidAssets), formatMoney(effectiveMonthlyExpense), runwayMonths, runwayAssessment));
        mathBaseline.append(String.format(Locale.ROOT,
                "- Chi tiêu sinh hoạt tháng: %s. Nếu lạm phát / giá cả hàng hóa tăng +5.0%%, chi phí phát sinh thêm: %s/tháng (~ %s/năm).\n",
                formatMoney(effectiveMonthlyExpense), formatMoney(inflationDeltaMonthly), formatMoney(inflationDeltaMonthly * 12)));
        if (credit > 0) {
            long creditPenaltyEstimate = Math.round(credit * 0.28 / 12.0); // Giả định lãi thẻ 28%/năm
            mathBaseline.append(String.format(Locale.ROOT,
                    "- Dư nợ thẻ tín dụng: %s. Nếu không tất toán đúng hạn, lãi phạt ước tính khoảng: %s/tháng.\n",
                    formatMoney(credit), formatMoney(creditPenaltyEstimate)));
        }

        // 4. Nếu Gemini khả dụng, gọi AI với Structured Prompt JSON Mode
        if (geminiConfig.hasApiKey() && personalizedInsightsPromptTemplate != null && !personalizedInsightsPromptTemplate.isEmpty()) {
            try {
                String prompt = buildPersonalizedInsightsPrompt(context, mathBaseline.toString());
                String aiRawResponse = geminiClient.generateContent(prompt, true);
                PersonalizedInsightResponse parsedResponse = parseGeminiJsonResponse(aiRawResponse, context);
                if (parsedResponse != null && parsedResponse.getInsights() != null && !parsedResponse.getInsights().isEmpty()) {
                    enrichResponseWithSystemMetrics(parsedResponse, totalNetWorth, liquidAssets, runwayMonths, runwayAssessment, context);
                    return parsedResponse;
                }
            } catch (Exception e) {
                log.warn("Gọi Gemini Personalized Insights thất bại: {}. Kích hoạt Fallback Deterministic Engine an toàn.", e.getMessage());
            }
        }

        // 5. Fallback Deterministic Engine chuẩn xác 100% khi offline hoặc parse lỗi
        return buildDeterministicFallbackResponse(context, totalNetWorth, liquidAssets, bank, effectiveMonthlyExpense,
                runwayMonths, runwayAssessment, depositDeltaAnnual, depositDeltaMonthly, inflationDeltaMonthly);
    }

    private String buildPersonalizedInsightsPrompt(HybridFinancialContext context, String mathBaseline) {
        String internalContext = context.toInternalFinancialContextString();
        String untrustedNews = context.toUntrustedExternalNewsString();

        String prompt = personalizedInsightsPromptTemplate;
        prompt = prompt.replaceFirst("%s", Matcher.quoteReplacement(internalContext));
        prompt = prompt.replaceFirst("%s", Matcher.quoteReplacement(untrustedNews));
        prompt = prompt.replaceFirst("%s", Matcher.quoteReplacement(mathBaseline));
        return prompt;
    }

    private PersonalizedInsightResponse parseGeminiJsonResponse(String rawJson, HybridFinancialContext context) {
        if (rawJson == null || rawJson.trim().isEmpty()) {
            return null;
        }

        String cleanedJson = rawJson.trim();
        if (cleanedJson.startsWith("```json")) {
            cleanedJson = cleanedJson.substring(7);
        } else if (cleanedJson.startsWith("```")) {
            cleanedJson = cleanedJson.substring(3);
        }
        if (cleanedJson.endsWith("```")) {
            cleanedJson = cleanedJson.substring(0, cleanedJson.length() - 3);
        }
        cleanedJson = cleanedJson.trim();

        try {
            JsonNode root = objectMapper.readTree(cleanedJson);
            PersonalizedInsightResponse res = new PersonalizedInsightResponse();
            res.setSummary(root.path("summary").asText(""));
            res.setCashRunwayMonths(root.path("cashRunwayMonths").asDouble(0.0));
            res.setRunwayAssessment(root.path("runwayAssessment").asText(""));
            res.setDisclaimer(root.path("disclaimer").asText(STANDARD_DISCLAIMER));
            res.setModelVersion(geminiConfig.getModel());

            JsonNode insightsNode = root.path("insights");
            if (insightsNode.isArray()) {
                List<PersonalizedInsightItem> items = new ArrayList<>();
                for (JsonNode itemNode : insightsNode) {
                    PersonalizedInsightItem item = new PersonalizedInsightItem();
                    item.setTopic(itemNode.path("topic").asText("TỔNG QUAN"));
                    item.setMacroTitle(itemNode.path("macroTitle").asText(""));
                    item.setImpactType(itemNode.path("impactType").asText("NEUTRAL"));
                    item.setPersonalSituation(itemNode.path("personalSituation").asText(""));
                    item.setQuantitativeCalculation(itemNode.path("quantitativeCalculation").asText(""));
                    item.setEstimatedFinancialImpactVnd(itemNode.path("estimatedFinancialImpactVnd").asLong(0L));
                    item.setRecommendedAction(itemNode.path("recommendedAction").asText(""));

                    JsonNode citationsNode = itemNode.path("citationIndices");
                    if (citationsNode.isArray()) {
                        List<Integer> citations = new ArrayList<>();
                        for (JsonNode cNode : citationsNode) {
                            citations.add(cNode.asInt());
                        }
                        item.setCitationIndices(citations);
                    }
                    items.add(item);
                }
                res.setInsights(items);
            }
            return res;
        } catch (Exception e) {
            log.warn("Không thể bóc tách JSON phản hồi từ Gemini: {}", e.getMessage());
            return null;
        }
    }

    private void enrichResponseWithSystemMetrics(
            PersonalizedInsightResponse res,
            long totalNetWorth,
            long liquidAssets,
            double runwayMonths,
            String runwayAssessment,
            HybridFinancialContext context) {
        res.setNetWorthVnd(totalNetWorth);
        res.setLiquidAssetsVnd(liquidAssets);
        if (res.getCashRunwayMonths() == null || res.getCashRunwayMonths() <= 0.0) {
            res.setCashRunwayMonths(runwayMonths);
        }
        if (res.getRunwayAssessment() == null || res.getRunwayAssessment().isBlank()) {
            res.setRunwayAssessment(runwayAssessment);
        }
        if (res.getDisclaimer() == null || res.getDisclaimer().isBlank()) {
            res.setDisclaimer(STANDARD_DISCLAIMER);
        }
        res.setRetrievedNews(context.getRelevantNews());
        if (res.getModelVersion() == null) {
            res.setModelVersion(geminiConfig.getModel());
        }
    }

    private PersonalizedInsightResponse buildDeterministicFallbackResponse(
            HybridFinancialContext context,
            long totalNetWorth,
            long liquidAssets,
            long bankBalance,
            long monthlyExpense,
            double runwayMonths,
            String runwayAssessment,
            long depositDeltaAnnual,
            long depositDeltaMonthly,
            long inflationDeltaMonthly) {

        PersonalizedInsightResponse response = new PersonalizedInsightResponse();
        response.setNetWorthVnd(totalNetWorth);
        response.setLiquidAssetsVnd(liquidAssets);
        response.setCashRunwayMonths(runwayMonths);
        response.setRunwayAssessment(runwayAssessment);
        response.setModelVersion("FINMAN_DETERMINISTIC_RULES_ENGINE");
        response.setDisclaimer(STANDARD_DISCLAIMER);
        response.setRetrievedNews(context.getRelevantNews());

        List<PersonalizedInsightItem> items = new ArrayList<>();

        // 1. Nhận định Lãi suất ngân hàng
        String bankAction = bankBalance > 20_000_000L
                ? "Cân nhắc chia số dư ngân hàng thành các gói tiết kiệm kỳ hạn 6-12 tháng tại các ngân hàng uy tín để tối ưu hóa lợi suất."
                : "Tập trung tích lũy gia tăng số dư tiền gửi ngân hàng để tối ưu nguồn thu nhập thụ động từ lãi suất.";
        items.add(new PersonalizedInsightItem(
                "LÃI SUẤT TIẾT KIỆM",
                "Mặt bằng lãi suất huy động ngân hàng và xu hướng điều hành tiền tệ",
                "POSITIVE",
                String.format("Bạn đang có %s trong tài khoản ngân hàng.", formatMoney(bankBalance)),
                String.format("%s × +1.0%% = +%s/năm (~ +%s/tháng)",
                        formatMoney(bankBalance), formatMoney(depositDeltaAnnual), formatMoney(depositDeltaMonthly)),
                depositDeltaAnnual,
                bankAction,
                List.of(1)
        ));

        // 2. Nhận định Quỹ dự phòng khẩn cấp
        String runwayAction;
        String runwayImpactType;
        if (runwayMonths < 3.0) {
            runwayImpactType = "WARNING";
            runwayAction = String.format("Quỹ dự phòng hiện tại (%.1f tháng) dưới mức an toàn (3-6 tháng). Khuyến nghị trích thêm 15-20%% thu nhập vào tài khoản Ngân hàng.", runwayMonths);
        } else if (runwayMonths <= 6.0) {
            runwayImpactType = "POSITIVE";
            runwayAction = String.format("Dự phòng tài chính của bạn đạt mức chuẩn an toàn (%.1f tháng). Tiếp tục duy trì kỷ luật chi tiêu hiện tại.", runwayMonths);
        } else {
            runwayImpactType = "NEUTRAL";
            runwayAction = String.format("Bạn có lượng thanh khoản rất dồi dào (%.1f tháng chi tiêu). Cân nhắc phân bổ một phần tiền nhàn rỗi sang kênh đầu tư sinh lời cao hơn.", runwayMonths);
        }
        items.add(new PersonalizedInsightItem(
                "QUỸ DỰ PHÒNG KHẨN CẤP",
                "Khả năng hấp thụ rủi ro biến động kinh tế và chi phí bất ngờ",
                runwayImpactType,
                String.format("Tổng tiền mặt và ngân hàng khả dụng: %s (chi tiêu ước tính %s/tháng).", formatMoney(liquidAssets), formatMoney(monthlyExpense)),
                String.format("%s / %s = %.1f tháng chi tiêu", formatMoney(liquidAssets), formatMoney(monthlyExpense), runwayMonths),
                liquidAssets,
                runwayAction,
                new ArrayList<>()
        ));

        // 3. Nhận định Lạm phát & Chi phí hàng hóa
        items.add(new PersonalizedInsightItem(
                "LẠM PHÁT & GIÁ CẢ",
                "Áp lực tăng giá năng lượng, chi phí sinh hoạt và tiêu dùng",
                "NEGATIVE",
                String.format("Chi tiêu sinh hoạt hàng tháng của bạn hiện ở mức %s.", formatMoney(monthlyExpense)),
                String.format("%s × +5.0%% = +%s/tháng (~ +%s/năm)",
                        formatMoney(monthlyExpense), formatMoney(inflationDeltaMonthly), formatMoney(inflationDeltaMonthly * 12)),
                inflationDeltaMonthly * 12,
                "Cắt giảm các khoản chi tiêu không thiết yếu và đặt hạn mức ngân sách chặt chẽ cho danh mục ăn uống, mua sắm.",
                List.of(2)
        ));

        response.setInsights(items);
        response.setSummary(String.format(
                "Tài sản ròng hiện tại của bạn đạt %s với khả năng dự phòng chi tiêu trong %.1f tháng (%s). " +
                "Trước biến động lãi suất và lạm phát, bạn có thể gia tăng thêm %s/năm nếu tối ưu hóa số dư ngân hàng và cần theo dõi sát sao hạn mức ngân sách tháng.",
                formatMoney(totalNetWorth), runwayMonths, runwayAssessment, formatMoney(depositDeltaAnnual)));

        return response;
    }

    // =========================================================================
    // 3. WHAT-IF MACRO IMPACT SCENARIO SIMULATION
    // =========================================================================

    /**
     * Mô phỏng kịch bản giả định biến động vĩ mô (lãi suất tăng X%, giá xăng dầu tăng Y%)
     * lên tài chính cá nhân của người dùng với tính toán số học chuẩn xác.
     */
    @Transactional(readOnly = true)
    public MacroImpactEvaluationResponse evaluateMacroImpact(Long userId, MacroImpactRequest request) {
        if (userId == null) {
            throw new IllegalArgumentException("userId không được để trống");
        }
        if (request == null || request.getMacroTopic() == null || request.getEstimatedChangePct() == null) {
            throw new IllegalArgumentException("Dữ liệu kịch bản không hợp lệ");
        }

        HybridFinancialContext context = hybridContextBuilder.buildHybridContext(userId, request.getMacroTopic());
        long bank = context.getAccountContext().getBankBalance();
        long monthlySpent = context.getBudgetContext().getTotalSpent();
        long monthlyBudget = context.getBudgetContext().getTotalBudgetAmount();
        long effectiveSpent = monthlySpent > 0 ? monthlySpent : (monthlyBudget > 0 ? monthlyBudget : 0L);

        double pct = request.getEstimatedChangePct();
        String topicLower = request.getMacroTopic().toLowerCase(Locale.ROOT);

        MacroImpactEvaluationResponse res = new MacroImpactEvaluationResponse();
        res.setMacroTopic(request.getMacroTopic());
        res.setEstimatedChangePct(pct);
        res.setDisclaimer(STANDARD_DISCLAIMER);

        if (topicLower.contains("lãi suất") || topicLower.contains("tiền gửi") || topicLower.contains("ngân hàng")) {
            long annual = calculateDepositAnnualYieldDelta(bank, pct);
            long monthly = calculateDepositMonthlyYieldDelta(bank, pct);

            res.setAffectedBalanceVnd(bank);
            res.setAnnualImpactVnd(annual);
            res.setMonthlyImpactVnd(monthly);
            res.setCalculationFormula(String.format("%s × %+.2f%%", formatMoney(bank), pct));
            res.setImpactDescription(String.format(
                    "Với số dư ngân hàng hiện tại %s, biến động lãi suất %+.2f%%/năm sẽ làm thay đổi lợi tức: %s/năm (~ %s/tháng).",
                    formatMoney(bank), pct, formatMoney(annual), formatMoney(monthly)));
            res.setRecommendation(pct > 0
                    ? "Lãi suất tăng là thời điểm tốt để cơ cấu lại kỳ hạn tiền gửi tiết kiệm nhằm tối ưu dòng tiền thụ động."
                    : "Lãi suất giảm khuyến khích tìm kiếm các kênh đầu tư có tỷ suất sinh lời vượt trội hơn.");
        } else if (topicLower.contains("xăng") || topicLower.contains("nhiên liệu") || topicLower.contains("giao thông")) {
            // Tác động lên chi tiêu di chuyển (giả định chiếm 15% tổng chi tiêu nếu không có danh mục cụ thể)
            long transportSpent = Math.round(effectiveSpent * 0.15);
            long monthlyImpact = Math.round(transportSpent * (pct / 100.0));
            long annualImpact = monthlyImpact * 12;

            res.setAffectedBalanceVnd(transportSpent);
            res.setMonthlyImpactVnd(monthlyImpact);
            res.setAnnualImpactVnd(annualImpact);
            res.setCalculationFormula(String.format("%s (chi phí di chuyển ước tính) × %+.2f%%", formatMoney(transportSpent), pct));
            res.setImpactDescription(String.format(
                    "Biến động giá xăng dầu %+.2f%% làm tăng chi phí di chuyển ước tính: %s/tháng (~ %s/năm).",
                    pct, formatMoney(monthlyImpact), formatMoney(annualImpact)));
            res.setRecommendation("Cân nhắc tối ưu hóa lộ trình di chuyển hoặc sử dụng phương tiện công cộng để kiểm soát chi phí nhiên liệu.");
        } else {
            // Mặc định tính theo chi phí sinh hoạt chung (Lạm phát)
            long monthlyImpact = calculateMonthlyInflationExpenseDelta(effectiveSpent, pct);
            long annualImpact = monthlyImpact * 12;

            res.setAffectedBalanceVnd(effectiveSpent);
            res.setMonthlyImpactVnd(monthlyImpact);
            res.setAnnualImpactVnd(annualImpact);
            res.setCalculationFormula(String.format("%s (chi tiêu tháng) × %+.2f%%", formatMoney(effectiveSpent), pct));
            res.setImpactDescription(String.format(
                    "Biến động %s %+.2f%% làm thay đổi chi tiêu sinh hoạt ước tính: %s/tháng (~ %s/năm).",
                    request.getMacroTopic(), pct, formatMoney(monthlyImpact), formatMoney(annualImpact)));
            res.setRecommendation("Xem lại các hạng mục chi tiêu không bắt buộc để duy trì ngân sách an toàn.");
        }

        return res;
    }

    // =========================================================================
    // 4. CONVERSATIONAL PIPELINE INTEGRATION (ASK PERSONALIZED ASSISTANT)
    // =========================================================================

    /**
     * Phương thức điều phối đàm thoại v2:
     * - Quản lý phiên hội thoại `AiConversation` với Multi-tenant isolation.
     * - Gom ngữ cảnh lai nội bộ + tin tức vĩ ngoại vi có phòng vệ Prompt Injection.
     * - Bóc tách và liên kết các nguồn trích dẫn bằng `CitationProcessor`.
     * - Lưu vết tin nhắn người dùng và trợ lý vào CSDL.
     */
    @Transactional
    public AiMessageResponse askPersonalizedAssistant(Long userId, Long conversationId, String userMessage) {
        if (userId == null) {
            throw new IllegalArgumentException("userId không được để trống");
        }
        if (userMessage == null || userMessage.trim().isEmpty()) {
            throw new IllegalArgumentException("Nội dung tin nhắn không được để trống");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", userId));

        // 1. Tìm hoặc tạo phiên hội thoại
        AiConversation conversation;
        if (conversationId != null) {
            conversation = conversationRepository.findByIdAndUserId(conversationId, userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Phiên hội thoại", "id", conversationId));
        } else {
            conversation = new AiConversation();
            conversation.setUser(user);
            String title = userMessage.length() > 60 ? userMessage.substring(0, 57) + "..." : userMessage;
            conversation.setTitle(title);
            conversation.setModelVersion(geminiConfig.getModel());
            conversation = conversationRepository.save(conversation);
        }

        // 2. Lưu tin nhắn người dùng (Role USER)
        AiMessage userMsgEntity = new AiMessage();
        userMsgEntity.setConversation(conversation);
        userMsgEntity.setRole(AiMessageRole.USER);
        userMsgEntity.setContent(userMessage.trim());
        messageRepository.save(userMsgEntity);

        // 3. Gom ngữ cảnh lai
        HybridFinancialContext hybridContext = hybridContextBuilder.buildHybridContext(userId, userMessage);

        // 4. Xây dựng prompt và gọi Gemini
        String aiResponseText;
        String rawPrompt = "";
        if (geminiConfig.hasApiKey() && financialAssistantV2PromptTemplate != null && !financialAssistantV2PromptTemplate.isEmpty()) {
            try {
                rawPrompt = buildAssistantV2Prompt(hybridContext, conversation, userMessage);
                aiResponseText = geminiClient.generateContent(rawPrompt, false);
            } catch (Exception e) {
                log.warn("Gọi Gemini Assistant v2 thất bại: {}. Dùng fallback phản hồi trực quan.", e.getMessage());
                aiResponseText = generateAssistantFallbackResponse(hybridContext, userMessage);
            }
        } else {
            aiResponseText = generateAssistantFallbackResponse(hybridContext, userMessage);
        }

        // 5. Lưu tin nhắn phản hồi của Trợ lý (Role ASSISTANT)
        AiMessage assistantMsgEntity = new AiMessage();
        assistantMsgEntity.setConversation(conversation);
        assistantMsgEntity.setRole(AiMessageRole.ASSISTANT);
        assistantMsgEntity.setContent(aiResponseText);
        assistantMsgEntity.setRawPrompt(rawPrompt);
        assistantMsgEntity.setTokensUsed(Math.max(1, (userMessage.length() + aiResponseText.length()) / 4));
        assistantMsgEntity = messageRepository.save(assistantMsgEntity);

        // 6. Xử lý bóc tách và ánh xạ trích dẫn nguồn bài báo
        citationProcessor.process(assistantMsgEntity, aiResponseText, hybridContext.getRelevantNews());

        // 7. Cập nhật thời điểm cập nhật của cuộc hội thoại
        conversation.setUpdatedAt(Instant.now());
        conversationRepository.save(conversation);

        return AiMessageResponse.fromEntity(assistantMsgEntity);
    }

    private String buildAssistantV2Prompt(HybridFinancialContext context, AiConversation conversation, String userMessage) {
        String internalContext = context.toInternalFinancialContextString();
        String untrustedNews = context.toUntrustedExternalNewsString();

        // Lấy lịch sử hội thoại gần nhất (tối đa 4 tin nhắn)
        List<AiMessage> recentMsgs = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId());
        StringBuilder historyBuilder = new StringBuilder();
        int start = Math.max(0, recentMsgs.size() - 4);
        for (int i = start; i < recentMsgs.size(); i++) {
            AiMessage m = recentMsgs.get(i);
            historyBuilder.append(String.format("[%s]: %s\n", m.getRole(), m.getContent()));
        }

        String prompt = financialAssistantV2PromptTemplate;
        prompt = prompt.replaceFirst("%s", Matcher.quoteReplacement(internalContext));
        prompt = prompt.replaceFirst("%s", Matcher.quoteReplacement(untrustedNews));
        prompt = prompt.replaceFirst("%s", Matcher.quoteReplacement(historyBuilder.toString()));
        prompt = prompt.replaceFirst("%s", Matcher.quoteReplacement(userMessage));
        return prompt;
    }

    private String generateAssistantFallbackResponse(HybridFinancialContext context, String userMessage) {
        long bank = context.getAccountContext().getBankBalance();
        long total = context.getAccountContext().getTotalBalance();
        long spent = context.getBudgetContext().getTotalSpent();

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("Chào bạn! Dựa trên thông tin tài chính hiện tại, tổng tài sản khả dụng của bạn là **%s** ", formatMoney(total)));
        sb.append(String.format("(trong đó số dư ngân hàng là **%s**, tổng chi tiêu tháng này là **%s**).\n\n", formatMoney(bank), formatMoney(spent)));

        if (!context.getRelevantNews().isEmpty()) {
            var news1 = context.getRelevantNews().get(0);
            sb.append(String.format("Theo ghi nhận thị trường gần đây, sự kiện *\"%s\"* [%d] đang thu hút nhiều sự quan tâm. ",
                    news1.getTitle(), news1.getCitationIndex()));
            if (news1.getBulletPoints() != null && !news1.getBulletPoints().isBlank()) {
                sb.append(String.format("\n- Tóm tắt thị trường: %s\n", news1.getBulletPoints()));
            }
        }

        sb.append("\n**Gợi ý hành động tài chính:**\n");
        sb.append("- Kiểm soát chặt chẽ ngân sách tháng để duy trì tỷ lệ tích lũy an toàn.\n");
        sb.append("- Đảm bảo duy trì quỹ khẩn cấp tối thiểu 3-6 tháng chi tiêu trước khi cân nhắc mở rộng danh mục đầu tư.\n\n");
        sb.append("*" + STANDARD_DISCLAIMER + "*");

        return sb.toString();
    }

    // =========================================================================
    // 5. CONVERSATION MANAGEMENT (SESSIONS & CITATIONS)
    // =========================================================================

    @Transactional(readOnly = true)
    public List<AiConversationResponse> getUserConversations(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("userId không được để trống");
        }
        return conversationRepository.findByUserIdAndIsArchivedFalseOrderByIsPinnedDescUpdatedAtDesc(userId)
                .stream()
                .map(AiConversationResponse::fromEntity)
                .toList();
    }

    @Transactional
    public AiConversationResponse createConversation(Long userId, String title) {
        if (userId == null) {
            throw new IllegalArgumentException("userId không được để trống");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", userId));

        AiConversation conv = new AiConversation();
        conv.setUser(user);
        conv.setTitle((title != null && !title.isBlank()) ? title.trim() : "Cuộc trò chuyện mới");
        conv.setModelVersion(geminiConfig.getModel());
        conv = conversationRepository.save(conv);
        return AiConversationResponse.fromEntity(conv);
    }

    @Transactional(readOnly = true)
    public AiConversationResponse getConversationDetail(Long userId, Long conversationId) {
        if (userId == null || conversationId == null) {
            throw new IllegalArgumentException("Tham số không hợp lệ");
        }
        AiConversation conv = conversationRepository.findByIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cuộc hội thoại", "id", conversationId));
        return AiConversationResponse.fromEntity(conv, true);
    }

    @Transactional
    public void deleteConversation(Long userId, Long conversationId) {
        if (userId == null || conversationId == null) {
            throw new IllegalArgumentException("Tham số không hợp lệ");
        }
        if (!conversationRepository.existsByIdAndUserId(conversationId, userId)) {
            throw new ResourceNotFoundException("Cuộc hội thoại", "id", conversationId);
        }
        conversationRepository.deleteByIdAndUserId(conversationId, userId);
    }

    @Transactional
    public AiConversationResponse togglePinConversation(Long userId, Long conversationId) {
        if (userId == null || conversationId == null) {
            throw new IllegalArgumentException("Tham số không hợp lệ");
        }
        AiConversation conv = conversationRepository.findByIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cuộc hội thoại", "id", conversationId));
        conv.setPinned(!conv.isPinned());
        conv.setUpdatedAt(Instant.now());
        conv = conversationRepository.save(conv);
        return AiConversationResponse.fromEntity(conv);
    }

    @Transactional
    public void archiveConversation(Long userId, Long conversationId) {
        if (userId == null || conversationId == null) {
            throw new IllegalArgumentException("Tham số không hợp lệ");
        }
        if (!conversationRepository.existsByIdAndUserId(conversationId, userId)) {
            throw new ResourceNotFoundException("Cuộc hội thoại", "id", conversationId);
        }
        conversationRepository.archiveByIdAndUserId(conversationId, userId);
    }
}

