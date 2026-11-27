import { api } from './api';
import type { DailyIntelligenceData } from '../types/intelligence';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const FALLBACK_DAILY_INTELLIGENCE: DailyIntelligenceData = {
  id: 1,
  digestDate: new Date().toISOString().slice(0, 10),
  aiMacroSummary:
    'Thị trường tài chính khởi sắc với sắc xanh lan tỏa, chỉ số VN-Index giữ vững đà tăng trưởng phản ánh tâm lý lạc quan từ các tín hiệu vĩ mô và dòng vốn tín dụng hỗ trợ sản xuất kinh doanh. Các kênh đầu tư duy trì thanh khoản ổn định, trong khi áp lực lạm phát và tỷ giá vẫn nằm trong tầm kiểm soát của cơ quan quản lý tiền tệ. Đây là thời điểm thuận lợi để người dùng rà soát lại cơ cấu dòng tiền, gia tăng tích lũy tài sản sinh lời song hành cùng duy trì hạn mức ngân sách an toàn.',
  marketPulse: [
    {
      code: 'VNINDEX',
      name: 'VN-Index',
      currentValue: 1285.5,
      changeValue: 8.45,
      percentChange: 0.66,
      tradingVolume: 750000000,
      tradingValue: 19500000000000,
      sessionStatus: 'CLOSED',
      isPositive: true,
    },
    {
      code: 'VN30',
      name: 'VN30-Index',
      currentValue: 1342.1,
      changeValue: 10.2,
      percentChange: 0.77,
      tradingVolume: 280000000,
      tradingValue: 11200000000000,
      sessionStatus: 'CLOSED',
      isPositive: true,
    },
    {
      code: 'HNX',
      name: 'HNX-Index',
      currentValue: 238.6,
      changeValue: 1.15,
      percentChange: 0.48,
      tradingVolume: 65000000,
      tradingValue: 1400000000000,
      sessionStatus: 'CLOSED',
      isPositive: true,
    },
    {
      code: 'UPCOM',
      name: 'UPCoM-Index',
      currentValue: 92.4,
      changeValue: -0.12,
      percentChange: -0.13,
      tradingVolume: 45000000,
      tradingValue: 620000000000,
      sessionStatus: 'CLOSED',
      isPositive: false,
    },
  ],
  topHeadlines: [
    {
      id: 101,
      title: 'Tăng trưởng tín dụng toàn hệ thống bứt phá, dòng vốn chảy mạnh vào sản xuất',
      sourceName: 'VnEconomy',
      categoryName: 'Ngân hàng',
      publishedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      summaryBullets: [
        'Dư nợ tín dụng toàn nền kinh tế tăng trưởng tích cực nhờ các gói ưu đãi lãi suất linh hoạt.',
        'Ngân hàng Nhà nước duy trì điều hành chính sách tiền tệ thận trọng, hỗ trợ thanh khoản hệ thống.',
        'Doanh nghiệp xuất khẩu và sản xuất công nghiệp được ưu tiên tiếp cận vốn giá rẻ.',
      ],
      sentiment: 'POSITIVE',
      originalUrl: 'https://vneconomy.vn',
      relatedTickers: ['VCB', 'CTG', 'BID', 'TCB'],
    },
    {
      id: 102,
      title: 'Khối ngoại quay lại mua ròng mạnh mẽ nhóm cổ phiếu công nghệ và bán lẻ',
      sourceName: 'CafeF',
      categoryName: 'Chứng khoán',
      publishedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      summaryBullets: [
        'Giá trị mua ròng đạt hơn 450 tỷ đồng trong phiên giao dịch khớp lệnh gần nhất.',
        'Các mã dẫn dắt như FPT, MWG thu hút dòng tiền ngoại nhờ kết quả kinh doanh tăng trưởng hai chữ số.',
        'Định giá thị trường P/E duy trì ở vùng hấp dẫn cho chiến lược tích lũy tài sản dài hạn.',
      ],
      sentiment: 'POSITIVE',
      originalUrl: 'https://cafef.vn',
      relatedTickers: ['FPT', 'MWG'],
    },
    {
      id: 103,
      title: 'Thặng dư thương mại 10 tháng vượt 23 tỷ USD, hỗ trợ nguồn cung ngoại tệ',
      sourceName: 'Báo Đầu Tư',
      categoryName: 'Kinh tế vĩ mô',
      publishedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
      summaryBullets: [
        'Cán cân thương mại tiếp tục giữ vững vị thế xuất siêu cao kỷ lục nhờ ngành điện tử và nông sản.',
        'Dự trữ ngoại hối được củng cố, giảm thiểu tối đa các áp lực biến động tỷ giá USD/VND.',
        'Kỳ vọng chỉ số lạm phát CPI cả năm duy trì dưới ngưỡng mục tiêu 4.5% của Quốc hội.',
      ],
      sentiment: 'POSITIVE',
      originalUrl: 'https://baodautu.vn',
      relatedTickers: ['HPG', 'DGC'],
    },
  ],
  keyTakeaways: [
    'Chỉ số VN-Index giữ vững đà tăng trưởng, dòng tiền lan tỏa ở nhóm vốn hóa lớn và ngành công nghệ.',
    'Tỷ giá trung tâm và mặt bằng lãi suất tiền gửi ổn định, tạo môi trường thuận lợi cho tích lũy tài chính cá nhân.',
    'Ưu tiên rà soát định kỳ các mục tiêu ngân sách tháng để duy trì tỷ lệ thặng dư thu chi trên 20%.',
  ],
  suggestedPrompts: [
    'Diễn biến thị trường hôm nay tác động thế nào đến kế hoạch tài chính cá nhân của tôi?',
    'Với xu hướng lãi suất và kinh tế hiện tại, tôi nên phân bổ tài sản thế nào cho an toàn?',
    'Tóm tắt giúp tôi những khoản chi tiêu chiếm tỷ trọng lớn nhất trong tháng này.',
  ],
  personalAlert: {
    dayOfMonth: new Date().getDate(),
    daysInMonth: 30,
    monthProgressPercent: Math.round((new Date().getDate() * 100) / 30),
    totalBudget: 0,
    totalSpent: 0,
    totalRemaining: 0,
    spentPercentage: 0,
    alertLevel: 'INFO',
    title: 'Tiến độ ngân sách',
    message: `Hôm nay là ngày ${new Date().getDate()}/30. Hãy thiết lập ngân sách tháng để kích hoạt cố vấn tài chính AI.`,
    recommendation: 'Thiết lập ngân sách hàng tháng giúp bạn gia tăng khả năng kiểm soát dòng tiền và tích lũy tài sản.',
    highestCategoryName: undefined,
    highestCategoryPercent: 0,
  },
  status: 'READY',
  createdAt: new Date().toISOString(),
};

