package com.finman.service;

import com.finman.dto.request.TransactionCreateRequest;
import com.finman.dto.request.TransactionUpdateRequest;
import com.finman.dto.response.TransactionResponse;
import com.finman.dto.response.TransactionSummaryResponse;
import com.finman.entity.Account;
import com.finman.entity.Category;
import com.finman.entity.Transaction;
import com.finman.entity.User;
import com.finman.entity.enums.AccountType;
import com.finman.entity.enums.TransactionType;
import com.finman.exception.BusinessValidationException;
import com.finman.exception.ResourceNotFoundException;
import com.finman.repository.AccountRepository;
import com.finman.repository.CategoryRepository;
import com.finman.repository.TransactionRepository;
import com.finman.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public TransactionService(
            TransactionRepository transactionRepository,
            AccountRepository accountRepository,
            CategoryRepository categoryRepository,
            UserRepository userRepository) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public TransactionResponse createTransaction(Long userId, TransactionCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        if (request.getAmount() == null || request.getAmount() <= 0) {
            throw new BusinessValidationException("Số tiền giao dịch phải lớn hơn 0");
        }

        Account account = accountRepository.findByIdAndUserId(request.getAccountId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại hoặc bạn không có quyền truy cập"));

        if (Boolean.TRUE.equals(account.getIsArchived())) {
            throw new BusinessValidationException("Không thể ghi nhận giao dịch cho tài khoản đã lưu trữ");
        }

        Category category = categoryRepository.findAccessibleCategory(request.getCategoryId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục không tồn tại hoặc bạn không có quyền truy cập"));

        if (!request.getType().name().equals(category.getType().name())) {
            throw new BusinessValidationException("Loại giao dịch (" + request.getType() + ") không khớp với loại danh mục (" + category.getType() + ")");
        }

        // Cập nhật số dư tài khoản tương ứng
        applyBalanceImpact(account, request.getType(), request.getAmount());
        accountRepository.save(account);

        Transaction transaction = new Transaction(
                user,
                account,
                category,
                request.getType(),
                request.getAmount(),
                request.getTransactionDate(),
                request.getNote() != null ? request.getNote().trim() : null
        );

        Transaction saved = transactionRepository.save(transaction);
        return TransactionResponse.from(saved);
    }

    @Transactional
    public TransactionResponse updateTransaction(Long userId, Long transactionId, TransactionUpdateRequest request) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Giao dịch không tồn tại hoặc bạn không có quyền truy cập"));

        if (request.getAmount() == null || request.getAmount() <= 0) {
            throw new BusinessValidationException("Số tiền giao dịch phải lớn hơn 0");
        }

        Account currentAccount = transaction.getAccount();
        // 1. Hoàn tác tác động số dư của giao dịch cũ
        revertBalanceImpact(currentAccount, transaction.getType(), transaction.getAmount());

        // 2. Xác thực tài khoản mới (nếu đổi)
        Account targetAccount = currentAccount;
        if (!currentAccount.getId().equals(request.getAccountId())) {
            targetAccount = accountRepository.findByIdAndUserId(request.getAccountId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Tài khoản đích không tồn tại hoặc bạn không có quyền truy cập"));

            if (Boolean.TRUE.equals(targetAccount.getIsArchived())) {
                throw new BusinessValidationException("Không thể chuyển giao dịch sang tài khoản đã lưu trữ");
            }
            // Lưu lại số dư ví cũ đã hoàn tác
            accountRepository.save(currentAccount);
        }

        Category category = categoryRepository.findAccessibleCategory(request.getCategoryId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục không tồn tại hoặc bạn không có quyền truy cập"));

        if (!request.getType().name().equals(category.getType().name())) {
            throw new BusinessValidationException("Loại giao dịch (" + request.getType() + ") không khớp với loại danh mục (" + category.getType() + ")");
        }

        // 3. Áp dụng tác động số dư mới cho tài khoản đích
        applyBalanceImpact(targetAccount, request.getType(), request.getAmount());
        accountRepository.save(targetAccount);

        // 4. Cập nhật các trường dữ liệu
        transaction.setAccount(targetAccount);
        transaction.setCategory(category);
        transaction.setType(request.getType());
        transaction.setAmount(request.getAmount());
        transaction.setTransactionDate(request.getTransactionDate());
        transaction.setNote(request.getNote() != null ? request.getNote().trim() : null);

        Transaction updated = transactionRepository.save(transaction);
        return TransactionResponse.from(updated);
    }

    @Transactional
    public void deleteTransaction(Long userId, Long transactionId) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Giao dịch không tồn tại hoặc bạn không có quyền truy cập"));

        Account account = transaction.getAccount();
        // Hoàn tác số dư của giao dịch khi bị xóa
        revertBalanceImpact(account, transaction.getType(), transaction.getAmount());
        accountRepository.save(account);

        transactionRepository.delete(transaction);
    }

    @Transactional(readOnly = true)
    public TransactionResponse getTransactionById(Long userId, Long transactionId) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Giao dịch không tồn tại hoặc bạn không có quyền truy cập"));
        return TransactionResponse.from(transaction);
    }

    @Transactional(readOnly = true)
    public Page<TransactionResponse> getTransactions(
            Long userId,
            String month,
            LocalDate startDate,
            LocalDate endDate,
            Long accountId,
            Long categoryId,
            TransactionType type,
            String search,
            Pageable pageable) {

        DateRange range = resolveDateRange(month, startDate, endDate);

        Specification<Transaction> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Phân quyền User (Multi-tenant)
            predicates.add(cb.equal(root.get("user").get("id"), userId));

            // 2. Khoảng ngày
            if (range.startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("transactionDate"), range.startDate));
            }
            if (range.endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("transactionDate"), range.endDate));
            }

            // 3. Ví / Tài khoản
            if (accountId != null) {
                predicates.add(cb.equal(root.get("account").get("id"), accountId));
            }

            // 4. Danh mục
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            // 5. Loại giao dịch (INCOME / EXPENSE)
            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }

            // 6. Tìm kiếm từ khóa (trong note hoặc tên category)
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate noteLike = cb.like(cb.lower(root.get("note")), pattern);
                Predicate catLike = cb.like(cb.lower(root.get("category").get("name")), pattern);
                predicates.add(cb.or(noteLike, catLike));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        // Mặc định sắp xếp theo ngày giao dịch giảm dần và ID giảm dần
        Pageable effectivePageable = pageable.getSort().isSorted()
                ? pageable
                : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "transactionDate", "id"));

        return transactionRepository.findAll(spec, effectivePageable)
                .map(TransactionResponse::from);
    }

    @Transactional(readOnly = true)
    public TransactionSummaryResponse getTransactionSummary(
            Long userId,
            String month,
            LocalDate startDate,
            LocalDate endDate,
            Long accountId) {

        DateRange range = resolveDateRange(month, startDate, endDate);
        LocalDate sDate = range.startDate != null ? range.startDate : LocalDate.of(1970, 1, 1);
        LocalDate eDate = range.endDate != null ? range.endDate : LocalDate.of(2099, 12, 31);

        Long totalIncome;
        Long totalExpense;
        Long totalCount;

        if (accountId != null) {
            totalIncome = transactionRepository.sumAmountByUserIdAndAccountIdAndTypeAndDateBetween(
                    userId, accountId, TransactionType.INCOME, sDate, eDate);
            totalExpense = transactionRepository.sumAmountByUserIdAndAccountIdAndTypeAndDateBetween(
                    userId, accountId, TransactionType.EXPENSE, sDate, eDate);
            totalCount = transactionRepository.countByUserIdAndDateBetween(userId, sDate, eDate);
        } else {
            totalIncome = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                    userId, TransactionType.INCOME, sDate, eDate);
            totalExpense = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                    userId, TransactionType.EXPENSE, sDate, eDate);
            totalCount = transactionRepository.countByUserIdAndDateBetween(userId, sDate, eDate);
        }

        long netFlow = (totalIncome != null ? totalIncome : 0L) - (totalExpense != null ? totalExpense : 0L);
        return new TransactionSummaryResponse(totalIncome, totalExpense, netFlow, totalCount);
    }

    /**
     * Áp dụng thay đổi số dư theo từng loại tài khoản.
     */
    private void applyBalanceImpact(Account account, TransactionType type, Long amount) {
        if (account.getType() == AccountType.CREDIT_CARD) {
            // Với thẻ tín dụng, currentBalance đại diện cho dư nợ
            if (type == TransactionType.EXPENSE) {
                account.setCurrentBalance(account.getCurrentBalance() + amount);
            } else if (type == TransactionType.INCOME) {
                account.setCurrentBalance(account.getCurrentBalance() - amount);
            }
        } else {
            // Với ví tiền mặt và ngân hàng, currentBalance là tài sản khả dụng
            if (type == TransactionType.INCOME) {
                account.setCurrentBalance(account.getCurrentBalance() + amount);
            } else if (type == TransactionType.EXPENSE) {
                account.setCurrentBalance(account.getCurrentBalance() - amount);
            }
        }
    }

    /**
     * Hoàn tác số dư giao dịch cũ theo từng loại tài khoản.
     */
    private void revertBalanceImpact(Account account, TransactionType type, Long amount) {
        if (account.getType() == AccountType.CREDIT_CARD) {
            if (type == TransactionType.EXPENSE) {
                account.setCurrentBalance(account.getCurrentBalance() - amount);
            } else if (type == TransactionType.INCOME) {
                account.setCurrentBalance(account.getCurrentBalance() + amount);
            }
        } else {
            if (type == TransactionType.INCOME) {
                account.setCurrentBalance(account.getCurrentBalance() - amount);
            } else if (type == TransactionType.EXPENSE) {
                account.setCurrentBalance(account.getCurrentBalance() + amount);
            }
        }
    }

    /**
     * Xác định khoảng ngày bắt đầu và kết thúc từ tham số month hoặc startDate/endDate.
     */
    private DateRange resolveDateRange(String month, LocalDate startDate, LocalDate endDate) {
        LocalDate resolvedStart = startDate;
        LocalDate resolvedEnd = endDate;

        if (month != null && !month.isBlank()) {
            try {
                YearMonth ym = YearMonth.parse(month.trim());
                if (resolvedStart == null) {
                    resolvedStart = ym.atDay(1);
                }
                if (resolvedEnd == null) {
                    resolvedEnd = ym.atEndOfMonth();
                }
            } catch (Exception ignored) {
            }
        }

        return new DateRange(resolvedStart, resolvedEnd);
    }

    private static class DateRange {
        final LocalDate startDate;
        final LocalDate endDate;

        DateRange(LocalDate startDate, LocalDate endDate) {
            this.startDate = startDate;
            this.endDate = endDate;
        }
    }
}
