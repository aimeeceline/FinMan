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

export interface AiMessageSource {
  id: number;
  citationIndex: number;
  articleId?: number;
  sourceTitle: string;
  sourceUrl?: string;
  sourceName?: string;
  snippet?: string;
  relevanceScore?: number;
  createdAt: string;
}

export interface AiMessage {
  id: number;
  conversationId: number;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  tokensUsed?: number;
  createdAt: string;
  sources?: AiMessageSource[];
}

export interface AiConversation {
  id: number;
  userId: number;
  title: string;
  modelVersion?: string;
  isPinned: boolean;
  isArchived: boolean;
  contextMetadata?: string;
  createdAt: string;
  updatedAt: string;
  messages?: AiMessage[];
}

export interface PersonalizedInsightItem {
  topic: string;
  macroTitle: string;
  impactType: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'WARNING';
  personalSituation: string;
  quantitativeCalculation: string;
  estimatedFinancialImpactVnd: number;
  recommendedAction: string;
  citationIndices: number[];
}

export interface PersonalizedInsightResponse {
  summary: string;
  netWorthVnd?: number;
  liquidAssetsVnd?: number;
  cashRunwayMonths?: number;
  runwayAssessment?: string;
  insights: PersonalizedInsightItem[];
  retrievedNews?: any[];
  disclaimer: string;
  modelVersion: string;
  generatedAt: string;
}

export interface MacroImpactEvaluationResponse {
  macroTopic: string;
  estimatedChangePct: number;
  affectedBalanceVnd?: number;
  annualImpactVnd?: number;
  monthlyImpactVnd?: number;
  calculationFormula: string;
  impactDescription: string;
  recommendation: string;
  disclaimer: string;
  calculatedAt: string;
}

export const aiChatService = {
  /**
   * Lấy danh sách các phiên trò chuyện của người dùng hiện tại
   */
  async getConversations(): Promise<AiConversation[]> {
    const res = await api.get<ApiResponse<AiConversation[]>>('/ai/conversations');
    return res.data.data || [];
  },

  /**
   * Tạo phiên trò chuyện mới
   */
  async createConversation(title?: string): Promise<AiConversation> {
    const res = await api.post<ApiResponse<AiConversation>>('/ai/conversations', { title });
    return res.data.data;
  },

  /**
   * Lấy chi tiết phiên trò chuyện kèm toàn bộ tin nhắn và trích dẫn [Citations]
   */
  async getConversationDetail(id: number): Promise<AiConversation> {
    const res = await api.get<ApiResponse<AiConversation>>(`/ai/conversations/${id}`);
    return res.data.data;
  },

  /**
   * Gửi tin nhắn tiếp nối vào phiên trò chuyện
   */
  async sendMessage(conversationId: number, message: string): Promise<AiMessage> {
    const res = await api.post<ApiResponse<AiMessage>>(`/ai/conversations/${conversationId}/messages`, {
      message,
    });
    return res.data.data;
  },

  /**
   * Gửi tin nhắn qua endpoint Chat v2 (tự động tạo phiên nếu chưa có conversationId)
   */
  async chatV2(message: string, conversationId?: number): Promise<AiMessage> {
    const res = await api.post<ApiResponse<AiMessage>>('/ai/chat/v2', {
      message,
      conversationId,
    });
    return res.data.data;
  },

  /**
   * Ghim / bỏ ghim phiên trò chuyện
   */
  async togglePin(id: number): Promise<AiConversation> {
    const res = await api.put<ApiResponse<AiConversation>>(`/ai/conversations/${id}/pin`);
    return res.data.data;
  },

  /**
   * Xóa phiên trò chuyện
   */
  async deleteConversation(id: number): Promise<void> {
    await api.delete<ApiResponse<void>>(`/ai/conversations/${id}`);
  },

  /**
   * Lưu trữ phiên trò chuyện
   */
  async archiveConversation(id: number): Promise<void> {
    await api.put<ApiResponse<void>>(`/ai/conversations/${id}/archive`);
  },

  /**
   * Lấy nhận định tài chính cá nhân hóa kết hợp vĩ mô
   */
  async getPersonalizedInsights(topic?: string): Promise<PersonalizedInsightResponse> {
    const res = await api.get<ApiResponse<PersonalizedInsightResponse>>('/ai/personalized-insights', {
      params: topic ? { topic } : undefined,
    });
    return res.data.data;
  },

  /**
   * Đánh giá kịch bản biến động vĩ mô giả định
   */
  async evaluateMacroImpact(
    macroTopic: string,
    estimatedChangePct: number
  ): Promise<MacroImpactEvaluationResponse> {
    const res = await api.post<ApiResponse<MacroImpactEvaluationResponse>>('/ai/macro-impact', {
      macroTopic,
      estimatedChangePct,
    });
    return res.data.data;
  },
};

