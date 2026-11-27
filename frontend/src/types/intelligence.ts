export interface MarketPulseItem {
  code: string;
  name: string;
  currentValue: number;
  changeValue: number;
  percentChange: number;
  tradingVolume?: number;
  tradingValue?: number;
  sessionStatus?: string;
  isPositive: boolean;
}

export interface HeadlineItem {
  id: number;
  title: string;
  sourceName: string;
  categoryName: string;
  publishedAt: string;
  summaryBullets: string[];
  sentiment: string; // 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
  originalUrl: string;
  relatedTickers: string[];
}

export interface PersonalFinancialAlert {
  dayOfMonth: number;
  daysInMonth: number;
  monthProgressPercent: number;
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  spentPercentage: number;
  alertLevel: 'SAFE' | 'WARNING' | 'DANGER' | 'INFO';
  title: string;
  message: string;
  recommendation: string;
  highestCategoryName?: string;
  highestCategoryPercent?: number;
}

export interface DailyIntelligenceData {
  id: number;
  digestDate: string; // "YYYY-MM-DD"
  aiMacroSummary: string;
  marketPulse: MarketPulseItem[];
  topHeadlines: HeadlineItem[];
  keyTakeaways: string[];
  suggestedPrompts: string[];
  personalAlert?: PersonalFinancialAlert;
  status: string;
  createdAt: string;
}
