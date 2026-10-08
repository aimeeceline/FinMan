import { api } from './api';
import type { Budget } from '../types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface BudgetPayload {
  categoryId: number;
  month: string; // YYYY-MM
  amount: number;
}

export interface BudgetSummary {
  month: string;
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  totalOverspent: number;
  overallPercentage: number;
  budgets: Budget[];
}

export const budgetService = {
  /**
   * Lấy danh sách ngân sách theo tháng
   */
  async getBudgets(month?: string): Promise<Budget[]> {
    const params = month ? { month } : {};
    const res = await api.get<ApiResponse<Budget[]>>('/budgets', { params });
    const list = res.data.data || [];
    return list.map((b) => ({
      ...b,
      category: b.category ? {
        ...b.category,
        isDeleted: Boolean(b.category.isDeleted ?? (b.category as any).deleted),
      } : b.category,
    }));
  },

  /**
   * Lấy tổng quan ngân sách và tiến độ chi tiêu theo tháng
   */
  async getBudgetSummary(month?: string): Promise<BudgetSummary> {
    const params = month ? { month } : {};
    const res = await api.get<ApiResponse<BudgetSummary>>('/budgets/summary', { params });
    const summary = res.data.data;
    if (summary && Array.isArray(summary.budgets)) {
      summary.budgets = summary.budgets.map((b) => ({
        ...b,
        category: b.category ? {
          ...b.category,
          isDeleted: Boolean(b.category.isDeleted ?? (b.category as any).deleted),
        } : b.category,
      }));
    }
    return summary;
  },

  /**
   * Thiết lập hoặc cập nhật (Upsert) ngân sách cho danh mục
   */
  async setBudget(payload: BudgetPayload): Promise<Budget> {
    const res = await api.post<ApiResponse<Budget>>('/budgets', payload);
    return res.data.data;
  },

  /**
   * Cập nhật hạn mức ngân sách theo ID
   */
  async updateBudget(id: number, payload: BudgetPayload): Promise<Budget> {
    const res = await api.put<ApiResponse<Budget>>(`/budgets/${id}`, payload);
    return res.data.data;
  },

  /**
   * Hủy / Xóa thiết lập ngân sách theo ID
   */
  async deleteBudget(id: number): Promise<void> {
    await api.delete<ApiResponse<void>>(`/budgets/${id}`);
  },
};
