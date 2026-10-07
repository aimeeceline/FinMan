export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type AccountType = 'CASH' | 'BANK' | 'CREDIT_CARD' | 'INVESTMENT' | 'OTHER';

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
  note?: string;
  statementDay?: number;
  paymentDueDay?: number;
  paymentAccountId?: number | null;
  isAutoPayment?: boolean;
  napasLinked?: boolean;
  isArchived?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AccountSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  accounts: Account[];
}

export interface AccountCreatePayload {
  name: string;
  type: AccountType;
  initialBalance: number;
  creditLimit?: number;
  accountNumber?: string;
  bankName?: string;
  note?: string;
  statementDay?: number;
  paymentDueDay?: number;
  paymentAccountId?: number | null;
  isAutoPayment?: boolean;
}

export interface AccountUpdatePayload {
  name?: string;
  creditLimit?: number;
  accountNumber?: string;
  bankName?: string;
  note?: string;
  statementDay?: number;
  paymentDueDay?: number;
  paymentAccountId?: number | null;
  isAutoPayment?: boolean;
  isArchived?: boolean;
}

export interface Category {
  id: number;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon: string;
  color?: string;
  bgColor?: string;
  isDefault?: boolean;
  isDeleted?: boolean;
}

export interface Transaction {
  id: number;
  amount: number;
  type: TransactionType;
  category?: Category;
  account: Account;
  toAccount?: Account;
  date: string; // YYYY-MM-DD
  time?: string;
  note?: string;
  isAiParsed?: boolean;
  createdAt?: string;
}

export interface Budget {
  id: number;
  category: Category;
  allocatedAmount: number;
  spentAmount: number;
  month: string; // YYYY-MM
  amount?: number;
  remainingAmount?: number;
  overspentAmount?: number;
  percentage?: number;
  status?: 'NORMAL' | 'WARNING' | 'OVERBUDGET';
}

export interface FinancialStats {
  netWorth: number;
  totalIncome: number;
  totalExpense: number;
  surplus: number;
  savingsRate: number;
  previousMonthNetWorthDelta: number;
}

export type RecycleBinType = 'ALL' | 'TRANSACTION' | 'CATEGORY' | 'BUDGET' | 'ACCOUNT';

export interface RecycleBinItem {
  id: number;
  type: 'TRANSACTION' | 'CATEGORY' | 'BUDGET' | 'ACCOUNT';
  title: string;
  subtitle: string;
  amount?: number;
  icon?: string;
  deletedAt: string;
  daysRemaining: number;
  extraInfo?: string;
}

export interface RecycleBinActionPayload {
  items?: { id: number; type: string }[];
  emptyAll?: boolean;
}

