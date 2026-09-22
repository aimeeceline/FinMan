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

@Service
@Transactional(readOnly = true)
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    public AccountService(AccountRepository accountRepository, UserRepository userRepository) {
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
    }

    public AccountSummaryResponse getAccountsSummary(Long userId) {
        List<Account> accounts = accountRepository.findByUserIdAndIsArchivedFalse(userId);

        long totalAssets = 0L;
        long totalLiabilities = 0L;

        for (Account acc : accounts) {
            if (acc.getType() == AccountType.CREDIT_CARD) {
                totalLiabilities += acc.getCurrentBalance();
            } else {
                totalAssets += acc.getCurrentBalance();
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
        if (accountRepository.existsByUserIdAndNameIgnoreCase(userId, name)) {
            throw new BusinessValidationException("Tên tài khoản '" + name + "' đã tồn tại");
        }

        Long initialBalance = request.getInitialBalance() != null ? request.getInitialBalance() : 0L;
        if (request.getType() != AccountType.CREDIT_CARD && initialBalance < 0) {
            throw new BusinessValidationException("Số dư ban đầu của ví tiền mặt / tài khoản ngân hàng không được âm");
        }

        Account account = new Account(user, name, request.getType(), initialBalance);
        if (request.getAccountNumber() != null && !request.getAccountNumber().isBlank()) {
            account.setAccountNumber(request.getAccountNumber().trim());
        }
        if (request.getType() == AccountType.CREDIT_CARD && request.getCreditLimit() != null) {
            account.setCreditLimit(request.getCreditLimit());
        }

        Account saved = accountRepository.save(account);
        return AccountResponse.from(saved);
    }

    @Transactional
    public AccountResponse updateAccount(Long userId, Long accountId, AccountUpdateRequest request) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại hoặc bạn không có quyền truy cập"));

        String newName = request.getName().trim();
        if (!account.getName().equalsIgnoreCase(newName) && accountRepository.existsByUserIdAndNameIgnoreCase(userId, newName)) {
            throw new BusinessValidationException("Tên tài khoản '" + newName + "' đã tồn tại");
        }

        account.setName(newName);

        if (request.getAccountNumber() != null) {
            account.setAccountNumber(request.getAccountNumber().trim());
        }

        if (request.getCreditLimit() != null) {
            account.setCreditLimit(request.getCreditLimit());
        }

        if (request.getIsArchived() != null) {
            account.setIsArchived(request.getIsArchived());
        }

        Account updated = accountRepository.save(account);
        return AccountResponse.from(updated);
    }

    @Transactional
    public void deleteAccount(Long userId, Long accountId) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại hoặc bạn không có quyền truy cập"));

        // Soft delete / archive to preserve ledger consistency
        account.setIsArchived(true);
        accountRepository.save(account);
    }
}
