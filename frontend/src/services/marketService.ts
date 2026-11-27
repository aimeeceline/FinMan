import { api } from './api';
import type {
  MarketIndex,
  StockQuote,
  StockPriceHistory,
  StockDetail,
  UserWatchlistItem,
  WatchlistAddPayload,
  WatchlistUpdatePayload,
  StockFilterParams,
} from '../types/market';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// Dữ liệu dự phòng phong phú cho 4 chỉ số lớn khi server khởi động hoặc đang cập nhật
export const FALLBACK_MARKET_INDICES: MarketIndex[] = [
  {
    id: 1,
    code: 'VNINDEX',
    name: 'VN-Index',
    currentValue: 1268.45,
    changeValue: 5.12,
    percentChange: 0.41,
    tradingVolume: 845_200_000,
    tradingValue: 19_520_000_000_000,
    sessionStatus: 'OPEN',
    lastUpdatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    code: 'VN30',
    name: 'VN30-Index',
    currentValue: 1324.80,
    changeValue: 6.85,
    percentChange: 0.52,
    tradingVolume: 312_000_000,
    tradingValue: 9_850_000_000_000,
    sessionStatus: 'OPEN',
    lastUpdatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    code: 'HNX',
    name: 'HNX-Index',
    currentValue: 231.25,
    changeValue: -0.85,
    percentChange: -0.37,
    tradingVolume: 78_400_000,
    tradingValue: 1_650_000_000_000,
    sessionStatus: 'OPEN',
    lastUpdatedAt: new Date().toISOString(),
  },
  {
    id: 4,
    code: 'UPCOM',
    name: 'UPCoM-Index',
    currentValue: 92.15,
    changeValue: 0.32,
    percentChange: 0.35,
    tradingVolume: 42_100_000,
    tradingValue: 680_000_000_000,
    sessionStatus: 'OPEN',
    lastUpdatedAt: new Date().toISOString(),
  },
];

// Dữ liệu dự phòng cho Top cổ phiếu tiêu biểu
export const FALLBACK_STOCK_QUOTES: StockQuote[] = [
  {
    id: 1,
    symbol: 'FPT',
    companyName: 'CTCP FPT',
    exchange: 'HOSE',
    sector: 'Công nghệ thông tin',
    currentPrice: 138500,
    changePrice: 4200,
    percentChange: 3.13,
    referencePrice: 134300,
    openPrice: 135000,
    highPrice: 139000,
    lowPrice: 134500,
    ceilingPrice: 143700,
    floorPrice: 124900,
    totalVolume: 5850000,
    totalValue: 805000000000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    symbol: 'VCB',
    companyName: 'Ngân hàng TMCP Ngoại thương Việt Nam',
    exchange: 'HOSE',
    sector: 'Ngân hàng',
    currentPrice: 94200,
    changePrice: 1100,
    percentChange: 1.18,
    referencePrice: 93100,
    openPrice: 93500,
    highPrice: 94500,
    lowPrice: 93000,
    ceilingPrice: 99600,
    floorPrice: 86600,
    totalVolume: 3200000,
    totalValue: 301440000000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    symbol: 'HPG',
    companyName: 'CTCP Tập đoàn Hòa Phát',
    exchange: 'HOSE',
    sector: 'Thép & Vật liệu xây dựng',
    currentPrice: 28400,
    changePrice: 650,
    percentChange: 2.34,
    referencePrice: 27750,
    openPrice: 27900,
    highPrice: 28600,
    lowPrice: 27800,
    ceilingPrice: 29650,
    floorPrice: 25850,
    totalVolume: 24500000,
    totalValue: 695800000000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 4,
    symbol: 'MWG',
    companyName: 'CTCP Đầu tư Thế Giới Di Động',
    exchange: 'HOSE',
    sector: 'Bán lẻ',
    currentPrice: 66200,
    changePrice: -500,
    percentChange: -0.75,
    referencePrice: 66700,
    openPrice: 67000,
    highPrice: 67300,
    lowPrice: 66000,
    ceilingPrice: 71300,
    floorPrice: 62100,
    totalVolume: 8200000,
    totalValue: 542840000000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 5,
    symbol: 'SSI',
    companyName: 'CTCP Chứng khoán SSI',
    exchange: 'HOSE',
    sector: 'Dịch vụ tài chính',
    currentPrice: 32800,
    changePrice: 600,
    percentChange: 1.86,
    referencePrice: 32200,
    openPrice: 32400,
    highPrice: 33000,
    lowPrice: 32300,
    ceilingPrice: 34450,
    floorPrice: 29950,
    totalVolume: 16800000,
    totalValue: 551040000000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 6,
    symbol: 'SHS',
    companyName: 'CTCP Chứng khoán Sài Gòn - Hà Nội',
    exchange: 'HNX',
    sector: 'Dịch vụ tài chính',
    currentPrice: 15400,
    changePrice: 400,
    percentChange: 2.67,
    referencePrice: 15000,
    openPrice: 15100,
    highPrice: 15600,
    lowPrice: 15000,
    ceilingPrice: 16500,
    floorPrice: 13500,
    totalVolume: 12400000,
    totalValue: 190960000000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 7,
    symbol: 'PVS',
    companyName: 'Tổng CTCP Dịch vụ Kỹ thuật Dầu khí Việt Nam',
    exchange: 'HNX',
    sector: 'Dầu khí',
    currentPrice: 39500,
    changePrice: -300,
    percentChange: -0.75,
    referencePrice: 39800,
    openPrice: 39900,
    highPrice: 40200,
    lowPrice: 39300,
    ceilingPrice: 43700,
    floorPrice: 35900,
    totalVolume: 4300000,
    totalValue: 169850000000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 8,
    symbol: 'BSR',
    companyName: 'CTCP Lọc Hóa dầu Bình Sơn',
    exchange: 'UPCOM',
    sector: 'Dầu khí',
    currentPrice: 22800,
    changePrice: 700,
    percentChange: 3.17,
    referencePrice: 22100,
    openPrice: 22200,
    highPrice: 23100,
    lowPrice: 22100,
    ceilingPrice: 25400,
    floorPrice: 18800,
    totalVolume: 9600000,
    totalValue: 218880000000,
    updatedAt: new Date().toISOString(),
  },
];

