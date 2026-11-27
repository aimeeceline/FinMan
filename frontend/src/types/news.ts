export type NewsSentiment = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

export interface NewsCategory {
  id: number;
  code: string;
  nameVi: string;
  description?: string;
  displayOrder: number;
  createdAt?: string;
}

export interface NewsSource {
  id: number;
  code: string;
  name: string;
  baseUrl: string;
  rssUrl?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface NewsArticle {
  id: number;
  title: string;
  description?: string;
  contentSnippet?: string;
  originalUrl: string;
  thumbnailUrl?: string;
  imageCaption?: string;
  author?: string;
  publishedAt: string;
  fetchedAt?: string;
  sourceId?: number;
  sourceCode?: string;
  sourceName?: string;
  categoryId?: number;
  categoryCode?: string;
  categoryName?: string;
  isAiProcessed?: boolean;
  isSaved?: boolean;
  bulletPoints?: string | string[];
  sentiment?: NewsSentiment | string;
  sentimentReason?: string;
  impactAnalysis?: string;
  relatedTickers?: string | string[];
  tags?: string | string[];
}

export interface NewsPageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first?: boolean;
  last?: boolean;
}

export interface NewsFilterParams {
  categoryId?: number;
  categoryCode?: string;
  sourceId?: number;
  sourceCode?: string;
  keyword?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}

/**
 * Chuyển đổi chuỗi JSON hoặc mảng bulletPoints từ Backend sang mảng chuỗi hiển thị
 */
export const parseBulletPoints = (bulletPoints?: string | string[] | null): string[] => {
  if (!bulletPoints) return [];
  if (Array.isArray(bulletPoints)) {
    return bulletPoints.map((b) => String(b).trim()).filter(Boolean);
  }
  const trimmed = bulletPoints.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // Fallback sang tách dòng bên dưới
    }
  }
  return trimmed
    .split(/\r?\n|•/)
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
};

/**
 * Chuyển đổi danh sách mã cổ phiếu liên quan ("FPT,VCB" hoặc ["FPT", "VCB"]) sang mảng chuẩn
 */
export const parseRelatedTickers = (relatedTickers?: string | string[] | null): string[] => {
  if (!relatedTickers) return [];
  if (Array.isArray(relatedTickers)) {
    return relatedTickers.map((t) => String(t).trim().toUpperCase()).filter(Boolean);
  }
  return relatedTickers
    .split(/[,;\s]+/)
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);
};

/**
 * Chuyển đổi danh sách tags ("#taichinh,#chungkhoan") sang mảng chuỗi
 */
export const parseNewsTags = (tags?: string | string[] | null): string[] => {
  if (!tags) return [];
  if (Array.isArray(tags)) {
    return tags
      .map((t) => String(t).trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));
  }
  return tags
    .split(/[,;\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith('#') ? t : `#${t}`));
};

/**
 * Định dạng thời gian xuất bản thân thiện bằng tiếng Việt (ví dụ: "15 phút trước", "2 giờ trước")
 */
