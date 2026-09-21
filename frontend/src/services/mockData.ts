import type { Account, Budget, Category, FinancialStats, Transaction, User } from '../types';

export const mockUser: User = {
  id: 1,
  email: 'minhkhang.finance@gmail.com',
  fullName: 'Nguyễn Minh Khang',
  avatarUrl: 'https://lh3.googleusercontent.com/aida/AEtjO1V7c1UffJXUOA8FhjBlqR3FlPapA_U8smxBc7PmGevlC99yx0eLVLCFBTfyjGIM25sa1526tQ6exRSlZcyR9YWlFEEpuuAkcanEpGwoGdGUNUjR-OntYoSmwgBk9cW1A0Hg_B6PlWEcq62Pn4Ym520HV3e0uEfgdS6JoU3Tq-S4CpsxGJrhLYw-JM7I9jYcghHwBKYZYbiUJJycVIsiurVHu9c1A8oYw4d76DOQbYi0qasGKo4Cf1gT4NLr8aN0CEJOwECfcSFd',
};

export const mockCategories: Category[] = [
  { id: 1, name: 'Ăn uống', type: 'EXPENSE', icon: 'restaurant', color: '#dc2626', bgColor: '#fee2e2' },
  { id: 2, name: 'Mua sắm', type: 'EXPENSE', icon: 'shopping_bag', color: '#7c3aed', bgColor: '#f3e8ff' },
  { id: 3, name: 'Giao thông', type: 'EXPENSE', icon: 'directions_car', color: '#d97706', bgColor: '#fef3c7' },
  { id: 4, name: 'Nhà cửa & Dịch vụ', type: 'EXPENSE', icon: 'home', color: '#0284c7', bgColor: '#e0f2fe' },
  { id: 5, name: 'Sức khỏe', type: 'EXPENSE', icon: 'medical_services', color: '#e11d48', bgColor: '#ffe4e6' },
  { id: 6, name: 'Giáo dục', type: 'EXPENSE', icon: 'school', color: '#2563eb', bgColor: '#dbeafe' },
  { id: 7, name: 'Tiền lương', type: 'INCOME', icon: 'payments', color: '#059669', bgColor: '#d1fae5' },
  { id: 8, name: 'Thưởng & Đầu tư', type: 'INCOME', icon: 'trending_up', color: '#059669', bgColor: '#d1fae5' },
  { id: 9, name: 'Thu nhập phụ', type: 'INCOME', icon: 'savings', color: '#006c4a', bgColor: '#82f5c1' },
];

export const mockAccounts: Account[] = [
  {
    id: 1,
    name: 'Tiền mặt ví chính',
    type: 'CASH',
    currentBalance: 910000,
    initialBalance: 1000000,
    napasLinked: false,
  },
  {
    id: 2,
    name: 'Vietcombank Digibank',
    type: 'BANK',
    currentBalance: 4000000,
    initialBalance: 0,
    bankName: 'Vietcombank',
    accountNumber: '•••• 4821',
    napasLinked: true,
  },
  {
    id: 3,
    name: 'Techcombank Priority',
    type: 'BANK',
    currentBalance: 1090000,
    initialBalance: 1090000,
    bankName: 'Techcombank',
    accountNumber: '•••• 9988',
    napasLinked: true,
  },
  {
    id: 4,
    name: 'VPBank StepUp Master',
    type: 'CREDIT_CARD',
    currentBalance: 1090000, // Current debt
    creditLimit: 20000000,
    bankName: 'VPBank',
    accountNumber: '•••• 1205',
    napasLinked: false,
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: 1,
    amount: 50000,
    type: 'EXPENSE',
    category: mockCategories[0], // Ăn uống
    account: mockAccounts[0], // Tiền mặt
    date: '2026-09-17',
    time: '12:30',
    note: 'Ăn trưa Highland Coffee',
  },
  {
    id: 2,
    amount: 340000,
    type: 'EXPENSE',
    category: mockCategories[1], // Mua sắm
    account: mockAccounts[1], // Vietcombank
    date: '2026-09-17',
    time: '09:15',
    note: 'Mua sách phân tích kỹ thuật',
  },
  {
    id: 3,
    amount: 90000,
    type: 'EXPENSE',
    category: mockCategories[2], // Giao thông
    account: mockAccounts[0], // Tiền mặt
    date: '2026-09-16',
    time: '17:45',
    note: 'Đổ xăng xe máy Petrolimex',
  },
  {
    id: 4,
    amount: 6000000,
    type: 'INCOME',
    category: mockCategories[6], // Lương
    account: mockAccounts[1], // Vietcombank
    date: '2026-09-05',
    time: '08:00',
    note: 'Nhận lương tháng 9/2026',
  },
  {
    id: 5,
    amount: 500000,
    type: 'EXPENSE',
    category: mockCategories[0], // Ăn uống
    account: mockAccounts[2], // Techcombank
    date: '2026-09-04',
    time: '19:30',
    note: 'Ăn tối họp mặt bạn bè',
  },
  {
    id: 6,
    amount: 110000,
    type: 'EXPENSE',
    category: mockCategories[2], // Giao thông
    account: mockAccounts[3], // VPBank
    date: '2026-09-02',
    time: '14:20',
    note: 'Chuyến xe GrabCar đến sân bay',
  },
];

export const mockBudgets: Budget[] = [
  {
    id: 1,
    category: mockCategories[0], // Ăn uống
    allocatedAmount: 2000000,
    spentAmount: 550000,
    month: '2026-09',
  },
  {
    id: 2,
    category: mockCategories[1], // Mua sắm
    allocatedAmount: 1000000,
    spentAmount: 340000,
    month: '2026-09',
  },
  {
    id: 3,
    category: mockCategories[2], // Giao thông
    allocatedAmount: 500000,
    spentAmount: 200000,
    month: '2026-09',
  },
  {
    id: 4,
    category: mockCategories[3], // Nhà cửa
    allocatedAmount: 500000,
    spentAmount: 0,
    month: '2026-09',
  },
];

export const mockStats: FinancialStats = {
  netWorth: 4910000,
  totalIncome: 6000000,
  totalExpense: 1090000,
  surplus: 4910000,
  savingsRate: 81.8,
  previousMonthNetWorthDelta: 12.4,
};
