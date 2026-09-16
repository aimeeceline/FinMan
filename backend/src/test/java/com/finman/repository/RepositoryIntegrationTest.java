package com.finman.repository;

import com.finman.entity.Account;
import com.finman.entity.Budget;
import com.finman.entity.Category;
import com.finman.entity.Transaction;
import com.finman.entity.User;
import com.finman.entity.enums.AccountType;
import com.finman.entity.enums.CategoryType;
import com.finman.entity.enums.TransactionType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
class RepositoryIntegrationTest {

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

    @Test
    @DisplayName("Should bootstrap all repositories and perform CRUD with user isolation")
    void testRepositoriesLifecycleAndUserIsolation() {
        // 1. Create User
        User user = new User("test_repo@finman.com", "hash_pw", "Repo Tester");
        User savedUser = userRepository.save(user);
        assertNotNull(savedUser.getId());
        assertTrue(userRepository.existsByEmail("test_repo@finman.com"));
        assertFalse(userRepository.existsByEmail("unknown@finman.com"));

        Optional<User> foundUser = userRepository.findByEmail("test_repo@finman.com");
        assertTrue(foundUser.isPresent());
        assertEquals("Repo Tester", foundUser.get().getFullName());

        // 2. Create Account
        Account account = new Account(savedUser, "Ví Tiền Mặt", AccountType.CASH, 5000000L);
        Account savedAccount = accountRepository.save(account);
        assertNotNull(savedAccount.getId());

        List<Account> userAccounts = accountRepository.findByUserIdAndIsArchivedFalse(savedUser.getId());
        assertEquals(1, userAccounts.size());
        assertEquals(5000000L, accountRepository.sumCurrentBalanceByUserId(savedUser.getId()));

        // 3. Categories (1 default system category from DataSeeder, 1 user custom category)
        Category defaultCat = categoryRepository.findByIsDefaultTrue().stream()
                .filter(c -> "Ăn uống".equalsIgnoreCase(c.getName()))
                .findFirst()
                .orElseGet(() -> categoryRepository.save(new Category("Ăn uống", CategoryType.EXPENSE, "restaurant", true)));
        Category customCat = new Category(savedUser, "Dự án ngoài", CategoryType.INCOME, "💼", false);
        categoryRepository.save(customCat);

        List<Category> availableCategories = categoryRepository.findAllAvailableForUser(savedUser.getId());
        assertTrue(availableCategories.size() >= 2);

        // 4. Create Transaction
        LocalDate today = LocalDate.now();
        Transaction txn = new Transaction(
                savedUser, savedAccount, defaultCat,
                TransactionType.EXPENSE, 150000L, today, "Ăn trưa cơm tấm"
        );
        Transaction savedTxn = transactionRepository.save(txn);
        assertNotNull(savedTxn.getId());

        Page<Transaction> page = transactionRepository.findByUserId(savedUser.getId(), PageRequest.of(0, 10));
        assertEquals(1, page.getTotalElements());

        Long totalExpense = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                savedUser.getId(), TransactionType.EXPENSE, today.minusDays(1), today.plusDays(1)
        );
        assertEquals(150000L, totalExpense);

        // 5. Create Budget
        String currentMonth = String.format("%04d-%02d", today.getYear(), today.getMonthValue());
        Budget budget = new Budget(savedUser, defaultCat, currentMonth, 3000000L);
        Budget savedBudget = budgetRepository.save(budget);
        assertNotNull(savedBudget.getId());

        assertTrue(budgetRepository.existsByUserIdAndCategoryIdAndMonth(
                savedUser.getId(), defaultCat.getId(), currentMonth
        ));
        List<Budget> userBudgets = budgetRepository.findByUserIdAndMonth(savedUser.getId(), currentMonth);
        assertEquals(1, userBudgets.size());
        assertEquals(3000000L, userBudgets.get(0).getAmount());
    }
}
