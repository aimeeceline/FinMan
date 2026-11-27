import React from 'react';
import type { PersonalizedInsightResponse } from '../../services/aiChatService';
import { CitationChip } from './CitationChip';

interface PersonalizedInsightCardProps {
  data: PersonalizedInsightResponse;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const PersonalizedInsightCard: React.FC<PersonalizedInsightCardProps> = ({
  data,
  onRefresh,
  isLoading = false,
}) => {
  const formatMoney = (val?: number) => {
    if (val === undefined || val === null) return '0 ₫';
    return val.toLocaleString('vi-VN') + ' ₫';
  };

  const getImpactBadge = (type: string) => {
    switch (type) {
      case 'POSITIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 dark:bg-emerald-950 dark:text-emerald-300 rounded-md">
            <span className="material-symbols-outlined text-[13px]">trending_up</span>
            Tích cực
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-amber-700 bg-amber-100/80 dark:bg-amber-950 dark:text-amber-300 rounded-md">
            <span className="material-symbols-outlined text-[13px]">warning</span>
            Cần lưu ý
          </span>
        );
      case 'NEGATIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-rose-700 bg-rose-100/80 dark:bg-rose-950 dark:text-rose-300 rounded-md">
            <span className="material-symbols-outlined text-[13px]">trending_down</span>
            Áp lực chi phí
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 rounded-md">
            Trung lập
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Tài sản ròng hiện tại</span>
            <span className="material-symbols-outlined text-[18px] text-emerald-500">account_balance</span>
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
            {formatMoney(data.netWorthVnd)}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Tài sản thanh khoản (Tiền mặt + Ngân hàng)</span>
            <span className="material-symbols-outlined text-[18px] text-teal-500">payments</span>
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
            {formatMoney(data.liquidAssetsVnd)}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Quỹ khẩn cấp</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                data.runwayAssessment === 'AN TOÀN'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : data.runwayAssessment === 'CẦN TĂNG DỰ PHÒNG'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
              }`}
            >
              {data.runwayAssessment || 'CHUẨN'}
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
            {data.cashRunwayMonths !== undefined ? `${data.cashRunwayMonths.toFixed(1)} tháng` : '—'}
          </div>
        </div>
      </div>

      {/* Executive Summary Card */}
      <div className="p-5 bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-950 text-white rounded-2xl shadow-md border border-emerald-800/40 relative overflow-hidden">
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                Executive Cross-Domain Summary
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {data.modelVersion}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-normal">
              {data.summary}
            </p>
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all disabled:opacity-50 shrink-0"
              title="Cập nhật nhận định mới nhất"
            >
              <span className={`material-symbols-outlined text-lg ${isLoading ? 'animate-spin' : ''}`}>
                refresh
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Individual Insights List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
          Nhận Định Đối Chiếu Chi Tiết & Hành Động Đề Xuất
        </h4>

        {data.insights.map((item, idx) => (
          <div
            key={idx}
            className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs space-y-2.5 transition-all hover:border-slate-300 dark:hover:border-slate-700"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {item.topic}
                </span>
                {getImpactBadge(item.impactType)}
              </div>

              {item.citationIndices && item.citationIndices.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-400">Nguồn:</span>
                  {item.citationIndices.map((cIdx) => {
                    const matchedNews = data.retrievedNews?.find(
                      (n: any) => n.citationIndex === cIdx
                    );
                    return (
                      <CitationChip
                        key={cIdx}
                        index={cIdx}
                        source={
                          matchedNews
                            ? {
                                id: matchedNews.articleId,
                                citationIndex: cIdx,
                                sourceTitle: matchedNews.title,
                                sourceUrl: matchedNews.originalUrl,
                                sourceName: matchedNews.sourceName,
                                snippet: matchedNews.snippet,
                                createdAt: matchedNews.publishedAt,
                              }
                            : undefined
                        }
                      />
                    );
                  })}
                </div>
              )}
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {item.macroTitle}
            </h3>

            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0 mt-0.5">
                  info
                </span>
                <span>{item.personalSituation}</span>
              </div>

              {item.quantitativeCalculation && (
                <div className="text-xs font-mono font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
                  <span>{item.quantitativeCalculation}</span>
                  {item.estimatedFinancialImpactVnd !== 0 && (
                    <span className="font-bold">
                      {item.estimatedFinancialImpactVnd > 0 ? '+' : ''}
                      {formatMoney(item.estimatedFinancialImpactVnd)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {item.recommendedAction && (
              <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200 pt-0.5">
                <span className="material-symbols-outlined text-[16px] text-amber-500 shrink-0 mt-0.5">
                  lightbulb
                </span>
                <p>
                  <strong>Khuyến nghị:</strong> {item.recommendedAction}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legal Disclaimer */}
      {data.disclaimer && (
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-400 leading-relaxed italic text-center">
          *{data.disclaimer}
        </div>
      )}
    </div>
  );
};
