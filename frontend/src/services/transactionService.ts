import { api } from './api';
import type { Transaction, TransactionType } from '../types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  totalTransactions: number;
}

export interface TransactionCreatePayload {
  accountId: number;
  categoryId: number;
  type: TransactionType;
  amount: number;
  transactionDate: string; // YYYY-MM-DD
  note?: string;
}

export interface TransactionUpdatePayload {
  accountId?: number;
  categoryId?: number;
  type?: TransactionType;
  amount?: number;
  transactionDate?: string;
  note?: string;
}

export interface TransactionFilterParams {
  month?: string; // YYYY-MM
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  accountId?: number;
  categoryId?: number;
  type?: TransactionType;
  search?: string;
  page?: number;
  size?: number;
}

export const transactionService = {
  /**
   * Lấy danh sách giao dịch từ cơ sở dữ liệu backend
   */
  async getTransactions(params?: TransactionFilterParams): Promise<Transaction[]> {
    const res = await api.get<ApiResponse<SpringPage<any> | any[]>>('/transactions', {
      params: {
        ...params,
        size: params?.size || 100, // Get up to 100 recent transactions
      },
    });

    const rawData = res.data.data;
    const rawList: any[] = Array.isArray(rawData) ? rawData : (rawData?.content || []);

    return rawList.map((item) => ({
      id: item.id,
      amount: item.amount,
      type: item.type,
      date: item.transactionDate || item.date,
      time: item.createdAt ? new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : undefined,
      note: item.note,
      createdAt: item.createdAt,
      account: {
        id: item.account?.id,
        name: item.account?.name,
        type: item.account?.type,
        accountNumber: item.account?.accountNumber,
        currentBalance: 0,
      },
      category: {
        id: item.category?.id,
        name: item.category?.name,
        type: item.category?.type,
        icon: item.category?.icon || 'payments',
        color: item.category?.color,
      },
    }));
  },

  /**
   * Lấy thống kê dòng tiền tổng thể từ cơ sở dữ liệu
   */
  async getTransactionSummary(params?: {
    month?: string;
    startDate?: string;
    endDate?: string;
    accountId?: number;
  }): Promise<TransactionSummary> {
    const res = await api.get<ApiResponse<TransactionSummary>>('/transactions/summary', { params });
    return res.data.data;
  },

  /**
   * Tạo giao dịch mới trong database và tự động điều chỉnh số dư tài khoản
   */
  async createTransaction(payload: TransactionCreatePayload): Promise<Transaction> {
    const res = await api.post<ApiResponse<any>>('/transactions', payload);
    const item = res.data.data;
    return {
      id: item.id,
      amount: item.amount,
      type: item.type,
      date: item.transactionDate || item.date,
      time: item.createdAt ? new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : undefined,
      note: item.note,
      createdAt: item.createdAt,
      account: {
        id: item.account?.id,
        name: item.account?.name,
        type: item.account?.type,
        accountNumber: item.account?.accountNumber,
        currentBalance: 0,
      },
      category: {
        id: item.category?.id,
        name: item.category?.name,
        type: item.category?.type,
        icon: item.category?.icon || 'payments',
        color: item.category?.color,
      },
    };
  },

  /**
   * Cập nhật giao dịch và hoàn tác/áp dụng số dư tương ứng
   */
  async updateTransaction(id: number, payload: TransactionUpdatePayload): Promise<Transaction> {
    const res = await api.put<ApiResponse<any>>(`/transactions/${id}`, payload);
    const item = res.data.data;
    return {
      id: item.id,
      amount: item.amount,
      type: item.type,
      date: item.transactionDate || item.date,
      time: item.createdAt ? new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : undefined,
      note: item.note,
      createdAt: item.createdAt,
      account: {
        id: item.account?.id,
        name: item.account?.name,
        type: item.account?.type,
        accountNumber: item.account?.accountNumber,
        currentBalance: 0,
      },
      category: {
        id: item.category?.id,
        name: item.category?.name,
        type: item.category?.type,
        icon: item.category?.icon || 'payments',
        color: item.category?.color,
      },
    };
  },

  /**
   * Xóa giao dịch khỏi cơ sở dữ liệu và hoàn tác số dư ví
   */
  async deleteTransaction(id: number): Promise<void> {
    await api.delete<ApiResponse<void>>(`/transactions/${id}`);
  },
};
