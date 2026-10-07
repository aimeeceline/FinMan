package com.finman.service;

import com.finman.dto.request.AccountCreateRequest;
import com.finman.dto.request.AccountUpdateRequest;
import com.finman.dto.response.AccountResponse;
import com.finman.dto.response.AccountSummaryResponse;
import com.finman.entity.Account;
import com.finman.entity.User;
import com.finman.entity.enums.AccountType;
import com.finman.exception.BusinessValidationException;
import com.finman.exception.ResourceNotFoundException;
import com.finman.repository.AccountRepository;
import com.finman.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    public AccountService(AccountRepository accountRepository, UserRepository userRepository) {
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public AccountSummaryResponse getAccountsSummary(Long userId) {
        return getAccountsSummary(userId, false);
    }

    @Transactional
    public AccountSummaryResponse getAccountsSummary(Long userId, Boolean includeArchived) {
        List<Account> accounts = Boolean.TRUE.equals(includeArchived)
                ? accountRepository.findByUserIdAndDeletedAtIsNull(userId)
                : accountRepository.findByUserIdAndIsArchivedFalseAndDeletedAtIsNull(userId);

        // Mặc định luôn có Ví tiền mặt: Nếu người dùng chưa có bất kỳ tài khoản nào, tự động tạo "Ví tiền mặt"
        if (accounts.isEmpty() && !Boolean.TRUE.equals(includeArchived)) {
            List<Account> allUserAccounts = accountRepository.findByUserId(userId);
            if (allUserAccounts.isEmpty()) {
                Optional<User> userOpt = userRepository.findById(userId);
                if (userOpt.isPresent()) {
                    Account defaultCash = new Account(userOpt.get(), "Ví tiền mặt", AccountType.CASH, 0L);
                    Account saved = accountRepository.save(defaultCash);
                    accounts = List.of(saved);
                }
            }
        }

        long totalAssets = 0L;
        long totalLiabilities = 0L;

        for (Account acc : accounts) {
            // Archived accounts do not contribute to active net worth/liabilities unless viewing all
            if (!acc.getIsArchived()) {
                long bal = acc.getCurrentBalance() != null ? acc.getCurrentBalance() : 0L;
                if (acc.getType() == AccountType.CREDIT_CARD) {
                    if (bal >= 0) {
                        totalLiabilities += bal;
                    } else {
                        totalAssets += Math.abs(bal);
                    }
                } else {
                    if (bal >= 0) {
                        totalAssets += bal;
                    } else {
                        totalLiabilities += Math.abs(bal);
                    }
                }
            }
        }

        long netWorth = totalAssets - totalLiabilities;
        List<AccountResponse> responseList = accounts.stream()
                .map(AccountResponse::from)
                .toList();

        return new AccountSummaryResponse(totalAssets, totalLiabilities, netWorth, responseList);
    }

    public AccountResponse getAccountById(Long userId, Long accountId) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại hoặc bạn không có quyền truy cập"));
        return AccountResponse.from(account);
    }

    @Transactional
    public AccountResponse createAccount(Long userId, AccountCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        String name = request.getName().trim();
        if (accountRepository.existsByUserIdAndNameIgnoreCaseAndDeletedAtIsNull(userId, name)) {
            throw new BusinessValidationException("Tên tài khoản '" + name + "' đã tồn tại");
        }

        Long initialBalance = request.getInitialBalance() != null ? request.getInitialBalance() : 0L;
        if (request.getType() != AccountType.CREDIT_CARD && initialBalance < 0) {
            throw new BusinessValidationException("Số dư ban đầu của tài khoản không được âm");
        }

        Account account = new Account(user, name, request.getType(), initialBalance);
        if (request.getAccountNumber() != null && !request.getAccountNumber().isBlank()) {
            account.setAccountNumber(request.getAccountNumber().trim());
        }
        if (request.getNote() != null && !request.getNote().isBlank()) {
            account.setNote(request.getNote().trim());
        }
        if (request.getType() == AccountType.CREDIT_CARD && request.getCreditLimit() != null) {
            account.setCreditLimit(request.getCreditLimit());
        }
        if (request.getType() == AccountType.CREDIT_CARD) {
            if (request.getStatementDay() != null) {
                account.setStatementDay(request.getStatementDay());
            }
            if (request.getPaymentDueDay() != null) {
                account.setPaymentDueDay(request.getPaymentDueDay());
            }
            if (request.getPaymentAccountId() != null) {
                account.setPaymentAccountId(request.getPaymentAccountId());
            }
            if (request.getIsAutoPayment() != null) {
                account.setIsAutoPayment(request.getIsAutoPayment());
            }
        }

        Account saved = accountRepository.save(account);
        return AccountResponse.from(saved);
    }

    @Transactional
    public AccountResponse updateAccount(Long userId, Long accountId, AccountUpdateRequest request) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại hoặc bạn không có quyền truy cập"));

        String newName = request.getName().trim();
        if (!account.getName().equalsIgnoreCase(newName) && accountRepository.existsByUserIdAndNameIgnoreCaseAndDeletedAtIsNull(userId, newName)) {
            throw new BusinessValidationException("Tên tài khoản '" + newName + "' đã tồn tại");
        }

        account.setName(newName);

        if (request.getAccountNumber() != null) {
            account.setAccountNumber(request.getAccountNumber().trim());
        }

        if (request.getNote() != null) {
            account.setNote(request.getNote().trim());
        }

        if (request.getCreditLimit() != null) {
            account.setCreditLimit(request.getCreditLimit());
        }

        if (request.getStatementDay() != null) {
            account.setStatementDay(request.getStatementDay());
        }

        if (request.getPaymentDueDay() != null) {
            account.setPaymentDueDay(request.getPaymentDueDay());
        }

        if (request.getPaymentAccountId() != null) {
            account.setPaymentAccountId(request.getPaymentAccountId());
        }

        if (request.getIsAutoPayment() != null) {
            account.setIsAutoPayment(request.getIsAutoPayment());
        }

        if (request.getIsArchived() != null) {
            account.setIsArchived(request.getIsArchived());
        }

        Account updated = accountRepository.save(account);
        return AccountResponse.from(updated);
    }

    @Transactional
    public AccountResponse archiveAccount(Long userId, Long accountId, boolean archive) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại hoặc bạn không có quyền truy cập"));

        account.setIsArchived(archive);
        Account updated = accountRepository.save(account);
        return AccountResponse.from(updated);
    }

    @Transactional
    public void deleteAccount(Long userId, Long accountId) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại hoặc bạn không có quyền truy cập"));
        account.setDeletedAt(java.time.Instant.now());
        account.setIsArchived(true);
        account.setIsPurgedFromBin(false);
        accountRepository.save(account);
    }
}
