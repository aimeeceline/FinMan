export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type AccountType = 'CASH' | 'BANK' | 'CREDIT_CARD';

export interface User {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role?: string;
}

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  currentBalance: number;
  initialBalance?: number;
  creditLimit?: number;
  accountNumber?: string;
  bankName?: string;
  napasLinked?: boolean;
  isArchived?: boolean;
}

export interface Category {
  id: number;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon: string;
  color?: string;
  bgColor?: string;
}

export interface Transaction {
  id: number;
  amount: number;
  type: TransactionType;
  category: Category;
  account: Account;
  date: string; // YYYY-MM-DD
  time?: string;
  note?: string;
  createdAt?: string;
}

export interface Budget {
  id: number;
  category: Category;
  allocatedAmount: number;
  spentAmount: number;
  month: string; // YYYY-MM
}

export interface FinancialStats {
  netWorth: number;
  totalIncome: number;
  totalExpense: number;
  surplus: number;
  savingsRate: number;
  previousMonthNetWorthDelta: number;
}
