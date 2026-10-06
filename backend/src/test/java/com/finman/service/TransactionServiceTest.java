package com.finman.service;

import com.finman.dto.request.TransactionCreateRequest;
import com.finman.dto.request.TransactionUpdateRequest;
import com.finman.dto.response.TransactionResponse;
import com.finman.entity.Account;
import com.finman.entity.Category;
import com.finman.entity.Transaction;
import com.finman.entity.User;
import com.finman.entity.enums.AccountType;
import com.finman.entity.enums.CategoryType;
import com.finman.entity.enums.TransactionType;
import com.finman.exception.BusinessValidationException;
import com.finman.exception.ResourceNotFoundException;
import com.finman.repository.AccountRepository;
import com.finman.repository.CategoryRepository;
import com.finman.repository.TransactionRepository;
import com.finman.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TransactionService transactionService;

    private User testUser;
    private Account testCashAccount;
    private Account testCreditAccount;
    private Category testExpenseCategory;
    private Category testIncomeCategory;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("user1@example.com");

        testCashAccount = new Account(testUser, "Tiền mặt", AccountType.CASH, 3_000_000L);
        testCashAccount.setId(10L);
        testCashAccount.setCurrentBalance(3_000_000L);

        testCreditAccount = new Account(testUser, "Thẻ tín dụng", AccountType.CREDIT_CARD, 0L);
        testCreditAccount.setId(20L);
        testCreditAccount.setCurrentBalance(0L); // dư nợ ban đầu = 0
        testCreditAccount.setCreditLimit(15_000_000L);

        testExpenseCategory = new Category(testUser, "Ăn uống", CategoryType.EXPENSE, "utensils", true);
        testExpenseCategory.setId(100L);

        testIncomeCategory = new Category(testUser, "Tiền lương", CategoryType.INCOME, "payments", true);
        testIncomeCategory.setId(101L);
    }

    @Test
    @DisplayName("TC_TXN_01: Thêm giao dịch Thu nhập (INCOME) làm tăng số dư ví")
    void testCreateIncomeTransaction_IncreasesAssetBalance() {
        testCashAccount.setCurrentBalance(1_000_000L);
        TransactionCreateRequest request = new TransactionCreateRequest(
                10L, 101L, TransactionType.INCOME, 2_000_000L, LocalDate.now(), "Lương tháng");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(accountRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testCashAccount));
        when(categoryRepository.findAccessibleCategory(101L, 1L)).thenReturn(Optional.of(testIncomeCategory));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> {
            Transaction t = invocation.getArgument(0);
            t.setId(500L);
            return t;
        });

        TransactionResponse response = transactionService.createTransaction(1L, request);

        assertNotNull(response);
        assertEquals(2_000_000L, response.getAmount());
        assertEquals(TransactionType.INCOME, response.getType());
        assertEquals(3_000_000L, testCashAccount.getCurrentBalance()); // 1M + 2M = 3M
        verify(accountRepository).save(testCashAccount);
    }

    @Test
    @DisplayName("TC_TXN_02: Thêm giao dịch Chi tiêu (EXPENSE) làm giảm số dư ví")
    void testCreateExpenseTransaction_DecreasesAssetBalance() {
        TransactionCreateRequest request = new TransactionCreateRequest(
                10L, 100L, TransactionType.EXPENSE, 800_000L, LocalDate.now(), "Ăn tối");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(accountRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testCashAccount));
        when(categoryRepository.findAccessibleCategory(100L, 1L)).thenReturn(Optional.of(testExpenseCategory));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> {
            Transaction t = invocation.getArgument(0);
            t.setId(501L);
            return t;
        });

        TransactionResponse response = transactionService.createTransaction(1L, request);

        assertNotNull(response);
        assertEquals(800_000L, response.getAmount());
        assertEquals(2_200_000L, testCashAccount.getCurrentBalance()); // 3M - 800k = 2.2M
        verify(accountRepository).save(testCashAccount);
    }

    @Test
    @DisplayName("TC_TXN_02b: Chi tiêu bằng Thẻ tín dụng làm tăng dư nợ")
    void testCreateExpenseTransaction_OnCreditCard_IncreasesDebt() {
        TransactionCreateRequest request = new TransactionCreateRequest(
                20L, 100L, TransactionType.EXPENSE, 1_500_000L, LocalDate.now(), "Mua sắm thẻ tín dụng");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(accountRepository.findByIdAndUserId(20L, 1L)).thenReturn(Optional.of(testCreditAccount));
        when(categoryRepository.findAccessibleCategory(100L, 1L)).thenReturn(Optional.of(testExpenseCategory));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> {
            Transaction t = invocation.getArgument(0);
            t.setId(502L);
            return t;
        });

        TransactionResponse response = transactionService.createTransaction(1L, request);

        assertNotNull(response);
        assertEquals(1_500_000L, testCreditAccount.getCurrentBalance()); // Nợ tăng từ 0 lên 1.5M
    }

    @Test
    @DisplayName("TC_TXN_03: Chỉnh sửa số tiền giao dịch hoàn tác số tiền cũ và áp dụng số tiền mới")
    void testUpdateTransaction_AmountChanged_RevertsOldAndAppliesNew() {
        // Đã chi 800k, ví còn 2.2M
        testCashAccount.setCurrentBalance(2_200_000L);
        Transaction existingTx = new Transaction(
                503L, testUser, testCashAccount, testExpenseCategory, TransactionType.EXPENSE, 800_000L, LocalDate.now(), "Ăn tối");

        TransactionUpdateRequest request = new TransactionUpdateRequest(
                10L, 100L, TransactionType.EXPENSE, 1_000_000L, LocalDate.now(), "Ăn tối buffet");

        when(transactionRepository.findByIdAndUserId(503L, 1L)).thenReturn(Optional.of(existingTx));
        when(categoryRepository.findAccessibleCategory(100L, 1L)).thenReturn(Optional.of(testExpenseCategory));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TransactionResponse response = transactionService.updateTransaction(1L, 503L, request);

        assertNotNull(response);
        assertEquals(1_000_000L, response.getAmount());
        // Hoàn tác 800k (2.2M + 800k = 3M), trừ mới 1M (3M - 1M = 2M)
        assertEquals(2_000_000L, testCashAccount.getCurrentBalance());
    }

    @Test
    @DisplayName("TC_TXN_04: Chỉnh sửa đổi ví phát sinh giao dịch hoàn tác ví cũ và trừ ví mới")
    void testUpdateTransaction_AccountChanged_BalancesAdjustedOnBoth() {
        Account testBank = new Account(testUser, "Techcombank", AccountType.BANK, 5_000_000L);
        testBank.setId(15L);
        testBank.setCurrentBalance(5_000_000L);

        // Chi 500k từ ví Cash (3M còn 2.5M)
        testCashAccount.setCurrentBalance(2_500_000L);
        Transaction existingTx = new Transaction(
                504L, testUser, testCashAccount, testExpenseCategory, TransactionType.EXPENSE, 500_000L, LocalDate.now(), "Cà phê");

        // Đổi sang ví Techcombank
        TransactionUpdateRequest request = new TransactionUpdateRequest(
                15L, 100L, TransactionType.EXPENSE, 500_000L, LocalDate.now(), "Cà phê");

        when(transactionRepository.findByIdAndUserId(504L, 1L)).thenReturn(Optional.of(existingTx));
        when(accountRepository.findByIdAndUserId(15L, 1L)).thenReturn(Optional.of(testBank));
        when(categoryRepository.findAccessibleCategory(100L, 1L)).thenReturn(Optional.of(testExpenseCategory));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TransactionResponse response = transactionService.updateTransaction(1L, 504L, request);

        assertNotNull(response);
        // Ví cũ Cash được hoàn tác (+500k) thành 3M
        assertEquals(3_000_000L, testCashAccount.getCurrentBalance());
        // Ví mới Techcombank bị trừ 500k còn 4.5M
        assertEquals(4_500_000L, testBank.getCurrentBalance());
    }

    @Test
    @DisplayName("TC_TXN_05: Xóa giao dịch Chi tiêu hoàn trả số dư ví")
    void testDeleteExpenseTransaction_RevertsBalance() {
        testCashAccount.setCurrentBalance(1_500_000L);
        Transaction existingTx = new Transaction(
                505L, testUser, testCashAccount, testExpenseCategory, TransactionType.EXPENSE, 500_000L, LocalDate.now(), "Mua sách");

        when(transactionRepository.findByIdAndUserId(505L, 1L)).thenReturn(Optional.of(existingTx));

        transactionService.deleteTransaction(1L, 505L);

        // 1.5M + 500k = 2M
        assertEquals(2_000_000L, testCashAccount.getCurrentBalance());
        verify(accountRepository).save(testCashAccount);
        verify(transactionRepository).delete(existingTx);
    }

    @Test
    @DisplayName("TC_TXN_06: Xóa giao dịch Thu nhập khấu trừ lại số dư ví")
    void testDeleteIncomeTransaction_RevertsBalance() {
        testCashAccount.setCurrentBalance(2_000_000L);
        Transaction existingTx = new Transaction(
                506L, testUser, testCashAccount, testIncomeCategory, TransactionType.INCOME, 1_000_000L, LocalDate.now(), "Thưởng nóng");

        when(transactionRepository.findByIdAndUserId(506L, 1L)).thenReturn(Optional.of(existingTx));

        transactionService.deleteTransaction(1L, 506L);

        // 2M - 1M = 1M
        assertEquals(1_000_000L, testCashAccount.getCurrentBalance());
        verify(accountRepository).save(testCashAccount);
        verify(transactionRepository).delete(existingTx);
    }

    @Test
    @DisplayName("TC_TXN_07: Chặn số tiền âm hoặc bằng 0")
    void testCreateTransaction_InvalidAmount_ThrowsException() {
        TransactionCreateRequest requestZero = new TransactionCreateRequest(
                10L, 100L, TransactionType.EXPENSE, 0L, LocalDate.now(), "Không đồng");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        assertThrows(BusinessValidationException.class, () ->
                transactionService.createTransaction(1L, requestZero));
    }

    @Test
    @DisplayName("TC_TXN_07b: Chặn chọn danh mục không khớp loại giao dịch")
    void testCreateTransaction_CategoryTypeMismatch_ThrowsException() {
        // Giao dịch EXPENSE nhưng chọn danh mục INCOME
        TransactionCreateRequest requestMismatch = new TransactionCreateRequest(
                10L, 101L, TransactionType.EXPENSE, 100_000L, LocalDate.now(), "Sai danh mục");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(accountRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testCashAccount));
        when(categoryRepository.findAccessibleCategory(101L, 1L)).thenReturn(Optional.of(testIncomeCategory));

        assertThrows(BusinessValidationException.class, () ->
                transactionService.createTransaction(1L, requestMismatch));
    }

    @Test
    @DisplayName("TC_TXN_08: Tính toàn vẹn Database Transaction (Rollback khi gặp RuntimeException)")
    void testCreateTransaction_RollbackOnException() {
        TransactionCreateRequest request = new TransactionCreateRequest(
                10L, 100L, TransactionType.EXPENSE, 500_000L, LocalDate.now(), "Lỗi hệ thống");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(accountRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testCashAccount));
        when(categoryRepository.findAccessibleCategory(100L, 1L)).thenReturn(Optional.of(testExpenseCategory));
        when(transactionRepository.save(any(Transaction.class)))
                .thenThrow(new RuntimeException("Lỗi kết nối cơ sở dữ liệu ngẫu nhiên"));

        assertThrows(RuntimeException.class, () ->
                transactionService.createTransaction(1L, request));
    }

    @Test
    @DisplayName("TC_TXN_10: Thêm giao dịch TRANSFER trừ tiền ví nguồn và cộng tiền ví đích thành công")
    void testCreateTransferTransaction_Success() {
        testCashAccount.setCurrentBalance(5_000_000L);

        Account testTargetAccount = new Account(testUser, "Nuôi con", AccountType.BANK, 1_000_000L);
        testTargetAccount.setId(30L);
        testTargetAccount.setCurrentBalance(1_000_000L);

        TransactionCreateRequest request = new TransactionCreateRequest(
                10L, 30L, null, TransactionType.TRANSFER, 2_000_000L, LocalDate.now(), "Chuyển tiền nuôi con");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(accountRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testCashAccount));
        when(accountRepository.findByIdAndUserId(30L, 1L)).thenReturn(Optional.of(testTargetAccount));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> {
            Transaction t = invocation.getArgument(0);
            t.setId(600L);
            return t;
        });

        TransactionResponse response = transactionService.createTransaction(1L, request);

        assertNotNull(response);
        assertEquals(TransactionType.TRANSFER, response.getType());
        assertEquals(2_000_000L, response.getAmount());
        assertNotNull(response.getAccount());
        assertEquals(10L, response.getAccount().getId());
        assertNotNull(response.getToAccount());
        assertEquals(30L, response.getToAccount().getId());
        assertNull(response.getCategory());

        // Số dư ví nguồn: 5M - 2M = 3M
        assertEquals(3_000_000L, testCashAccount.getCurrentBalance());
        // Số dư ví đích: 1M + 2M = 3M
        assertEquals(3_000_000L, testTargetAccount.getCurrentBalance());

        verify(accountRepository).save(testCashAccount);
        verify(accountRepository).save(testTargetAccount);
        verify(transactionRepository).save(any(Transaction.class));
    }

    @Test
    @DisplayName("Task 10.2: Chuyển khoản cùng tài khoản (fromAccountId == toAccountId) ném ngoại lệ")
    void testCreateTransferTransaction_SameAccount_ThrowsException() {
        TransactionCreateRequest request = new TransactionCreateRequest(
                10L, 10L, null, TransactionType.TRANSFER, 1_000_000L, LocalDate.now(), "Chuyển cho chính mình");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        BusinessValidationException ex = assertThrows(BusinessValidationException.class, () ->
                transactionService.createTransaction(1L, request));
        assertEquals("Tài khoản nhận tiền phải khác tài khoản chuyển", ex.getMessage());
    }

    @Test
    @DisplayName("Task 10.2: Chuyển khoản thiếu toAccountId ném ngoại lệ")
    void testCreateTransferTransaction_MissingToAccount_ThrowsException() {
        TransactionCreateRequest request = new TransactionCreateRequest(
                10L, null, null, TransactionType.TRANSFER, 1_000_000L, LocalDate.now(), "Thiếu toAccount");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        BusinessValidationException ex = assertThrows(BusinessValidationException.class, () ->
                transactionService.createTransaction(1L, request));
        assertEquals("Tài khoản nhận tiền không được để trống", ex.getMessage());
    }

    @Test
    @DisplayName("Task 10.2: Chuyển tiền tới hoặc từ tài khoản đã lưu trữ (Archived) ném ngoại lệ")
    void testCreateTransferTransaction_ArchivedAccount_ThrowsException() {
        testCashAccount.setIsArchived(true);
        Account target = new Account(testUser, "Ví B", AccountType.BANK, 500_000L);
        target.setId(31L);

        TransactionCreateRequest request = new TransactionCreateRequest(
                10L, 31L, null, TransactionType.TRANSFER, 200_000L, LocalDate.now(), "Từ ví archived");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(accountRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testCashAccount));

        assertThrows(BusinessValidationException.class, () ->
                transactionService.createTransaction(1L, request));
    }

    @Test
    @DisplayName("Task 10.2: Cập nhật giao dịch TRANSFER hoàn tác số dư cũ và áp dụng số dư mới")
    void testUpdateTransferTransaction_Success() {
        testCashAccount.setCurrentBalance(3_000_000L); // Ban đầu đã bị trừ 2M (từ 5M)
        Account testTargetAccount = new Account(testUser, "Nuôi con", AccountType.BANK, 3_000_000L); // Ban đầu đã nhận 2M (từ 1M)
        testTargetAccount.setId(30L);

        Transaction existingTransfer = new Transaction(
                601L, testUser, testCashAccount, testTargetAccount, null,
                TransactionType.TRANSFER, 2_000_000L, LocalDate.now(), "Cũ"
        );

        when(transactionRepository.findByIdAndUserId(601L, 1L)).thenReturn(Optional.of(existingTransfer));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Sửa số tiền chuyển từ 2M thành 1M
        TransactionUpdateRequest updateRequest = new TransactionUpdateRequest(
                10L, 30L, null, TransactionType.TRANSFER, 1_000_000L, LocalDate.now(), "Mới: 1M"
        );

        TransactionResponse response = transactionService.updateTransaction(1L, 601L, updateRequest);

        assertNotNull(response);
        assertEquals(1_000_000L, response.getAmount());
        // Sau khi hoàn tác 2M (Cash=5M, Target=1M), rồi áp dụng 1M:
        // Cash = 5M - 1M = 4M
        assertEquals(4_000_000L, testCashAccount.getCurrentBalance());
        // Target = 1M + 1M = 2M
        assertEquals(2_000_000L, testTargetAccount.getCurrentBalance());
    }

    @Test
    @DisplayName("Task 10.2: Cập nhật đổi tài khoản đích của giao dịch TRANSFER")
    void testUpdateTransferTransaction_TargetAccountChanged_Success() {
        testCashAccount.setCurrentBalance(3_000_000L); // Từ 5M đã chuyển 2M
        Account oldTarget = new Account(testUser, "Nuôi con", AccountType.BANK, 3_000_000L); // Nhận 2M
        oldTarget.setId(30L);

        Account newTarget = new Account(testUser, "Tiết kiệm", AccountType.BANK, 5_000_000L);
        newTarget.setId(35L);

        Transaction existingTransfer = new Transaction(
                603L, testUser, testCashAccount, oldTarget, null,
                TransactionType.TRANSFER, 2_000_000L, LocalDate.now(), "Chuyển cũ"
        );

        when(transactionRepository.findByIdAndUserId(603L, 1L)).thenReturn(Optional.of(existingTransfer));
        when(accountRepository.findByIdAndUserId(35L, 1L)).thenReturn(Optional.of(newTarget));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Đổi sang ví newTarget (35L) và chuyển 1_500_000L
        TransactionUpdateRequest updateRequest = new TransactionUpdateRequest(
                10L, 35L, null, TransactionType.TRANSFER, 1_500_000L, LocalDate.now(), "Chuyển sang tiết kiệm"
        );

        TransactionResponse response = transactionService.updateTransaction(1L, 603L, updateRequest);

        assertNotNull(response);
        assertEquals(1_500_000L, response.getAmount());
        // Cash: hoàn tác +2M (5M) rồi trừ 1.5M = 3.5M
        assertEquals(3_500_000L, testCashAccount.getCurrentBalance());
        // OldTarget: hoàn tác -2M = 1M
        assertEquals(1_000_000L, oldTarget.getCurrentBalance());
        // NewTarget: cộng 1.5M = 6.5M
        assertEquals(6_500_000L, newTarget.getCurrentBalance());

        verify(accountRepository).save(oldTarget);
        verify(accountRepository).save(newTarget);
        verify(accountRepository, times(2)).save(testCashAccount);
    }

    @Test
    @DisplayName("Task 10.2: Xóa giao dịch TRANSFER hoàn tác số dư cả hai tài khoản")
    void testDeleteTransferTransaction_RevertsBothAccounts() {
        testCashAccount.setCurrentBalance(3_000_000L);
        Account testTargetAccount = new Account(testUser, "Tiết kiệm", AccountType.BANK, 3_000_000L);
        testTargetAccount.setId(35L);

        Transaction existingTransfer = new Transaction(
                602L, testUser, testCashAccount, testTargetAccount, null,
                TransactionType.TRANSFER, 2_000_000L, LocalDate.now(), "Chuyển tiết kiệm"
        );

        when(transactionRepository.findByIdAndUserId(602L, 1L)).thenReturn(Optional.of(existingTransfer));

        transactionService.deleteTransaction(1L, 602L);

        // Nguồn được cộng lại 2M: 3M + 2M = 5M
        assertEquals(5_000_000L, testCashAccount.getCurrentBalance());
        // Đích bị trừ lại 2M: 3M - 2M = 1M
        assertEquals(1_000_000L, testTargetAccount.getCurrentBalance());

        verify(accountRepository).save(testCashAccount);
        verify(accountRepository).save(testTargetAccount);
        verify(transactionRepository).delete(existingTransfer);
    }

    @Test
    @DisplayName("Task 10.2: Chuyển khoản từ Bank sang Thẻ tín dụng làm giảm dư nợ thẻ (trả nợ thẻ)")
    void testCreateTransferTransaction_ToCreditCard_ReducesDebt() {
        testCashAccount.setCurrentBalance(5_000_000L);
        testCreditAccount.setCurrentBalance(3_000_000L); // Đang nợ 3 triệu

        TransactionCreateRequest request = new TransactionCreateRequest(
                10L, 20L, null, TransactionType.TRANSFER, 2_000_000L, LocalDate.now(), "Thanh toán dư nợ thẻ");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(accountRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testCashAccount));
        when(accountRepository.findByIdAndUserId(20L, 1L)).thenReturn(Optional.of(testCreditAccount));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TransactionResponse response = transactionService.createTransaction(1L, request);

        assertNotNull(response);
        // Bank bị trừ 2 triệu: 5M - 2M = 3M
        assertEquals(3_000_000L, testCashAccount.getCurrentBalance());
        // Thẻ tín dụng được trả nợ 2 triệu: dư nợ giảm từ 3M xuống 1M
        assertEquals(1_000_000L, testCreditAccount.getCurrentBalance());

        // Net Worth:
        // Trước: 5M (Assets) - 3M (Liabilities) = 2M
        // Sau: 3M (Assets) - 1M (Liabilities) = 2M (Bảo toàn tuyệt đối Net Worth!)
    }
}
