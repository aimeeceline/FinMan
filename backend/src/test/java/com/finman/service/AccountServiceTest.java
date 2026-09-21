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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AccountService accountService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("user1@example.com");
        testUser.setFullName("Người Dùng 1");
    }

    @Test
    @DisplayName("TC_ACC_01: Tạo ví Tiền mặt / Ngân hàng thành công")
    void testCreateAccount_CashBank_Success() {
        AccountCreateRequest request = new AccountCreateRequest("Vietcombank", AccountType.BANK, 5_000_000L, 0L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(accountRepository.existsByUserIdAndNameIgnoreCase(1L, "Vietcombank")).thenReturn(false);

        Account savedAccount = new Account(testUser, "Vietcombank", AccountType.BANK, 5_000_000L);
        savedAccount.setId(10L);
        when(accountRepository.save(any(Account.class))).thenReturn(savedAccount);

        AccountResponse response = accountService.createAccount(1L, request);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals("Vietcombank", response.getName());
        assertEquals(AccountType.BANK, response.getType());
        assertEquals(5_000_000L, response.getInitialBalance());
        assertEquals(5_000_000L, response.getCurrentBalance());
        verify(accountRepository).save(any(Account.class));
    }

    @Test
    @DisplayName("TC_ACC_02: Tạo Thẻ tín dụng thành công với hạn mức và dư nợ ban đầu")
    void testCreateAccount_CreditCard_Success() {
        AccountCreateRequest request = new AccountCreateRequest("Techcombank Visa", AccountType.CREDIT_CARD, 0L, 20_000_000L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(accountRepository.existsByUserIdAndNameIgnoreCase(1L, "Techcombank Visa")).thenReturn(false);

        Account savedAccount = new Account(testUser, "Techcombank Visa", AccountType.CREDIT_CARD, 0L);
        savedAccount.setId(11L);
        savedAccount.setCreditLimit(20_000_000L);
        when(accountRepository.save(any(Account.class))).thenReturn(savedAccount);

        AccountResponse response = accountService.createAccount(1L, request);

        assertNotNull(response);
        assertEquals(11L, response.getId());
        assertEquals(AccountType.CREDIT_CARD, response.getType());
        assertEquals(20_000_000L, response.getCreditLimit());
    }

    @Test
    @DisplayName("Tạo tài khoản bị trùng tên ném BusinessValidationException")
    void testCreateAccount_DuplicateName_ThrowsException() {
        AccountCreateRequest request = new AccountCreateRequest("Tiền mặt", AccountType.CASH, 100_000L, 0L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(accountRepository.existsByUserIdAndNameIgnoreCase(1L, "Tiền mặt")).thenReturn(true);

        BusinessValidationException ex = assertThrows(BusinessValidationException.class,
                () -> accountService.createAccount(1L, request));

        assertTrue(ex.getMessage().contains("đã tồn tại"));
        verify(accountRepository, never()).save(any());
    }

    @Test
    @DisplayName("Tạo ví tiền mặt với số dư ban đầu âm ném BusinessValidationException")
    void testCreateAccount_NegativeInitialBalance_ThrowsException() {
        AccountCreateRequest request = new AccountCreateRequest("Tiền mặt", AccountType.CASH, -500_000L, 0L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(accountRepository.existsByUserIdAndNameIgnoreCase(1L, "Tiền mặt")).thenReturn(false);

        BusinessValidationException ex = assertThrows(BusinessValidationException.class,
                () -> accountService.createAccount(1L, request));

        assertTrue(ex.getMessage().contains("không được âm"));
    }

    @Test
    @DisplayName("TC_ACC_03: Tính toán Tài sản ròng (Net Worth = Assets - Liabilities)")
    void testGetAccountsSummary_CalculatesNetWorthCorrectly() {
        Account cash = new Account(testUser, "Tiền mặt", AccountType.CASH, 2_000_000L);
        cash.setId(1L);
        cash.setCurrentBalance(2_000_000L);

        Account bank = new Account(testUser, "VPBank", AccountType.BANK, 5_000_000L);
        bank.setId(2L);
        bank.setCurrentBalance(5_000_000L);

        Account credit = new Account(testUser, "HSBC Visa", AccountType.CREDIT_CARD, 0L);
        credit.setId(3L);
        credit.setCurrentBalance(1_500_000L); // Dư nợ 1.5M

        when(accountRepository.findByUserIdAndIsArchivedFalse(1L)).thenReturn(List.of(cash, bank, credit));

        AccountSummaryResponse summary = accountService.getAccountsSummary(1L);

        assertNotNull(summary);
        assertEquals(3, summary.getAccounts().size());
        assertEquals(7_000_000L, summary.getTotalAssets());      // 2M + 5M
        assertEquals(1_500_000L, summary.getTotalLiabilities()); // 1.5M
        assertEquals(5_500_000L, summary.getNetWorth());         // 7M - 1.5M
    }

    @Test
    @DisplayName("TC_ACC_04: Xóa tài khoản (chuyển isArchived = true) bảo toàn sổ cái")
    void testDeleteAccount_SoftDeleteArchive() {
        Account account = new Account(testUser, "Ví cũ", AccountType.CASH, 1_000_000L);
        account.setId(20L);
        account.setIsArchived(false);

        when(accountRepository.findByIdAndUserId(20L, 1L)).thenReturn(Optional.of(account));
        when(accountRepository.save(any(Account.class))).thenReturn(account);

        accountService.deleteAccount(1L, 20L);

        assertTrue(account.getIsArchived());
        verify(accountRepository).save(account);
    }

    @Test
    @DisplayName("TC_ACC_05: Multi-tenant - Không thể truy cập tài khoản của người dùng khác")
    void testMultiTenant_CannotAccessOtherUserAccount() {
        when(accountRepository.findByIdAndUserId(999L, 1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> accountService.getAccountById(1L, 999L));
        assertThrows(ResourceNotFoundException.class, () -> accountService.deleteAccount(1L, 999L));
    }

    @Test
    @DisplayName("Cập nhật tài khoản thành công")
    void testUpdateAccount_Success() {
        Account account = new Account(testUser, "Tên cũ", AccountType.CASH, 500_000L);
        account.setId(30L);

        when(accountRepository.findByIdAndUserId(30L, 1L)).thenReturn(Optional.of(account));
        when(accountRepository.existsByUserIdAndNameIgnoreCase(1L, "Tên mới")).thenReturn(false);
        when(accountRepository.save(any(Account.class))).thenReturn(account);

        AccountUpdateRequest request = new AccountUpdateRequest("Tên mới", 0L, false);
        AccountResponse response = accountService.updateAccount(1L, 30L, request);

        assertNotNull(response);
        assertEquals("Tên mới", account.getName());
    }
}
