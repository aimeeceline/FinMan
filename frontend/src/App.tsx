import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, type NavRoute } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { AddTransactionModal } from './components/modals/AddTransactionModal';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { BudgetPage } from './pages/budget/BudgetPage';
import { AccountsPage } from './pages/accounts/AccountsPage';
import { StatisticsPage } from './pages/statistics/StatisticsPage';
import { AIAssistantPage } from './pages/ai/AIAssistantPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { accountService } from './services/accountService';
import { categoryService } from './services/categoryService';
import { transactionService } from './services/transactionService';
import type { Account, Category, Transaction } from './types';

const VALID_ROUTES: NavRoute[] = [
  'giao-dich',
  'thong-ke-va-bao-cao',
  'quan-ly-ngan-sach',
  'tai-khoan-va-tai-san',
  'tro-ly-finman-ai',
  'cai-dat-va-danh-muc',
];

const getInitialRoute = (): NavRoute => {
  if (typeof window === 'undefined') return 'giao-dich';

  // 1. Check pathname (e.g. /tai-khoan-va-tai-san)
  const path = window.location.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  if (VALID_ROUTES.includes(path as NavRoute)) {
    return path as NavRoute;
  }

  // 2. Check hash (e.g. #/tai-khoan-va-tai-san or #tai-khoan-va-tai-san)
  const hash = window.location.hash.replace(/^#[/]?/, '').replace(/\/+$/, '');
  if (VALID_ROUTES.includes(hash as NavRoute)) {
    return hash as NavRoute;
  }

  // 3. Check localStorage
  const saved = localStorage.getItem('finman_current_route') as NavRoute | null;
  if (saved && VALID_ROUTES.includes(saved)) {
    return saved;
  }

  return 'giao-dich';
};

const MainApp: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');
  const [currentRoute, setCurrentRoute] = useState<NavRoute>(getInitialRoute);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleNavigate = useCallback((route: NavRoute) => {
    setCurrentRoute(route);
    localStorage.setItem('finman_current_route', route);
    const targetPath = route === 'giao-dich' ? '/' : `/${route}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  }, []);

  // Listen to browser Back / Forward buttons & Hash changes
  useEffect(() => {
    const handlePopState = () => {
      const route = getInitialRoute();
      setCurrentRoute(route);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Sync browser URL bar with active route on initial load or change
  useEffect(() => {
    const targetPath = currentRoute === 'giao-dich' ? '/' : `/${currentRoute}`;
    if (window.location.pathname !== targetPath && !window.location.hash) {
      window.history.replaceState(null, '', targetPath);
    }
  }, [currentRoute]);

  // Fetch real data from backend when authenticated
  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [accountsSummary, txs, cats] = await Promise.all([
        accountService.getAccountsSummary().catch(() => null),
        transactionService.getTransactions().catch(() => []),
        categoryService.getCategories().catch(() => []),
      ]);
      if (accountsSummary && accountsSummary.accounts) {
        setAccounts(accountsSummary.accounts);
      }
      if (txs) {
        setTransactions(txs);
      }
      if (cats) {
        setCategories(cats);
      }
    } catch (err) {
      console.warn('Could not load data from backend in App.tsx:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle adding new transaction into database
  const handleAddTransaction = async (newTx: Omit<Transaction, 'id'>) => {
    try {
      await transactionService.createTransaction({
        accountId: newTx.account.id,
        categoryId: newTx.category.id,
        type: newTx.type,
        amount: newTx.amount,
        transactionDate: newTx.date,
        note: newTx.note,
      });
      await loadData();
    } catch (err: any) {
      console.error('Error saving transaction to database:', err);
      alert(err.response?.data?.message || 'Không thể lưu giao dịch vào cơ sở dữ liệu');
    }
  };

  // Handle updating transaction in database
  const handleUpdateTransaction = async (id: number, updatedTx: Omit<Transaction, 'id'>) => {
    try {
      await transactionService.updateTransaction(id, {
        accountId: updatedTx.account.id,
        categoryId: updatedTx.category.id,
        type: updatedTx.type,
        amount: updatedTx.amount,
        transactionDate: updatedTx.date,
        note: updatedTx.note,
      });
      await loadData();
    } catch (err: any) {
      console.error('Error updating transaction in database:', err);
      alert(err.response?.data?.message || 'Không thể cập nhật giao dịch');
    }
  };

  // Handle deleting transaction from database
  const handleDeleteTransaction = async (id: number) => {
    try {
      await transactionService.deleteTransaction(id);
      await loadData();
    } catch (err: any) {
      console.error('Error deleting transaction from database:', err);
      alert(err.response?.data?.message || 'Không thể xóa giao dịch khỏi cơ sở dữ liệu');
    }
  };

  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingTransaction(null);
  };

  const handleAddAccount = (newAcc: Account) => {
    setAccounts((prev) => {
      const exists = prev.some((a) => a.id === newAcc.id);
      if (exists) {
        return prev.map((a) => (a.id === newAcc.id ? newAcc : a));
      }
      return [...prev, newAcc];
    });
  };

  // If not authenticated, render Login/Register
  if (!isAuthenticated) {
    if (authScreen === 'register') {
      return <RegisterPage onNavigateToLogin={() => setAuthScreen('login')} />;
    }
    return <LoginPage onNavigateToRegister={() => setAuthScreen('register')} />;
  }

  // Filter transactions by search query
  const filteredTransactions = transactions.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.note && t.note.toLowerCase().includes(q)) ||
      t.category.name.toLowerCase().includes(q) ||
      t.account.name.toLowerCase().includes(q) ||
      t.amount.toString().includes(q)
    );
  });


  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* 1. Fixed Left Sidebar */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        onOpenAddModal={handleOpenAddModal}
      />

      {/* 2. Fixed Top Header */}
      <TopHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onExportExcel={() => alert('Đang trích xuất file Excel lịch sử giao dịch (.xlsx)...')}
      />

      {/* 3. Main Stage Content Area (Offset pl-72 pt-20) */}
      <main className="pl-72 pt-20 min-h-screen bg-surface">
        {currentRoute === 'giao-dich' && (
          <DashboardPage
            transactions={filteredTransactions}
            accounts={accounts}
            categories={categories}
            onOpenAddModal={handleOpenAddModal}
            onNavigateToAccounts={() => handleNavigate('tai-khoan-va-tai-san')}
            onNavigateToReports={() => handleNavigate('thong-ke-va-bao-cao')}
            onDeleteTransaction={handleDeleteTransaction}
            onEditTransaction={handleOpenEditModal}
            onApplyAiTransaction={handleAddTransaction}
          />
        )}

        {currentRoute === 'quan-ly-ngan-sach' && <BudgetPage />}

        {currentRoute === 'tai-khoan-va-tai-san' && (
          <AccountsPage
            accounts={accounts}
            onAddAccount={handleAddAccount}
            onRefresh={loadData}
          />
        )}

        {currentRoute === 'thong-ke-va-bao-cao' && (
          <StatisticsPage transactions={transactions} />
        )}

        {currentRoute === 'tro-ly-finman-ai' && <AIAssistantPage />}

        {currentRoute === 'cai-dat-va-danh-muc' && <SettingsPage />}
      </main>

      {/* 4. Global Add/Edit Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onAddTransaction={handleAddTransaction}
        onUpdateTransaction={handleUpdateTransaction}
        editingTransaction={editingTransaction}
        accounts={accounts}
        categories={categories}
        transactions={transactions}
        onCategoryCreated={(newCat) => setCategories((prev) => [...prev, newCat])}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