class MarketService {
  /**
   * Lấy danh sách 4 chỉ số thị trường (VN-Index, VN30, HNX, UPCOM)
   */
  async getMarketIndices(): Promise<MarketIndex[]> {
    try {
      const response = await api.get<ApiResponse<MarketIndex[]>>('/market/indices');
      if (response.data?.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
        return response.data.data;
      }
    } catch (error) {
      console.warn('Không thể kết nối API chỉ số thị trường, sử dụng dữ liệu chuẩn fallback:', error);
    }
    return FALLBACK_MARKET_INDICES;
  }

  /**
   * Tìm kiếm, phân trang và lọc cổ phiếu niêm yết
   */
  async getStockQuotes(params: StockFilterParams = {}): Promise<PageResponse<StockQuote>> {
    try {
      const queryParams = new URLSearchParams();
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.size !== undefined) queryParams.append('size', params.size.toString());
      if (params.keyword?.trim()) queryParams.append('keyword', params.keyword.trim());
      if (params.exchange && params.exchange !== 'ALL') queryParams.append('exchange', params.exchange);
      if (params.sort) queryParams.append('sort', params.sort);

      const response = await api.get<ApiResponse<PageResponse<StockQuote>>>(
        `/market/stocks?${queryParams.toString()}`
      );
      if (response.data?.success && response.data.data?.content) {
        return response.data.data;
      }
    } catch (error) {
      console.warn('Lỗi lấy danh sách cổ phiếu từ server, sử dụng fallback:', error);
    }