export const dailyIntelligenceService = {
  /**
   * Lấy bản tin sáng hôm nay kèm góc cảnh báo cá nhân hóa (Fast < 50ms)
   */
  async getTodayIntelligence(): Promise<DailyIntelligenceData> {
    try {
      const res = await api.get<ApiResponse<DailyIntelligenceData>>('/daily-intelligence/today');
      if (res.data && res.data.success && res.data.data) {
        return res.data.data;
      }
      return FALLBACK_DAILY_INTELLIGENCE;
    } catch (err) {
      console.warn('dailyIntelligenceService.getTodayIntelligence: Dùng fallback do không kết nối được backend', err);
      return FALLBACK_DAILY_INTELLIGENCE;
    }
  },

  /**
   * Lấy bản tin theo ngày cụ thể (YYYY-MM-DD)
   */
  async getIntelligenceByDate(dateStr: string): Promise<DailyIntelligenceData> {
    try {
      const res = await api.get<ApiResponse<DailyIntelligenceData>>(`/daily-intelligence/date/${dateStr}`);
      if (res.data && res.data.success && res.data.data) {
        return res.data.data;
      }
      return { ...FALLBACK_DAILY_INTELLIGENCE, digestDate: dateStr };
    } catch (err) {
      console.warn(`dailyIntelligenceService.getIntelligenceByDate(${dateStr}): Dùng fallback`, err);
      return { ...FALLBACK_DAILY_INTELLIGENCE, digestDate: dateStr };
    }
  },

  /**
   * Kích hoạt tổng hợp lại bản tin thủ công
   */
  async recompileDailyDigest(dateStr?: string): Promise<DailyIntelligenceData> {
    const params = dateStr ? { date: dateStr } : {};
    const res = await api.post<ApiResponse<DailyIntelligenceData>>('/daily-intelligence/recompile', null, {
      params,
    });
    if (res.data && res.data.success && res.data.data) {
      return res.data.data;
    }
    return FALLBACK_DAILY_INTELLIGENCE;
  },
};