export const formatRelativeTimeVi = (isoDate?: string): string => {
  if (!isoDate) return 'Mới cập nhật';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Định dạng đầy đủ ngày giờ tiếng Việt cho Modal chi tiết bài báo
 */
export const formatFullDateTimeVi = (isoDate?: string): string => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;

  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export interface MarketTickerItem {
  symbol: string;
  nameVi: string;
  value: string;
  change: string;
  changePercent: string;
  isPositive: boolean | null; // true: green, false: red, null: neutral/gold
  category: 'INDEX' | 'CURRENCY' | 'COMMODITY' | 'CRYPTO';
}

export interface SpotlightStockItem {
  ticker: string;
  name: string;
  price: string;
  changePercent: string;
  isPositive: boolean;
  volume: string;
  industry: string;
}

export interface MarketMatrixAsset {
  symbol: string;
  name: string;
  exchange: string;
  value: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
}

export interface ExpertInsight {
  authorName: string;
  title: string;
  organization: string;
  avatarUrl?: string;
  quote: string;
  highlightCategory: string;
  dateStr: string;
}

export const DEFAULT_MARKET_TICKERS: MarketTickerItem[] = [
  { symbol: 'VN-INDEX', nameVi: 'VN-Index', value: '1,284.50', change: '+12.45', changePercent: '+0.98%', isPositive: true, category: 'INDEX' },
  { symbol: 'VN30', nameVi: 'VN30-Index', value: '1,342.10', change: '+15.20', changePercent: '+1.15%', isPositive: true, category: 'INDEX' },
  { symbol: 'HNX-INDEX', nameVi: 'HNX-Index', value: '238.75', change: '-0.85', changePercent: '-0.35%', isPositive: false, category: 'INDEX' },
  { symbol: 'UPCOM', nameVi: 'UPCoM', value: '92.40', change: '+0.12', changePercent: '+0.13%', isPositive: true, category: 'INDEX' },
  { symbol: 'S&P 500', nameVi: 'S&P 500', value: '5,892.30', change: '+34.10', changePercent: '+0.58%', isPositive: true, category: 'INDEX' },
  { symbol: 'NASDAQ', nameVi: 'Nasdaq Composite', value: '18,518.61', change: '+118.25', changePercent: '+0.64%', isPositive: true, category: 'INDEX' },
  { symbol: 'USD/VND', nameVi: 'Tỷ giá USD/VND', value: '25,340', change: '-15.00', changePercent: '-0.06%', isPositive: false, category: 'CURRENCY' },
  { symbol: 'VÀNG SJC', nameVi: 'Vàng miếng SJC', value: '86.50 Tr', change: '+0.50', changePercent: '+0.58%', isPositive: true, category: 'COMMODITY' },
  { symbol: 'DẦU BRENT', nameVi: 'Dầu thô Brent', value: '74.20 $', change: '-0.45', changePercent: '-0.60%', isPositive: false, category: 'COMMODITY' },
  { symbol: 'BTC/USD', nameVi: 'Bitcoin', value: '89,450 $', change: '+2,150', changePercent: '+2.46%', isPositive: true, category: 'CRYPTO' },
];

export const DEFAULT_SPOTLIGHT_STOCKS: SpotlightStockItem[] = [
  { ticker: 'FPT', name: 'CTCP FPT', price: '138,500', changePercent: '+3.20%', isPositive: true, volume: '4.8M', industry: 'Công nghệ' },
  { ticker: 'VCB', name: 'Ngân hàng TMCP Ngoại thương', price: '94,200', changePercent: '+1.15%', isPositive: true, volume: '2.1M', industry: 'Ngân hàng' },
  { ticker: 'HPG', name: 'Tập đoàn Hòa Phát', price: '28,400', changePercent: '+2.42%', isPositive: true, volume: '18.5M', industry: 'Thép & VLXD' },
  { ticker: 'MWG', name: 'Thế Giới Di Động', price: '66,200', changePercent: '-0.75%', isPositive: false, volume: '5.2M', industry: 'Bán lẻ' },
  { ticker: 'SSI', name: 'Chứng khoán SSI', price: '32,800', changePercent: '+1.89%', isPositive: true, volume: '12.3M', industry: 'Tài chính' },
];

export const DEFAULT_MARKET_MATRIX: Record<'INDICES' | 'FOREX' | 'COMMODITIES', MarketMatrixAsset[]> = {
  INDICES: [
    { symbol: 'VN-INDEX', name: 'Chỉ số sàn HOSE', exchange: 'HOSE', value: '1,284.50', change: '+12.45', changePercent: '+0.98%', isPositive: true },
    { symbol: 'VN30', name: 'Nhóm 30 cổ phiếu dẫn dắt', exchange: 'HOSE', value: '1,342.10', change: '+15.20', changePercent: '+1.15%', isPositive: true },
    { symbol: 'HNX-INDEX', name: 'Chỉ số sàn Hà Nội', exchange: 'HNX', value: '238.75', change: '-0.85', changePercent: '-0.35%', isPositive: false },
    { symbol: 'DOW JONES', name: 'Công nghiệp Dow Jones', exchange: 'NYSE', value: '43,444.99', change: '+288.73', changePercent: '+0.67%', isPositive: true },
    { symbol: 'S&P 500', name: 'Tiêu chuẩn & Nghèo 500', exchange: 'CBOE', value: '5,892.30', change: '+34.10', changePercent: '+0.58%', isPositive: true },
    { symbol: 'NIKKEI 225', name: 'Chỉ số Nhật Bản', exchange: 'TSE', value: '38,642.91', change: '+378.10', changePercent: '+0.99%', isPositive: true },
  ],
  FOREX: [
    { symbol: 'USD/VND', name: 'Đô la Mỹ / Việt Nam Đồng', exchange: 'VCB', value: '25,340', change: '-15', changePercent: '-0.06%', isPositive: false },
    { symbol: 'EUR/VND', name: 'Euro / Việt Nam Đồng', exchange: 'VCB', value: '26,820', change: '+85', changePercent: '+0.32%', isPositive: true },
    { symbol: 'JPY/VND', name: 'Yên Nhật / Việt Nam Đồng', exchange: 'VCB', value: '164.50', change: '+0.80', changePercent: '+0.49%', isPositive: true },
    { symbol: 'GBP/VND', name: 'Bảng Anh / Việt Nam Đồng', exchange: 'VCB', value: '32,150', change: '+110', changePercent: '+0.34%', isPositive: true },
  ],
  COMMODITIES: [
    { symbol: 'VÀNG SJC', name: 'Vàng miếng SJC', exchange: 'SJC', value: '86.50 Tr/lượng', change: '+0.50', changePercent: '+0.58%', isPositive: true },
    { symbol: 'VÀNG NHẪN 9999', name: 'Vàng nhẫn trơn', exchange: 'Bảo Tín MC', value: '84.80 Tr/lượng', change: '+0.40', changePercent: '+0.47%', isPositive: true },
    { symbol: 'DẦU BRENT', name: 'Dầu thô Brent', exchange: 'ICE', value: '74.20 $/thùng', change: '-0.45', changePercent: '-0.60%', isPositive: false },
    { symbol: 'DẦU WTI', name: 'Dầu thô nhẹ WTI', exchange: 'NYMEX', value: '70.15 $/thùng', change: '-0.38', changePercent: '-0.54%', isPositive: false },
  ],
};

export const DEFAULT_EXPERT_INSIGHT: ExpertInsight = {
  authorName: 'Ông Đặng Hoàng Hải, CFA',
  title: 'Giám đốc Chiến lược Đầu tư',
  organization: 'FinMan Financial Research',
  quote: 'Áp lực tỷ giá hạ nhiệt mở ra dư địa nới lỏng chính sách tiền tệ. Nhóm cổ phiếu tài chính và bán lẻ đang hội tụ định giá hấp dẫn cho chu kỳ tăng trưởng mới.',
  highlightCategory: 'Chiến Lược Vĩ Mô Q4',
  dateStr: 'Hôm nay',
};