    // Fallback in-memory filter
    let filtered = [...FALLBACK_STOCK_QUOTES];
    if (params.exchange && params.exchange !== 'ALL') {
      filtered = filtered.filter((s) => s.exchange.toUpperCase() === params.exchange?.toUpperCase());
    }
    if (params.keyword?.trim()) {
      const kw = params.keyword.trim().toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.symbol.toLowerCase().includes(kw) ||
          s.companyName.toLowerCase().includes(kw) ||
          (s.sector && s.sector.toLowerCase().includes(kw))
      );
    }

    const page = params.page || 0;
    const size = params.size || 20;
    const startIndex = page * size;
    const pagedContent = filtered.slice(startIndex, startIndex + size);

    return {
      content: pagedContent,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
      size,
      number: page,
      first: page === 0,
      last: startIndex + size >= filtered.length,
    };
  }

  /**
   * Lấy chi tiết thông tin cổ phiếu, 30 ngày lịch sử giá và tin tức liên quan
   */
  async getStockDetail(symbol: string): Promise<StockDetail | null> {
    try {
      const response = await api.get<ApiResponse<StockDetail>>(`/market/stocks/${symbol}`);
      if (response.data?.success && response.data.data) {
        return response.data.data;
      }
    } catch (error) {
      console.warn(`Lỗi lấy chi tiết cổ phiếu ${symbol}:`, error);
    }

    const fallbackQuote = FALLBACK_STOCK_QUOTES.find(
      (s) => s.symbol.toUpperCase() === symbol.toUpperCase()
    );
    if (!fallbackQuote) return null;

    return {
      quote: fallbackQuote,
      priceHistory: this.generateMockHistory(fallbackQuote),
      relatedNews: [],
    };
  }

  /**
   * Lấy lịch sử biến động giá EOD của cổ phiếu theo số ngày
   */
  async getStockHistory(symbol: string, days = 30): Promise<StockPriceHistory[]> {
    try {
      const response = await api.get<ApiResponse<StockPriceHistory[]>>(
        `/market/stocks/${symbol}/history?days=${days}`
      );
      if (response.data?.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    } catch (error) {
      console.warn(`Lỗi lấy lịch sử giá ${symbol}:`, error);
    }

    const fallbackQuote = FALLBACK_STOCK_QUOTES.find(
      (s) => s.symbol.toUpperCase() === symbol.toUpperCase()
    );
    return fallbackQuote ? this.generateMockHistory(fallbackQuote, days) : [];
  }

  /**
   * Kích hoạt đồng bộ thủ công dữ liệu thị trường
   */
  async triggerSync(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post<ApiResponse<void>>('/market/sync');
      return {
        success: response.data?.success ?? true,
        message: response.data?.message || 'Đồng bộ dữ liệu thị trường thành công!',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể kết nối máy chủ để đồng bộ.',
      };
    }
  }

  /**
   * Lấy danh sách Watchlist của người dùng hiện tại
   */
  async getWatchlist(): Promise<UserWatchlistItem[]> {
    try {
      const response = await api.get<ApiResponse<UserWatchlistItem[]>>('/market/watchlist');
      if (response.data?.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    } catch (error) {
      console.warn('Lỗi lấy watchlist:', error);
    }
    return [];
  }

  /**
   * Thêm mã cổ phiếu vào Watchlist
   */
  async addToWatchlist(payload: WatchlistAddPayload): Promise<UserWatchlistItem> {
    const response = await api.post<ApiResponse<UserWatchlistItem>>('/market/watchlist', payload);
    return response.data.data;
  }

  /**
   * Cập nhật thông tin mã trong Watchlist
   */
  async updateWatchlistItem(id: number, payload: WatchlistUpdatePayload): Promise<UserWatchlistItem> {
    const response = await api.put<ApiResponse<UserWatchlistItem>>(`/market/watchlist/${id}`, payload);
    return response.data.data;
  }

  /**
   * Xóa mã khỏi Watchlist (theo ID hoặc Symbol)
   */
  async removeFromWatchlist(symbolOrId: string | number): Promise<void> {
    await api.delete(`/market/watchlist/${symbolOrId}`);
  }

  /**
   * Tự sinh mock 30 ngày lịch sử giá thực tế cho fallback UI
   */
  private generateMockHistory(quote: StockQuote, days = 30): StockPriceHistory[] {
    const list: StockPriceHistory[] = [];
    let current = quote.currentPrice;
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      if (d.getDay() === 0 || d.getDay() === 6) continue; // Skip weekends

      const fluctuation = (Math.random() - 0.48) * 0.035;
      const open = Math.round(current * (1 - (Math.random() - 0.5) * 0.015));
      const close = Math.round(current * (1 + fluctuation));
      const high = Math.max(open, close) + Math.round(Math.random() * 500);
      const low = Math.min(open, close) - Math.round(Math.random() * 500);
      const diff = close - open;
      const pct = (diff / open) * 100;

      list.push({
        tradeDate: d.toISOString().split('T')[0],
        openPrice: open,
        highPrice: high,
        lowPrice: low,
        closePrice: close,
        volume: Math.floor(Math.random() * 8000000) + 1500000,
        totalValue: Math.floor(close * 3500000),
        changePrice: diff,
        percentChange: Number(pct.toFixed(2)),
      });

      current = close;
    }

    return list;
  }
}

export const marketService = new MarketService();

