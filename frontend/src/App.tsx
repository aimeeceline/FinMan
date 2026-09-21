import React, { useState } from 'react';
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
import { mockTransactions } from './services/mockData';
import type { Transaction } from './types';

const MainApp: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');
  const [currentRoute, setCurrentRoute] = useState<NavRoute>('giao-dich');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle adding new transaction
  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const tx: Transaction = {
      ...newTx,
      id: Date.now(),
    };
    setTransactions([tx, ...transactions]);
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
        onNavigate={(route) => setCurrentRoute(route)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
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
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onNavigateToAccounts={() => setCurrentRoute('tai-khoan-va-tai-san')}
            onNavigateToReports={() => setCurrentRoute('thong-ke-va-bao-cao')}
          />
        )}

        {currentRoute === 'quan-ly-ngan-sach' && <BudgetPage />}

        {currentRoute === 'tai-khoan-va-tai-san' && <AccountsPage />}

        {currentRoute === 'thong-ke-va-bao-cao' && <StatisticsPage />}

        {currentRoute === 'tro-ly-finman-ai' && <AIAssistantPage />}

        {currentRoute === 'cai-dat-va-danh-muc' && <SettingsPage />}
      </main>

      {/* 4. Global Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTransaction={handleAddTransaction}
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
