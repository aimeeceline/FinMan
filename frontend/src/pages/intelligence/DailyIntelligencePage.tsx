import React, { useState, useEffect, useCallback } from 'react';
import type { DailyIntelligenceData, HeadlineItem } from '../../types/intelligence';
import { dailyIntelligenceService } from '../../services/dailyIntelligenceService';
import { MarketPulseCard } from '../../components/intelligence/MarketPulseCard';
import { TopHeadlinesList } from '../../components/intelligence/TopHeadlinesList';
import { PersonalAlertCard } from '../../components/intelligence/PersonalAlertCard';
import { NewsDetailModal } from '../../components/news/NewsDetailModal';
import type { NewsArticle } from '../../types/news';

interface DailyIntelligencePageProps {
  onNavigateToNews?: (ticker?: string) => void;
  onNavigateToMarket?: () => void;
  onNavigateToBudget?: () => void;
  onAskAiPrompt?: (prompt: string) => void;
}

export const DailyIntelligencePage: React.FC<DailyIntelligencePageProps> = ({
  onNavigateToNews,
  onNavigateToMarket,
  onNavigateToBudget,
  onAskAiPrompt,
}) => {
  const [data, setData] = useState<DailyIntelligenceData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Article reading modal state
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const loadDigest = useCallback(async (dateStr: string) => {
    setIsLoading(true);
    try {
      const isToday = dateStr === new Date().toISOString().slice(0, 10);
      const res = isToday
        ? await dailyIntelligenceService.getTodayIntelligence()
        : await dailyIntelligenceService.getIntelligenceByDate(dateStr);
      setData(res);
    } catch {
      showToast('Không thể tải bản tin từ máy chủ, đang dùng dữ liệu dự phòng.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDigest(selectedDate);
  }, [loadDigest, selectedDate]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const refreshed = await dailyIntelligenceService.recompileDailyDigest(selectedDate);
      setData(refreshed);
      showToast('Đã làm mới và tổng hợp lại bản tin thành công!');
    } catch {
      showToast('Không thể làm mới bản tin lúc này.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSelectHeadline = (item: HeadlineItem) => {
    const article: NewsArticle = {
      id: item.id,
      title: item.title,
      description: item.summaryBullets?.join(' ') || item.title,
      contentSnippet: item.summaryBullets?.join('\n') || '',
      originalUrl: item.originalUrl,
      publishedAt: item.publishedAt,
      sourceName: item.sourceName,
      categoryName: item.categoryName,
      sentiment: item.sentiment,
      bulletPoints: item.summaryBullets,
      relatedTickers: item.relatedTickers,
    };
    setSelectedArticle(article);
    setIsArticleModalOpen(true);
  };

  const formatDateLabel = (isoDateStr: string): string => {
    try {
      const [year, month, day] = isoDateStr.split('-');
      const d = new Date(Number(year), Number(month) - 1, Number(day));
      const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayName = daysOfWeek[d.getDay()];
      return `${dayName}, ngày ${day}/${month}/${year}`;
    } catch {
      return isoDateStr;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-2xl shadow-xl border border-slate-700 animate-slideUp">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header: Editorial Title & Controls */}
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-headline-md text-xl sm:text-2xl font-black text-on-surface tracking-tight">
                  Bản Tin Sáng FinMan
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  Daily Intelligence
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {formatDateLabel(selectedDate)} • Chuẩn bị sẵn lúc 06:30 AM mỗi ngày
              </p>
            </div>
          </div>
        </div>

        {/* Date Selector & Recompile Button */}
        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          />

          <button
            type="button"
            disabled={isRefreshing || isLoading}
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary/95 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            title="Tổng hợp lại dữ liệu bản tin cho ngày này"
          >
            <span className={`material-symbols-outlined text-[16px] ${isRefreshing ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{isRefreshing ? 'Đang tổng hợp...' : 'Làm mới'}</span>
          </button>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="p-12 text-center bg-surface-container-lowest rounded-3xl border border-outline-variant/20 space-y-3">
          <span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin inline-block" />
          <p className="text-xs text-on-surface-variant font-medium">Đang chuẩn bị bản tin sáng...</p>
        </div>
      ) : data ? (
        <>
          {/* 2. Hero Section: Gemini AI Macro Executive Summary */}
          <div className="bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest to-emerald-500/5 rounded-3xl border border-outline-variant/30 p-6 sm:p-7 shadow-xs space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">psychology</span>
                <span className="font-headline-sm text-xs sm:text-sm font-bold uppercase tracking-wider text-primary">
                  Nhận Định Vĩ Mô & Dòng Tiền (Gemini AI Synthesis)
                </span>
              </div>
              <span className="text-[11px] font-semibold text-on-surface-variant/80">
                Mô hình: gemini-2.5-flash
              </span>
            </div>

            <p className="font-headline-sm text-sm sm:text-base leading-relaxed text-on-surface text-justify sm:text-left font-medium">
              &quot;{data.aiMacroSummary}&quot;
            </p>

            {/* Key Takeaways Grid */}
            {data.keyTakeaways && data.keyTakeaways.length > 0 && (
              <div className="pt-2">
                <div className="text-xs font-bold text-on-surface mb-2.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-amber-500">stars</span>
                  <span>3 Điểm Cốt Lõi Cần Nhớ Hôm Nay:</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {data.keyTakeaways.map((takeaway, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {takeaway}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Main 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Market Pulse + Personal Alert (5 cols on LG) */}
            <div className="lg:col-span-5 space-y-6">
              <MarketPulseCard
                marketPulse={data.marketPulse}
                onViewMarketDetail={onNavigateToMarket}
              />

              <PersonalAlertCard
                alert={data.personalAlert}
                onNavigateToBudget={onNavigateToBudget}
              />
            </div>

            {/* Right Column: Top 5 Headlines (7 cols on LG) */}
            <div className="lg:col-span-7">
              <TopHeadlinesList
                headlines={data.topHeadlines}
                onSelectHeadline={handleSelectHeadline}
                onTickerClick={(ticker) => onNavigateToNews?.(ticker)}
              />
            </div>
          </div>

          {/* 4. Interactive Follow-up Prompt Bridge to AI Assistant (Task 18.3 & 18.4) */}
          {data.suggestedPrompts && data.suggestedPrompts.length > 0 && (
            <div className="p-5 sm:p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">chat_spark</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-sm font-bold text-on-surface">
                      Hỏi Đáp Tức Thì Cùng Trợ Lý AI (Interactive Follow-up)
                    </h3>
                    <p className="text-[11px] text-on-surface-variant">
                      Bấm vào các câu hỏi gợi ý bên dưới để mở ngay hội thoại phân tích chuyên sâu
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {data.suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onAskAiPrompt?.(prompt)}
                    className="p-3.5 rounded-2xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 hover:border-primary/40 text-left transition-all group cursor-pointer flex flex-col justify-between"
                  >
                    <p className="text-xs text-on-surface group-hover:text-primary transition-colors font-medium leading-relaxed">
                      &quot;{prompt}&quot;
                    </p>
                    <div className="mt-2.5 flex items-center gap-1 text-[11px] font-bold text-primary">
                      <span>Hỏi câu này</span>
                      <span className="material-symbols-outlined text-[14px] group-hover:translate-x-0.5 transition-transform">
                        arrow_forward
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* Article Detail Modal */}
      <NewsDetailModal
        article={selectedArticle}
        isOpen={isArticleModalOpen}
        onClose={() => setIsArticleModalOpen(false)}
        onToggleSave={() => {}}
        onTickerClick={(ticker) => {
          setIsArticleModalOpen(false);
          onNavigateToNews?.(ticker);
        }}
      />
    </div>
  );
};
