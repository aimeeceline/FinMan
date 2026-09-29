import { api } from './api';

export interface CategoryBreakdownItem {
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  type: 'INCOME' | 'EXPENSE';
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

export interface DailyCashflowItem {
  date: string;
  income: number;
  expense: number;
  netCashFlow: number;
}

export interface TopExpenseItem {
  id: number;
  amount: number;
  transactionDate: string;
  note?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  accountName?: string;
}

export interface StatisticsOverview {
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  savingsRate: number;
  expenseRate: number;
  transactionCount: number;
  averageDailyExpense: number;
  highestExpenseDate?: string;
  highestExpenseDayAmount?: number;
  categoryBreakdown: CategoryBreakdownItem[];
  dailyTrends: DailyCashflowItem[];
  topExpenses: TopExpenseItem[];
}

export interface StatisticsFilterParams {
  month?: string;
  startDate?: string;
  endDate?: string;
  from?: string;
  to?: string;
  accountId?: number;
  categoryId?: number;
  type?: 'INCOME' | 'EXPENSE';
}

export const statisticsService = {
  /**
   * Lấy dữ liệu tổng quan thống kê tài chính
   */
  async getOverview(params?: StatisticsFilterParams): Promise<StatisticsOverview> {
    const res = await api.get('/statistics/overview', { params });
    return res.data?.data || res.data;
  },

  /**
   * Lấy cơ cấu phân bổ danh mục thu hoặc chi
   */
  async getCategories(params?: StatisticsFilterParams): Promise<CategoryBreakdownItem[]> {
    const res = await api.get('/statistics/categories', { params });
    return res.data?.data || res.data;
  },

  /**
   * Lấy xu hướng dòng tiền theo ngày
   */
  async getDailyTrends(params?: StatisticsFilterParams): Promise<DailyCashflowItem[]> {
    const res = await api.get('/statistics/daily', { params });
    return res.data?.data || res.data;
  },

  /**
   * Tải file báo cáo Excel (.xlsx) trực tiếp về máy
   */
  async exportExcel(params?: StatisticsFilterParams): Promise<void> {
    const res = await api.get('/export/excel', {
      params,
      responseType: 'blob',
    });

    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const now = new Date();
    const dateStr = params?.month || `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const filename = `FinMan_BaoCao_TaiChinh_${dateStr}.xlsx`;

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
