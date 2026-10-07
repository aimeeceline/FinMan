package com.finman.service;

import com.finman.dto.request.RecycleBinActionRequest;
import com.finman.dto.response.RecycleBinItemResponse;
import com.finman.entity.Account;
import com.finman.entity.Budget;
import com.finman.entity.Category;
import com.finman.entity.Transaction;
import com.finman.entity.enums.CategoryType;
import com.finman.repository.AccountRepository;
import com.finman.repository.BudgetRepository;
import com.finman.repository.CategoryRepository;
import com.finman.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class RecycleBinService {

    private static final Logger log = LoggerFactory.getLogger(RecycleBinService.class);

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final BudgetRepository budgetRepository;
    private final AccountRepository accountRepository;
    private final TransactionService transactionService;

    public RecycleBinService(TransactionRepository transactionRepository,
                             CategoryRepository categoryRepository,
                             BudgetRepository budgetRepository,
                             AccountRepository accountRepository,
                             TransactionService transactionService) {
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
        this.budgetRepository = budgetRepository;
        this.accountRepository = accountRepository;
        this.transactionService = transactionService;
    }

    @Transactional(readOnly = true)
    public List<RecycleBinItemResponse> getItems(Long userId, String typeFilter) {
        List<RecycleBinItemResponse> results = new ArrayList<>();

        boolean fetchAll = typeFilter == null || typeFilter.isBlank() || "ALL".equalsIgnoreCase(typeFilter);

        // 1. Transactions
        if (fetchAll || "TRANSACTION".equalsIgnoreCase(typeFilter)) {
            List<Transaction> deletedTx = transactionRepository.findRecycleBinTransactions(userId);
            for (Transaction tx : deletedTx) {
                String title = (tx.getCategory() != null) ? tx.getCategory().getName() : (tx.getNote() != null && !tx.getNote().isBlank() ? tx.getNote() : "Giao dịch");
                String subtitle = tx.getTransactionDate() != null ? tx.getTransactionDate().toString() : "";
                if (tx.getAccount() != null) {
                    subtitle += " (" + tx.getAccount().getName() + ")";
                }
                String icon = (tx.getCategory() != null && tx.getCategory().getIcon() != null) ? tx.getCategory().getIcon() : "receipt";
                results.add(new RecycleBinItemResponse(
                        tx.getId(),
                        "TRANSACTION",
                        title,
                        subtitle,
                        tx.getAmount(),
                        icon,
                        tx.getDeletedAt(),
                        tx.getNote()
                ));
            }
        }

        // 2. Categories
        if (fetchAll || "CATEGORY".equalsIgnoreCase(typeFilter)) {
            List<Category> deletedCats = categoryRepository.findRecycleBinCategories(userId);
            for (Category cat : deletedCats) {
                String sub = (cat.getType() == CategoryType.EXPENSE) ? "Danh mục Chi tiêu" : "Danh mục Thu nhập";
                results.add(new RecycleBinItemResponse(
                        cat.getId(),
                        "CATEGORY",
                        cat.getName(),
                        sub,
                        null,
                        cat.getIcon(),
                        cat.getDeletedAt(),
                        null
                ));
            }
        }

        // 3. Budgets
        if (fetchAll || "BUDGET".equalsIgnoreCase(typeFilter)) {
            List<Budget> deletedBudgets = budgetRepository.findRecycleBinBudgets(userId);
            for (Budget b : deletedBudgets) {
                String catName = (b.getCategory() != null) ? b.getCategory().getName() : "Không danh mục";
                String title = "Ngân sách " + catName;
                String subtitle = "Tháng " + (b.getMonth() != null ? b.getMonth() : "");
                String icon = (b.getCategory() != null && b.getCategory().getIcon() != null) ? b.getCategory().getIcon() : "chart-pie";
                results.add(new RecycleBinItemResponse(
                        b.getId(),
                        "BUDGET",
                        title,
                        subtitle,
                        b.getAmount(),
                        icon,
                        b.getDeletedAt(),
                        null
                ));
            }
        }

        // 4. Accounts
        if (fetchAll || "ACCOUNT".equalsIgnoreCase(typeFilter)) {
            List<Account> deletedAccounts = accountRepository.findRecycleBinAccounts(userId);
            for (Account acc : deletedAccounts) {
                String title = acc.getName();
                String subtitle = "Tài khoản (" + acc.getType() + ")";
                results.add(new RecycleBinItemResponse(
                        acc.getId(),
                        "ACCOUNT",
                        title,
                        subtitle,
                        acc.getCurrentBalance(),
                        "wallet",
                        acc.getDeletedAt(),
                        acc.getAccountNumber()
                ));
            }
        }

        // Sắp xếp thời gian xóa mới nhất lên đầu
        results.sort(Comparator.comparing(RecycleBinItemResponse::getDeletedAt, Comparator.nullsLast(Comparator.reverseOrder())));
        return results;
    }

    @Transactional
    public void restore(Long userId, RecycleBinActionRequest request) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            return;
        }

        for (RecycleBinActionRequest.TargetItem item : request.getItems()) {
            if (item.getId() == null || item.getType() == null) continue;

            String type = item.getType().toUpperCase();
            Long id = item.getId();

            switch (type) {
                case "TRANSACTION" -> {
                    Optional<Transaction> txOpt = transactionRepository.findDeletedByIdAndUserId(id, userId);
                    if (txOpt.isPresent()) {
                        Transaction tx = txOpt.get();
                        transactionService.reapplyTransactionBalanceImpact(tx);
                        transactionRepository.restoreTransaction(id, userId);
                    }
                }
                case "CATEGORY" -> {
                    Optional<Category> catOpt = categoryRepository.findByIdAndUserId(id, userId);
                    if (catOpt.isPresent()) {
                        Category cat = catOpt.get();
                        cat.setDeletedAt(null);
                        cat.setIsPurgedFromBin(false);
                        categoryRepository.save(cat);
                    }
                }
                case "BUDGET" -> {
                    budgetRepository.restoreBudget(id, userId);
                }
                case "ACCOUNT" -> {
                    Optional<Account> accOpt = accountRepository.findByIdAndUserId(id, userId);
                    if (accOpt.isPresent()) {
                        Account acc = accOpt.get();
                        acc.setDeletedAt(null);
                        acc.setIsArchived(false);
                        acc.setIsPurgedFromBin(false);
                        accountRepository.save(acc);
                    }
                }
            }
        }
    }

    @Transactional
    public void permanentDelete(Long userId, RecycleBinActionRequest request) {
        List<RecycleBinActionRequest.TargetItem> targets = new ArrayList<>();

        if (Boolean.TRUE.equals(request.getEmptyAll())) {
            // Lấy tất cả trong thùng rác của user
            List<RecycleBinItemResponse> allItems = getItems(userId, "ALL");
            for (RecycleBinItemResponse item : allItems) {
                targets.add(new RecycleBinActionRequest.TargetItem(item.getId(), item.getType()));
            }
        } else if (request.getItems() != null) {
            targets.addAll(request.getItems());
        }

        for (RecycleBinActionRequest.TargetItem item : targets) {
            if (item.getId() == null || item.getType() == null) continue;

            String type = item.getType().toUpperCase();
            Long id = item.getId();

            switch (type) {
                case "TRANSACTION" -> {
                    transactionRepository.hardDeleteTransaction(id, userId);
                }
                case "BUDGET" -> {
                    budgetRepository.hardDeleteBudget(id, userId);
                }
                case "CATEGORY" -> {
                    purgeCategory(id, userId);
                }
                case "ACCOUNT" -> {
                    purgeAccount(id, userId);
                }
            }
        }
    }

    /**
     * Logic xóa vĩnh viễn Category theo quy tắc nghiệp vụ:
     * - Nếu không có giao dịch và budget liên quan: hard delete khỏi DB.
     * - Nếu có budget nhưng CHƯA HỀ có giao dịch nào: xóa luôn budget và hard delete category.
     * - Nếu có giao dịch: ẩn khỏi thùng rác (is_purged_from_bin = true), giữ trong DB để giao dịch hiển thị 'Thuộc danh mục abc đã bị xóa'.
     */
    private void purgeCategory(Long categoryId, Long userId) {
        Optional<Category> catOpt = categoryRepository.findByIdAndUserId(categoryId, userId);
        if (catOpt.isEmpty()) return;
        Category cat = catOpt.get();

        long txCount = transactionRepository.countAllByCategoryId(categoryId);
        if (txCount == 0) {
            // Không có giao dịch: Xóa ngân sách gắn với danh mục nếu có, rồi xóa vĩnh viễn category
            budgetRepository.hardDeleteByCategoryId(categoryId);
            categoryRepository.delete(cat);
        } else {
            // Có giao dịch liên quan: Ẩn khỏi thùng rác nhưng giữ trong DB
            cat.setIsPurgedFromBin(true);
            categoryRepository.save(cat);
        }
    }

    /**
     * Logic xóa vĩnh viễn Account theo quy tắc nghiệp vụ:
     * - Nếu không có giao dịch: hard delete khỏi DB.
     * - Nếu có giao dịch: ẩn khỏi thùng rác (is_purged_from_bin = true), giữ trong DB để giao dịch hiển thị 'Thuộc tài khoản abc đã bị xóa'.
     */
    private void purgeAccount(Long accountId, Long userId) {
        Optional<Account> accOpt = accountRepository.findByIdAndUserId(accountId, userId);
        if (accOpt.isEmpty()) return;
        Account acc = accOpt.get();

        long txCount = transactionRepository.countAllByAccountId(accountId);
        if (txCount == 0) {
            accountRepository.delete(acc);
        } else {
            acc.setIsPurgedFromBin(true);
            accountRepository.save(acc);
        }
    }

    /**
     * Tự động xóa vĩnh viễn các mục trong thùng rác đã xóa quá 15 ngày (chạy định kỳ mỗi 2h sáng).
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void scheduledPurgeExpiredItems() {
        log.info("Bắt đầu tiến trình tự động dọn dẹp thùng rác (15 ngày)...");
        Instant threshold = Instant.now().minus(15, ChronoUnit.DAYS);

        // 1. Transaction
        transactionRepository.purgeExpiredTransactions(threshold);

        // 2. Budget
        budgetRepository.purgeExpiredBudgets(threshold);

        // 3. Category
        List<Category> expiredCats = categoryRepository.findExpiredBinCategories(threshold);
        for (Category cat : expiredCats) {
            if (cat.getUser() != null) {
                purgeCategory(cat.getId(), cat.getUser().getId());
            }
        }

        // 4. Account
        List<Account> expiredAccs = accountRepository.findExpiredBinAccounts(threshold);
        for (Account acc : expiredAccs) {
            if (acc.getUser() != null) {
                purgeAccount(acc.getId(), acc.getUser().getId());
            }
        }

        log.info("Hoàn tất tiến trình tự động dọn dẹp thùng rác.");
    }
}
