package com.finman.service.intelligence;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.finman.client.GeminiClient;
import com.finman.config.GeminiConfig;
import com.finman.dto.response.BudgetResponse;
import com.finman.dto.response.BudgetSummaryResponse;
import com.finman.dto.response.DailyDigestResponse;
import com.finman.dto.response.DailyIntelligenceResponse;
import com.finman.dto.response.HeadlineItemDto;
import com.finman.dto.response.MarketPulseItemDto;
import com.finman.dto.response.PersonalFinancialAlertDto;
import com.finman.entity.DailyDigest;
import com.finman.entity.MarketIndex;
import com.finman.entity.NewsArticle;
import com.finman.entity.NewsSummary;
import com.finman.repository.DailyDigestRepository;
import com.finman.repository.MarketIndexRepository;
import com.finman.repository.NewsArticleRepository;
import com.finman.repository.NewsSummaryRepository;
import com.finman.service.BudgetService;
import com.finman.service.ai.NewsAiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class DailyIntelligenceService {

    private static final Logger log = LoggerFactory.getLogger(DailyIntelligenceService.class);
    private static final String PROMPT_PATH = "prompts/daily-macro-digest.txt";
    private static final String PROMPT_TEMPLATE = loadPromptTemplate();

    private final DailyDigestRepository dailyDigestRepository;
    private final MarketIndexRepository marketIndexRepository;
    private final NewsArticleRepository newsArticleRepository;
    private final NewsSummaryRepository newsSummaryRepository;
    private final NewsAiService newsAiService;
    private final GeminiClient geminiClient;
    private final GeminiConfig geminiConfig;
    private final BudgetService budgetService;
    private final ObjectMapper objectMapper;

    private final Map<LocalDate, DailyDigest> memoryCache = new ConcurrentHashMap<>();

    @Autowired
    public DailyIntelligenceService(
            DailyDigestRepository dailyDigestRepository,
            MarketIndexRepository marketIndexRepository,
            NewsArticleRepository newsArticleRepository,
            NewsSummaryRepository newsSummaryRepository,
            NewsAiService newsAiService,
            GeminiClient geminiClient,
            GeminiConfig geminiConfig,
            BudgetService budgetService,
            ObjectMapper objectMapper
    ) {
        this.dailyDigestRepository = dailyDigestRepository;
        this.marketIndexRepository = marketIndexRepository;
        this.newsArticleRepository = newsArticleRepository;
        this.newsSummaryRepository = newsSummaryRepository;
        this.newsAiService = newsAiService;
        this.geminiClient = geminiClient;
        this.geminiConfig = geminiConfig;
        this.budgetService = budgetService;

        ObjectMapper mapper = objectMapper != null ? objectMapper.copy() : new ObjectMapper();
        mapper.findAndRegisterModules();
        mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        this.objectMapper = mapper;
    }

    // Secondary constructor for testing or manual instantiation without budgetService
    public DailyIntelligenceService(
            DailyDigestRepository dailyDigestRepository,
            MarketIndexRepository marketIndexRepository,
            NewsArticleRepository newsArticleRepository,
            NewsSummaryRepository newsSummaryRepository,
            NewsAiService newsAiService,
            GeminiClient geminiClient,
            GeminiConfig geminiConfig,
            ObjectMapper objectMapper
    ) {
        this(dailyDigestRepository, marketIndexRepository, newsArticleRepository, newsSummaryRepository,
                newsAiService, geminiClient, geminiConfig, null, objectMapper);
    }

    /**
     * Tổng hợp bản tin tài chính buổi sáng cho ngày targetDate (hoặc lấy từ DB/cache nếu đã tạo).
     */
    @Transactional
    public DailyDigest compileDailyDigest(LocalDate targetDate) {
        if (targetDate == null) {
            targetDate = LocalDate.now();
        }

        // 1. Kiểm tra cache / DB trước để đảm bảo tính Idempotent
        DailyDigest cachedMem = memoryCache.get(targetDate);
        if (cachedMem != null) {
            return cachedMem;
        }

        Optional<DailyDigest> existing = dailyDigestRepository.findByDigestDate(targetDate);
        if (existing.isPresent()) {
            DailyDigest digest = existing.get();
            memoryCache.put(targetDate, digest);
            return digest;
        }

        log.info("DailyIntelligenceService: Bắt đầu tổng hợp bản tin sáng ngày {}...", targetDate);
        long startTime = System.currentTimeMillis();

        // 2. Thu thập dữ liệu Nhịp đập thị trường (Market Pulse)
        List<MarketPulseItemDto> marketPulseList = collectMarketPulse();
        String marketPulseJson = writeJson(marketPulseList);

        // 3. Thu thập Top 5 tin tức tài chính quan trọng nhất trong 48 giờ qua
        List<HeadlineItemDto> topHeadlines = collectTopHeadlines();
        String topHeadlinesJson = writeJson(topHeadlines);

        // 4. Sinh nhận định kinh tế vĩ mô, takeaways và gợi ý prompt tương tác thông qua Gemini
        AiMacroResult aiMacroResult = generateMacroSynthesis(marketPulseList, topHeadlines);

        // 5. Lưu trữ bản tin vào DB
        DailyDigest digest = new DailyDigest();
        digest.setDigestDate(targetDate);
        digest.setAiMacroSummary(aiMacroResult.aiMacroSummary());
        digest.setMarketPulseJson(marketPulseJson);
        digest.setTopHeadlinesJson(topHeadlinesJson);
        digest.setKeyTakeawaysJson(writeJson(aiMacroResult.keyTakeaways()));
        digest.setSuggestedPromptsJson(writeJson(aiMacroResult.suggestedPrompts()));
        digest.setStatus("READY");

        DailyDigest saved = dailyDigestRepository.save(digest);
        memoryCache.put(targetDate, saved);

        long elapsed = System.currentTimeMillis() - startTime;
        log.info("DailyIntelligenceService: Đã tạo và lưu thành công bản tin sáng ngày {} trong {} ms.", targetDate, elapsed);
        return saved;
    }

    /**
     * Ép buộc tổng hợp lại bản tin tài chính buổi sáng cho ngày targetDate (bỏ qua cache/DB hiện có).
     */
    @Transactional
    public DailyDigest forceCompileDailyDigest(LocalDate targetDate) {
        final LocalDate dateToUse = targetDate != null ? targetDate : LocalDate.now();

        log.info("DailyIntelligenceService: Bắt đầu tổng hợp LẠI bản tin sáng ngày {} (bỏ qua cache)...", dateToUse);
        long startTime = System.currentTimeMillis();

        // 1. Thu thập dữ liệu Nhịp đập thị trường (Market Pulse)
        List<MarketPulseItemDto> marketPulseList = collectMarketPulse();
        String marketPulseJson = writeJson(marketPulseList);

        // 2. Thu thập Top 5 tin tức tài chính quan trọng nhất trong 48 giờ qua
        List<HeadlineItemDto> topHeadlines = collectTopHeadlines();
        String topHeadlinesJson = writeJson(topHeadlines);

        // 3. Sinh nhận định kinh tế vĩ mô, takeaways và gợi ý prompt tương tác thông qua Gemini
        AiMacroResult aiMacroResult = generateMacroSynthesis(marketPulseList, topHeadlines);

        // 4. Lưu hoặc cập nhật bản tin vào DB
        DailyDigest digest = dailyDigestRepository.findByDigestDate(dateToUse).orElseGet(() -> {
            DailyDigest d = new DailyDigest();
            d.setDigestDate(dateToUse);
            return d;
        });

        digest.setAiMacroSummary(aiMacroResult.aiMacroSummary());
        digest.setMarketPulseJson(marketPulseJson);
        digest.setTopHeadlinesJson(topHeadlinesJson);
        digest.setKeyTakeawaysJson(writeJson(aiMacroResult.keyTakeaways()));
        digest.setSuggestedPromptsJson(writeJson(aiMacroResult.suggestedPrompts()));
        digest.setStatus("READY");

        DailyDigest saved = dailyDigestRepository.save(digest);
        memoryCache.put(dateToUse, saved);

        long elapsed = System.currentTimeMillis() - startTime;
        log.info("DailyIntelligenceService: Đã tổng hợp lại thành công bản tin sáng ngày {} trong {} ms.", dateToUse, elapsed);
        return saved;
    }

    /**
     * Tra cứu bản tin của một ngày cụ thể (nếu là hôm nay và chưa có thì tự động tổng hợp ngay).
     */
    @Transactional
    public Optional<DailyDigest> getDailyDigest(LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }

        DailyDigest mem = memoryCache.get(date);
        if (mem != null) {
            return Optional.of(mem);
        }

        Optional<DailyDigest> fromDb = dailyDigestRepository.findByDigestDate(date);
        if (fromDb.isPresent()) {
            memoryCache.put(date, fromDb.get());
            return fromDb;
        }

        // Nếu là ngày hôm nay mà chưa có trong DB, tự động tổng hợp ngay
        if (date.equals(LocalDate.now())) {
            try {
                return Optional.of(compileDailyDigest(date));
            } catch (Exception e) {
                log.warn("DailyIntelligenceService: Không thể tự động tổng hợp bản tin hôm nay: {}", e.getMessage());
            }
        }

        return Optional.empty();
    }

    /**
     * Lấy bản tin ngày hôm nay, nếu hôm nay chưa có thì lấy bản tin gần nhất trong DB hoặc tổng hợp mới.
     */
    @Transactional
    public DailyDigest getLatestOrTodayDigest() {
        LocalDate today = LocalDate.now();
        Optional<DailyDigest> todayDigest = getDailyDigest(today);
        if (todayDigest.isPresent()) {
            return todayDigest.get();
        }

        Optional<DailyDigest> latest = dailyDigestRepository.findTopByOrderByDigestDateDesc();
        if (latest.isPresent()) {
            return latest.get();
        }

        return compileDailyDigest(today);
    }

    /**
     * Chuyển đổi Entity sang Response DTO an toàn cho Frontend.
     */
    public DailyDigestResponse convertToResponse(DailyDigest digest) {
        if (digest == null) {
            return null;
        }

        DailyDigestResponse res = new DailyDigestResponse();
        res.setId(digest.getId());
        res.setDigestDate(digest.getDigestDate());
        res.setAiMacroSummary(digest.getAiMacroSummary());
        res.setStatus(digest.getStatus());
        res.setCreatedAt(digest.getCreatedAt());

        res.setMarketPulse(readJsonList(digest.getMarketPulseJson(), new TypeReference<List<MarketPulseItemDto>>() {}));
        res.setTopHeadlines(readJsonList(digest.getTopHeadlinesJson(), new TypeReference<List<HeadlineItemDto>>() {}));
        res.setKeyTakeaways(readJsonList(digest.getKeyTakeawaysJson(), new TypeReference<List<String>>() {}));
        res.setSuggestedPrompts(readJsonList(digest.getSuggestedPromptsJson(), new TypeReference<List<String>>() {}));

        return res;
    }

    /**
     * Lấy toàn bộ thông tin bản tin tổng hợp hằng ngày kèm góc cảnh báo tài chính cá nhân hóa cho người dùng (Task 18.2).
     */
    @Transactional
    public DailyIntelligenceResponse getAggregatedDailyIntelligence(LocalDate date, Long userId) {
        if (date == null) {
            date = LocalDate.now();
        }

        DailyDigest digest = getDailyDigest(date).orElseGet(this::getLatestOrTodayDigest);

        DailyIntelligenceResponse res = new DailyIntelligenceResponse();
        res.setId(digest.getId());
        res.setDigestDate(digest.getDigestDate());
        res.setAiMacroSummary(digest.getAiMacroSummary());
        res.setStatus(digest.getStatus());
        res.setCreatedAt(digest.getCreatedAt());

        res.setMarketPulse(readJsonList(digest.getMarketPulseJson(), new TypeReference<List<MarketPulseItemDto>>() {}));
        res.setTopHeadlines(readJsonList(digest.getTopHeadlinesJson(), new TypeReference<List<HeadlineItemDto>>() {}));
        res.setKeyTakeaways(readJsonList(digest.getKeyTakeawaysJson(), new TypeReference<List<String>>() {}));
        res.setSuggestedPrompts(readJsonList(digest.getSuggestedPromptsJson(), new TypeReference<List<String>>() {}));

        // Tính toán góc cảnh báo tiến độ ngân sách cá nhân hóa dựa trên ngày trong tháng
        res.setPersonalAlert(calculatePersonalFinancialAlert(userId, digest.getDigestDate()));

        return res;
    }

    /**
     * Tính toán góc cảnh báo ngân sách cá nhân hóa theo tiến độ thời gian trong tháng (Scenario AC-16).
     */
    public PersonalFinancialAlertDto calculatePersonalFinancialAlert(Long userId, LocalDate targetDate) {
        LocalDate date = targetDate != null ? targetDate : LocalDate.now();
        int dayOfMonth = date.getDayOfMonth();
        int daysInMonth = date.lengthOfMonth();
        double monthProgressPercent = Math.round((dayOfMonth * 100.0 / daysInMonth) * 10.0) / 10.0;

        // Nếu người dùng chưa đăng nhập hoặc chưa inject budgetService
        if (userId == null || budgetService == null) {
            return new PersonalFinancialAlertDto(
                    dayOfMonth,
                    daysInMonth,
                    monthProgressPercent,
                    0L,
                    0L,
                    0L,
                    0.0,
                    "INFO",
                    String.format("Tiến độ tháng %d/2026", date.getMonthValue()),
                    String.format("Hôm nay là ngày %d/%d (%.1f%% chu kỳ tháng). Hãy đăng nhập để kích hoạt cảnh báo ngân sách và quản trị dòng tiền cá nhân.", dayOfMonth, daysInMonth, monthProgressPercent),
                    "Thiết lập ngân sách hàng tháng giúp bạn gia tăng 20% khả năng tích lũy tài sản dài hạn.",
                    null,
                    0.0
            );
        }

        try {
            YearMonth ym = YearMonth.from(date);
            BudgetSummaryResponse summary = budgetService.getBudgetSummary(userId, ym.toString());

            Long totalBudget = summary.getTotalBudget() != null ? summary.getTotalBudget() : 0L;
            Long totalSpent = summary.getTotalSpent() != null ? summary.getTotalSpent() : 0L;
            Long totalRemaining = summary.getTotalRemaining() != null ? summary.getTotalRemaining() : 0L;

            if (totalBudget <= 0) {
                return new PersonalFinancialAlertDto(
                        dayOfMonth,
                        daysInMonth,
                        monthProgressPercent,
                        0L,
                        totalSpent,
                        0L,
                        0.0,
                        "INFO",
                        String.format("Chưa đặt ngân sách tháng %d", date.getMonthValue()),
                        String.format("Hôm nay là ngày %d/%d (%.1f%% chu kỳ tháng). Bạn đã chi tiêu %,d đ nhưng chưa đặt hạn mức ngân sách tháng này.", dayOfMonth, daysInMonth, monthProgressPercent, totalSpent),
                        "Hãy thiết lập ngân sách chi tiêu để FinMan giúp bạn tự động kiểm soát và cảnh báo kịp thời.",
                        null,
                        0.0
                );
            }

            double spentPercent = summary.getOverallPercentage() != null ? summary.getOverallPercentage() :
                    (totalBudget > 0 ? Math.round((totalSpent * 100.0 / totalBudget) * 10.0) / 10.0 : 0.0);

            // Tìm danh mục chi tiêu cao nhất
            String highestCatName = null;
            double highestCatPercent = 0.0;
            if (summary.getBudgets() != null && !summary.getBudgets().isEmpty()) {
                for (BudgetResponse b : summary.getBudgets()) {
                    double pct = b.getPercentage() != null ? b.getPercentage() : 0.0;
                    if (pct > highestCatPercent) {
                        highestCatPercent = pct;
                        highestCatName = b.getCategory() != null ? b.getCategory().getName() : "Chi tiêu";
                    }
                }
            }

            String alertLevel;
            String title;
            String message;
            String recommendation;

            if (spentPercent >= 100.0 || spentPercent > (monthProgressPercent + 20.0)) {
                alertLevel = "DANGER";
                title = String.format("Cảnh báo tốc độ chi tiêu tháng %d", date.getMonthValue());
                message = String.format("Hôm nay là ngày %d/%d (%.1f%% chu kỳ tháng), nhưng bạn đã dùng %.1f%% ngân sách (Đã chi %,d đ / Hạn mức %,d đ). Tốc độ chi tiêu đang vượt %.1f%% so với tiến độ thời gian!",
                        dayOfMonth, daysInMonth, monthProgressPercent, spentPercent, totalSpent, totalBudget, (spentPercent - monthProgressPercent));
                recommendation = highestCatName != null ?
                        String.format("Danh mục [%s] đang chiếm tỷ trọng lớn (%.1f%%). Nên hạn chế phát sinh chi tiêu ngoài kế hoạch cho danh mục này trong các ngày tới.", highestCatName, highestCatPercent) :
                        "Nên rà soát lại các khoản chi không thiết yếu để tránh thâm hụt tài chính trước khi hết tháng.";
            } else if (spentPercent > (monthProgressPercent + 8.0)) {
                alertLevel = "WARNING";
                title = String.format("Lưu ý tiến độ ngân sách tháng %d", date.getMonthValue());
                message = String.format("Hôm nay là ngày %d/%d (%.1f%% chu kỳ tháng), bạn đã sử dụng %.1f%% ngân sách. Tốc độ chi tiêu đang nhanh hơn thời gian %.1f%%.",
                        dayOfMonth, daysInMonth, monthProgressPercent, spentPercent, (spentPercent - monthProgressPercent));
                recommendation = "Hãy cân đối các khoản chi tiêu trong tuần này để đảm bảo ngân sách duy trì ổn định đến cuối tháng.";
            } else {
                alertLevel = "SAFE";
                title = String.format("Tiến độ ngân sách an toàn - Tháng %d", date.getMonthValue());
                message = String.format("Hôm nay là ngày %d/%d (%.1f%% chu kỳ tháng), bạn đã sử dụng %.1f%% ngân sách (Còn lại %,d đ). Bạn đang duy trì kỷ luật dòng tiền rất tốt!",
                        dayOfMonth, daysInMonth, monthProgressPercent, spentPercent, totalRemaining);
                recommendation = "Duy trì thặng dư này sẽ giúp bạn có thêm nguồn vốn nhàn rỗi để tích lũy hoặc đầu tư sinh lời.";
            }

            return new PersonalFinancialAlertDto(
                    dayOfMonth,
                    daysInMonth,
                    monthProgressPercent,
                    totalBudget,
                    totalSpent,
                    totalRemaining,
                    spentPercent,
                    alertLevel,
                    title,
                    message,
                    recommendation,
                    highestCatName,
                    highestCatPercent
            );
        } catch (Exception e) {
            log.warn("DailyIntelligenceService: Lỗi tính toán cảnh báo ngân sách cá nhân: {}", e.getMessage());
            return new PersonalFinancialAlertDto(
                    dayOfMonth,
                    daysInMonth,
                    monthProgressPercent,
                    0L,
                    0L,
                    0L,
                    0.0,
                    "INFO",
                    String.format("Góc tài chính cá nhân ngày %d/%d", dayOfMonth, date.getMonthValue()),
                    "Hệ thống đang chuẩn hóa số liệu ngân sách tháng của bạn.",
                    "Kiểm tra lại danh sách giao dịch để đảm bảo dữ liệu luôn được cập nhật chính xác.",
                    null,
                    0.0
            );
        }
    }

    // =========================================================================
    // PRIVATE HELPER METHODS
    // =========================================================================

    private List<MarketPulseItemDto> collectMarketPulse() {
        List<MarketIndex> indices = marketIndexRepository.findAll();
        List<MarketPulseItemDto> items = new ArrayList<>();

        if (indices != null && !indices.isEmpty()) {
            for (MarketIndex mi : indices) {
                boolean isUp = mi.getChangeValue() != null && mi.getChangeValue().compareTo(BigDecimal.ZERO) >= 0;
                items.add(new MarketPulseItemDto(
                        mi.getCode(),
                        mi.getName(),
                        mi.getCurrentValue(),
                        mi.getChangeValue(),
                        mi.getPercentChange(),
                        mi.getTradingVolume(),
                        mi.getTradingValue(),
                        mi.getSessionStatus() != null ? mi.getSessionStatus() : "CLOSED",
                        isUp
                ));
            }
        } else {
            // Dữ liệu mặc định nếu chưa kịp nạp
            items.add(new MarketPulseItemDto("VNINDEX", "VN-Index", BigDecimal.valueOf(1285.50), BigDecimal.valueOf(8.45), BigDecimal.valueOf(0.66), 750000000L, 19500000000000L, "CLOSED", true));
            items.add(new MarketPulseItemDto("VN30", "VN30-Index", BigDecimal.valueOf(1342.10), BigDecimal.valueOf(10.20), BigDecimal.valueOf(0.77), 280000000L, 11200000000000L, "CLOSED", true));
            items.add(new MarketPulseItemDto("HNX", "HNX-Index", BigDecimal.valueOf(238.60), BigDecimal.valueOf(1.15), BigDecimal.valueOf(0.48), 65000000L, 1400000000000L, "CLOSED", true));
            items.add(new MarketPulseItemDto("UPCOM", "UPCoM-Index", BigDecimal.valueOf(92.40), BigDecimal.valueOf(-0.12), BigDecimal.valueOf(-0.13), 45000000L, 620000000000L, "CLOSED", false));
        }

        return items;
    }

    private List<HeadlineItemDto> collectTopHeadlines() {
        Instant since = Instant.now().minus(48, ChronoUnit.HOURS);
        List<NewsArticle> recentArticles = newsArticleRepository.findRecentArticles(since, PageRequest.of(0, 10));

        if (recentArticles.isEmpty()) {
            recentArticles = newsArticleRepository.findTop5ByOrderByPublishedAtDesc();
        }

        List<HeadlineItemDto> result = new ArrayList<>();
        int count = 0;
        for (NewsArticle article : recentArticles) {
            if (count >= 5) break;

            List<String> bullets = new ArrayList<>();
            String sentiment = "NEUTRAL";
            List<String> tickers = new ArrayList<>();

            // Tra cứu tóm tắt AI đã có
            Optional<NewsSummary> optSummary = newsSummaryRepository.findByArticleId(article.getId());
            if (optSummary.isPresent()) {
                NewsSummary ns = optSummary.get();
                if (ns.getBulletPoints() != null) {
                    try {
                        bullets = objectMapper.readValue(ns.getBulletPoints(), new TypeReference<List<String>>() {});
                    } catch (Exception ignored) {
                    }
                }
                if (ns.getSentiment() != null) {
                    sentiment = ns.getSentiment();
                }
                if (ns.getRelatedTickers() != null && !ns.getRelatedTickers().isBlank()) {
                    tickers = Arrays.stream(ns.getRelatedTickers().split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .collect(Collectors.toList());
                }
            }

            // Nếu chưa có tóm tắt AI, fallback tạo từ mô tả bài viết
            if (bullets.isEmpty()) {
                if (article.getDescription() != null && !article.getDescription().isBlank()) {
                    bullets.add(article.getDescription().trim());
                } else {
                    bullets.add(article.getTitle());
                }
            }

            String sourceName = article.getSource() != null ? article.getSource().getName() : "Tin Thị Trường";
            String catName = article.getCategory() != null ? article.getCategory().getNameVi() : "Tài chính vĩ mô";

            result.add(new HeadlineItemDto(
                    article.getId(),
                    article.getTitle(),
                    sourceName,
                    catName,
                    article.getPublishedAt(),
                    bullets,
                    sentiment,
                    article.getOriginalUrl(),
                    tickers
            ));
            count++;
        }

        return result;
    }

    private AiMacroResult generateMacroSynthesis(List<MarketPulseItemDto> marketPulse, List<HeadlineItemDto> headlines) {
        // Kiểm tra xem Gemini có khả dụng không
        if (geminiConfig.hasApiKey()) {
            try {
                String marketText = marketPulse.stream()
                        .map(m -> String.format("- %s (%s): %s điểm (%s%s / %s%%), Khối lượng: %,d CP",
                                m.getName(), m.getCode(), m.getCurrentValue(),
                                m.getChangeValue().compareTo(BigDecimal.ZERO) >= 0 ? "+" : "",
                                m.getChangeValue(), m.getPercentChange(), m.getTradingVolume()))
                        .collect(Collectors.joining("\n"));

                String newsText = headlines.stream()
                        .map(h -> String.format("- [%s] %s (Sắc thái: %s). Tóm tắt: %s",
                                h.getSourceName(), h.getTitle(), h.getSentiment(),
                                String.join("; ", h.getSummaryBullets())))
                        .collect(Collectors.joining("\n"));

                String prompt = PROMPT_TEMPLATE
                        .replace("{market_data}", marketText)
                        .replace("{top_news}", newsText);

                String jsonResponse = geminiClient.generateContent(prompt, true);
                if (jsonResponse != null && !jsonResponse.isBlank()) {
                    return parseAiResponse(jsonResponse);
                }
            } catch (Exception e) {
                log.warn("DailyIntelligenceService: Gọi Gemini API tổng hợp vĩ mô thất bại ({}), chuyển sang rule-based fallback.", e.getMessage());
            }
        }

        // Fallback tự sinh nhận định kinh tế vĩ mô thông minh
        return generateFallbackMacroSynthesis(marketPulse, headlines);
    }

    private AiMacroResult parseAiResponse(String rawJson) {
        try {
            String cleanJson = rawJson.trim();
            if (cleanJson.startsWith("```json")) {
                cleanJson = cleanJson.substring(7);
            }
            if (cleanJson.startsWith("```")) {
                cleanJson = cleanJson.substring(3);
            }
            if (cleanJson.endsWith("```")) {
                cleanJson = cleanJson.substring(0, cleanJson.length() - 3);
            }
            cleanJson = cleanJson.trim();

            JsonNode root = objectMapper.readTree(cleanJson);
            String summary = root.path("ai_macro_summary").asText();
            if (summary == null || summary.isBlank()) {
                summary = "Thị trường tài chính duy trì xu hướng tích cực với dòng tiền phân hóa lành mạnh giữa các nhóm ngành dẫn dắt. Nhà đầu tư nên tiếp tục quản trị rủi ro dòng tiền và duy trì kỷ luật chi tiêu.";
            }

            List<String> takeaways = new ArrayList<>();
            JsonNode takeArr = root.path("key_takeaways");
            if (takeArr.isArray()) {
                for (JsonNode n : takeArr) {
                    takeaways.add(n.asText());
                }
            }

            List<String> prompts = new ArrayList<>();
            JsonNode promptArr = root.path("suggested_prompts");
            if (promptArr.isArray()) {
                for (JsonNode n : promptArr) {
                    prompts.add(n.asText());
                }
            }

            if (takeaways.isEmpty()) {
                takeaways = List.of(
                        "Dòng tiền tập trung vào các nhóm cổ phiếu cơ bản tốt và có triển vọng lợi nhuận tích cực.",
                        "Lãi suất liên ngân hàng và tỷ giá ngoại tệ duy trì trong biên độ kiểm soát của Ngân hàng Nhà nước.",
                        "Duy trì quỹ dự phòng khẩn cấp từ 3 - 6 tháng chi tiêu thiết yếu trước khi mở rộng danh mục đầu tư."
                );
            }

            if (prompts.isEmpty()) {
                prompts = List.of(
                        "Thị trường tài chính hôm nay diễn biến ra sao và tác động thế nào đến danh mục của tôi?",
                        "Tôi nên phân bổ dòng tiền tiết kiệm và đầu tư thế nào trong giai đoạn hiện tại?",
                        "Kiểm tra giúp tôi tiến độ ngân sách tháng này và cảnh báo các khoản chi tiêu lớn."
                );
            }

            return new AiMacroResult(summary, takeaways, prompts);
        } catch (Exception e) {
            log.warn("DailyIntelligenceService: Lỗi bóc tách JSON phản hồi từ Gemini: {}", e.getMessage());
            return generateFallbackMacroSynthesis(Collections.emptyList(), Collections.emptyList());
        }
    }

    private AiMacroResult generateFallbackMacroSynthesis(List<MarketPulseItemDto> marketPulse, List<HeadlineItemDto> headlines) {
        boolean isVnIndexUp = true;
        BigDecimal vnIndexChange = BigDecimal.ZERO;

        for (MarketPulseItemDto m : marketPulse) {
            if ("VNINDEX".equalsIgnoreCase(m.getCode())) {
                isVnIndexUp = m.isPositive();
                vnIndexChange = m.getPercentChange();
                break;
            }
        }

        String macroSummary;
        if (isVnIndexUp) {
            macroSummary = String.format(
                    "Thị trường tài chính khởi sắc với sắc xanh lan tỏa, chỉ số VN-Index ghi nhận mức tăng %s%% phản ánh tâm lý lạc quan từ các tín hiệu vĩ mô và dòng vốn tín dụng hỗ trợ sản xuất kinh doanh. Các kênh đầu tư duy trì thanh khoản ổn định, trong khi áp lực lạm phát và tỷ giá vẫn nằm trong tầm kiểm soát của cơ quan quản lý tiền tệ. Đây là thời điểm thuận lợi để người dùng rà soát lại cơ cấu dòng tiền, gia tăng tích lũy tài sản sinh lời song hành cùng duy trì hạn mức ngân sách an toàn.",
                    vnIndexChange.abs()
            );
        } else {
            macroSummary = String.format(
                    "Thị trường tài chính chứng kiến nhịp rung lắc tích lũy với chỉ số VN-Index điều chỉnh nhẹ %s%% dưới áp lực chốt lời ngắn hạn từ khối ngoại và tâm lý thận trọng trước các kỳ điều hành lãi suất quốc tế. Mặc dù vậy, bức tranh vĩ mô trong nước tiếp tục ghi nhận sự ổn định từ thặng dư thương mại và giải ngân vốn đầu tư công. Nhà đầu tư cá nhân được khuyến nghị kiên định với kế hoạch tài chính dài hạn, tránh mua đuổi trong các phiên hưng phấn và ưu tiên bảo toàn quỹ dự phòng khẩn cấp.",
                    vnIndexChange.abs()
            );
        }

        List<String> takeaways = List.of(
                "Chỉ số VN-Index " + (isVnIndexUp ? "giữ vững đà tăng trưởng, dòng tiền lan tỏa ở nhóm vốn hóa lớn." : "điều chỉnh tích lũy lành mạnh, thanh khoản giữ ở mức ổn định."),
                "Tỷ giá trung tâm và mặt bằng lãi suất tiền gửi ổn định, tạo môi trường thuận lợi cho tích lũy tài chính cá nhân.",
                "Ưu tiên rà soát định kỳ các mục tiêu ngân sách tháng để duy trì tỷ lệ thặng dư thu chi trên 20%."
        );

        List<String> suggestedPrompts = List.of(
                "Diễn biến thị trường hôm nay tác động thế nào đến kế hoạch tài chính cá nhân của tôi?",
                "Với xu hướng lãi suất và kinh tế hiện tại, tôi nên phân bổ tài sản thế nào cho an toàn?",
                "Tóm tắt giúp tôi những khoản chi tiêu chiếm tỷ trọng lớn nhất trong tháng này."
        );

        return new AiMacroResult(macroSummary, takeaways, suggestedPrompts);
    }

    private String writeJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            log.error("DailyIntelligenceService: Lỗi serialize JSON: {}", e.getMessage());
            return "[]";
        }
    }

    private <T> T readJsonList(String json, TypeReference<T> typeRef) {
        if (json == null || json.isBlank()) {
            try {
                return objectMapper.readValue("[]", typeRef);
            } catch (Exception e) {
                return null;
            }
        }
        try {
            return objectMapper.readValue(json, typeRef);
        } catch (Exception e) {
            log.warn("DailyIntelligenceService: Lỗi deserialize JSON: {}", e.getMessage());
            try {
                return objectMapper.readValue("[]", typeRef);
            } catch (Exception ex) {
                return null;
            }
        }
    }

    private static String loadPromptTemplate() {
        try {
            ClassPathResource resource = new ClassPathResource(PROMPT_PATH);
            try (InputStream is = resource.getInputStream()) {
                return new String(is.readAllBytes(), StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            return """
                    Bạn là Giám đốc Nghiên cứu Kinh tế vĩ mô & Cố vấn Tài chính trưởng của FinMan.
                    DỮ LIỆU ĐẦU VÀO:
                    1. DIỄN BIẾN THỊ TRƯỜNG:
                    {market_data}
                    2. TOP TIN TỨC:
                    {top_news}
                    Hãy tạo bản tổng hợp JSON:
                    {
                      "ai_macro_summary": "3-5 câu nhận định vĩ mô súc tích",
                      "key_takeaways": ["Ý 1", "Ý 2", "Ý 3"],
                      "suggested_prompts": ["Gợi ý 1", "Gợi ý 2", "Gợi ý 3"]
                    }
                    """;
        }
    }

    public record AiMacroResult(String aiMacroSummary, List<String> keyTakeaways, List<String> suggestedPrompts) {}
}
