import type { Account } from '../types';

export const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 1,
    name: 'Vietcombank Digital',
    type: 'BANK',
    currentBalance: 4910000,
    initialBalance: 0,
    accountNumber: '1023456789',
    bankName: 'Vietcombank',
    napasLinked: true,
  },
  {
    id: 2,
    name: 'Tiền mặt ví',
    type: 'CASH',
    currentBalance: 1500000,
    initialBalance: 0,
    accountNumber: 'Ví tiền mặt',
    napasLinked: false,
  },
  {
    id: 3,
    name: 'Thẻ tín dụng Techcombank',
    type: 'CREDIT_CARD',
    currentBalance: 0,
    initialBalance: 0,
    creditLimit: 20000000,
    accountNumber: '4503-xxxx-9821',
    bankName: 'Techcombank',
    napasLinked: true,
  },
];
