import { api } from './api';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: {
    code: string;
    details?: any;
  };
}

export interface AiQuickAddItem {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  accountId: number;
  accountName: string;
  accountType: string;
  transactionDate: string; // YYYY-MM-DD
  note: string;
  source?: string;
}

export interface AiQuickAddResult {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  accountId: number;
  accountName: string;
  accountType: string;
  transactionDate: string; // YYYY-MM-DD
  note: string;
  rawText: string;
  source?: string;
  items?: AiQuickAddItem[];
}

export interface AiInsightsKeyMetrics {
  savingsRate?: number;
  highestExpenseCategory?: string;
  highestExpenseAmount?: number;
  highestExpensePercentage?: number;
  incomeChangePercentage?: number;
  expenseChangePercentage?: number;
  savingsChangePercentage?: number;
}

export interface CategorySpendingItem {
  categoryId?: number;
  categoryName: string;
  categoryIcon?: string;
  totalAmount: number;
  percentage: number;
}

export interface AiInsightsResult {
  month: string;
  overview: string;
  recommendations: string[];
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate?: number;
  keyMetrics?: AiInsightsKeyMetrics;
  topExpenseCategories?: CategorySpendingItem[];
  alerts?: string[];
  generatedAt: string;
}

export interface AiStatusResult {
  geminiConnected: boolean;
  model: string;
  mode: string;
}

export interface AiChatResult {
  responseType: 'QUICK_ADD' | 'QUERY_ANSWER' | 'INSIGHTS';
  text: string;
  source: string;
  items?: AiQuickAddItem[];
  insights?: AiInsightsResult;
  metadata?: Record<string, any>;
  timestamp: string;
}

export const aiService = {
  /**
   * Tương tác trò chuyện thông minh với FinMan AI (Tự động nhận diện Quick Add, Truy vấn dữ liệu, Báo cáo)
   */
  async chat(
    message: string,
    conversationHistory?: { role: string; content: string }[]
  ): Promise<AiChatResult> {
    const res = await api.post<ApiResponse<AiChatResult>>('/ai/chat', {
      message,
      conversationHistory,
    });
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể xử lý yêu cầu AI');
    }
    return res.data.data;
  },

  /**
   * Truy vấn số liệu tài chính trực tiếp qua AI
   */
  async query(
    message: string,
    conversationHistory?: { role: string; content: string }[]
  ): Promise<AiChatResult> {
    const res = await api.post<ApiResponse<AiChatResult>>('/ai/query', {
      message,
      conversationHistory,
    });
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể truy vấn dữ liệu');
    }
    return res.data.data;
  },

  /**
   * Bóc tách câu nói tự nhiên tiếng Việt ra dữ liệu giao dịch tài chính
   */
  async quickAdd(text: string): Promise<AiQuickAddResult> {
    const res = await api.post<ApiResponse<AiQuickAddResult>>('/ai/quick-add', { text });
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể nhận diện giao dịch');
    }
    return res.data.data;
  },

  /**
   * Tạo nhận xét chi tiêu tài chính hàng tháng từ Gemini AI
   */
  async getMonthlyInsights(month?: string): Promise<AiInsightsResult> {
    const res = await api.post<ApiResponse<AiInsightsResult>>('/ai/insights', { month });
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể tạo nhận xét tài chính');
    }
    return res.data.data;
  },

  /**
   * Kiểm tra trạng thái kết nối Google Gemini API
   */
  async getStatus(): Promise<AiStatusResult> {
    const res = await api.get<ApiResponse<AiStatusResult>>('/ai/status');
    return res.data.data;
  },
};

