export interface MarketIndex {
  id: number;
  code: string;
  name: string;
  currentValue: number;
  changeValue: number;
  percentChange: number;
  tradingVolume: number;
  tradingValue: number;
  sessionStatus?: 'OPEN' | 'CLOSED' | 'INTERMISSION' | string;
  lastUpdatedAt: string;
}

export interface StockQuote {
  id: number;
  symbol: string;
  companyName: string;
  exchange: 'HOSE' | 'HNX' | 'UPCOM' | string;
  sector?: string;
  currentPrice: number; // Stored as integer VND (e.g. 138500)
  changePrice: number;
  percentChange: number;
  referencePrice: number;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  ceilingPrice?: number;
  floorPrice?: number;
  totalVolume: number;
  totalValue: number;
  updatedAt: string;
}

export interface StockPriceHistory {
  id?: number;
  tradeDate: string; // YYYY-MM-DD
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  volume: number;
  totalValue: number;
  changePrice: number;
  percentChange: number;
}

export interface StockDetail {
  quote: StockQuote;
  priceHistory: StockPriceHistory[];
  relatedNews: any[];
}

export interface UserWatchlistItem {
  id: number;
  symbol: string;
  companyName: string;
  exchange: string;
  sector?: string;
  currentPrice: number;
  changePrice: number;
  percentChange: number;
  referencePrice: number;
  totalVolume: number;
  note?: string;
  targetPrice?: number;
  alertEnabled: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface WatchlistAddPayload {
  symbol: string;
  note?: string;
  targetPrice?: number;
  alertEnabled?: boolean;
}

export interface WatchlistUpdatePayload {
  note?: string;
  targetPrice?: number;
  alertEnabled?: boolean;
  displayOrder?: number;
}

export interface StockFilterParams {
  page?: number;
  size?: number;
  keyword?: string;
  exchange?: string;
  sort?: string;
}

// ================= Formatter Utilities =================

/**
 * Định dạng giá cổ phiếu VND (VD: 138500 -> 138.500 ₫)
 */
export const formatVndPrice = (price?: number | null): string => {
  if (price === null || price === undefined) return '0 ₫';
  return `${Math.round(price).toLocaleString('vi-VN')} ₫`;
};

/**
 * Định dạng biến động giá kèm dấu + / - (VD: +4.200 ₫)
 */
export const formatChangePrice = (change?: number | null): string => {
  if (change === null || change === undefined) return '0 ₫';
  const prefix = change > 0 ? '+' : '';
  return `${prefix}${Math.round(change).toLocaleString('vi-VN')} ₫`;
};

/**
 * Định dạng % biến động (VD: +3.13%)
 */
export const formatPercent = (percent?: number | null): string => {
  if (percent === null || percent === undefined) return '0.00%';
  const prefix = percent > 0 ? '+' : '';
  return `${prefix}${percent.toFixed(2)}%`;
};

/**
 * Định dạng khối lượng cổ phiếu (VD: 12500000 -> 12,50M cp)
 */
export const formatVolume = (vol?: number | null): string => {
  if (!vol || vol <= 0) return '0 cp';
  if (vol >= 1_000_000_000) {
    return `${(vol / 1_000_000_000).toFixed(2)}B cp`;
  }
  if (vol >= 1_000_000) {
    return `${(vol / 1_000_000).toFixed(2)}M cp`;
  }
  if (vol >= 1_000) {
    return `${(vol / 1_000).toFixed(1)}K cp`;
  }
  return `${vol.toLocaleString('vi-VN')} cp`;
};

/**
 * Định dạng giá trị giao dịch (VNĐ sang Tỷ VNĐ)
 */
export const formatTradingValueTyd = (val?: number | null): string => {
  if (!val || val <= 0) return '0 tỷ';
  const tyDong = val / 1_000_000_000;
  if (tyDong >= 1_000) {
    return `${(tyDong / 1_000).toFixed(2)} nghìn tỷ`;
  }
  return `${tyDong.toFixed(1).replace('.0', '')} tỷ`;
};

