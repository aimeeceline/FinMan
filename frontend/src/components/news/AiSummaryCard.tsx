import React, { useState } from 'react';
import type { NewsArticle } from '../../types/news';
import { parseBulletPoints, parseRelatedTickers } from '../../types/news';

export interface AiSummaryCardProps {
  article: NewsArticle;
  variant?: 'full' | 'compact' | 'preview';
  isSummarizing?: boolean;
  onSummarize?: (articleId: number) => Promise<NewsArticle | void>;
  onTickerClick?: (ticker: string) => void;
  className?: string;
  testId?: string;
}

export const AiSummaryCard: React.FC<AiSummaryCardProps> = ({
  article,
  variant = 'full',
  isSummarizing = false,
  onSummarize,
  onTickerClick,
  className = '',
  testId = 'modal-ai-summary-card',
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const bullets = parseBulletPoints(article.bulletPoints);
  const tickers = parseRelatedTickers(article.relatedTickers);
  const hasAiData = bullets.length > 0 || Boolean(article.sentiment) || Boolean(article.impactAnalysis);

  const handleGenerate = async () => {
    if (!onSummarize || internalLoading || isSummarizing) return;
    setInternalLoading(true);
    setErrorMsg(null);
    try {
      await onSummarize(article.id);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể tạo bản tóm tắt AI lúc này.');
    } finally {
      setInternalLoading(false);
    }
  };

  const loading = isSummarizing || internalLoading;

  // Xử lý tách Fact (Dữ kiện bài báo) vs Opinion (Nhận định AI)
  const parseImpactSections = (text?: string) => {
    if (!text) return { fact: '', opinion: '', beneficiaries: '', risks: '' };
    let fact = '';
    let opinion = '';
    let beneficiaries = '';
    let risks = '';

    if (text.includes('[Dữ kiện bài báo - Fact]')) {
      const parts = text.split('[Nhận định AI - Opinion]');
      fact = parts[0].replace('[Dữ kiện bài báo - Fact]', '').replace(/^[|:\s]+|[|:\s]+$/g, '').trim();
      const rest = parts[1] || '';
      opinion = rest;
    } else {
      opinion = text;
    }

    if (opinion.includes('Hưởng lợi:')) {
      const benefMatch = opinion.match(/Hưởng lợi:\s*([^;—|\n]+)/);
      if (benefMatch) beneficiaries = benefMatch[1].trim();
    }
    if (opinion.includes('Chịu rủi ro:') || opinion.includes('Rủi ro:')) {
      const riskMatch = opinion.match(/(?:Chịu rủi ro|Rủi ro):\s*([^;—|\n]+)/);
      if (riskMatch) risks = riskMatch[1].trim();
    }

    return { fact, opinion, beneficiaries, risks };
  };

  const { fact, opinion } = parseImpactSections(article.impactAnalysis);

  // Helper xác định màu sắc và nhãn của Sắc thái (Sentiment)
  const getSentimentInfo = (sentiment?: string) => {
    if (!sentiment) return null;
    const s = sentiment.toUpperCase();
    if (s.includes('POS') || s.includes('TÍCH CỰC')) {
      return {
        label: 'Tích cực',
        pillClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
        dotClass: 'bg-emerald-500',
      };
    }
    if (s.includes('NEG') || s.includes('TIÊU CỰC') || s.includes('THẬN TRỌNG')) {
      return {
        label: 'Thận trọng',
        pillClass: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800 text-rose-700 dark:text-rose-300',
        dotClass: 'bg-rose-500',
      };
    }
    return {
      label: 'Trung lập',
      pillClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800 text-amber-700 dark:text-amber-300',
      dotClass: 'bg-amber-500',
    };
  };

  const sentimentInfo = getSentimentInfo(article.sentiment);

  // Variant Compact (Dành cho xem nhanh trên thẻ nhỏ)
  if (variant === 'compact') {
    if (!hasAiData) return null;
    return (
      <div
        data-testid={testId}
        className={`p-3 rounded-2xl bg-surface-container-low/90 border border-outline-variant/25 space-y-2 ${className}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
            <span>FinMan AI Tóm Tắt</span>
          </div>
          {sentimentInfo && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${sentimentInfo.pillClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sentimentInfo.dotClass}`} />
              <span>{sentimentInfo.label}</span>
            </span>
          )}
        </div>
        {bullets.length > 0 && (
          <ul className="space-y-1.5 text-xs text-on-surface leading-snug">
            {bullets.slice(0, 2).map((point, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span>
                <span className="line-clamp-2">{point}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // Variant Full: Chuẩn thiết kế FinMan AI Summary Box phong cách Terminal hiện đại
  return (
    <div
      data-testid={testId}
      className={`p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden space-y-4 ${className}`}
    >
      {/* 1. Viền hiệu ứng gradient tinh tế trên đỉnh thẻ */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500" />

      {/* 2. Tiêu đề khối AI & Badge Sắc thái thị trường */}
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
                Tóm tắt nhanh từ FinMan AI
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold tracking-wide">
                10 giây đọc
              </span>
            </div>
          </div>
        </div>

        {/* Badge Sắc thái: ● Sắc thái: Trung lập */}
        {sentimentInfo && (
          <div
            className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 shrink-0 ${sentimentInfo.pillClass}`}
          >
            <span className={`w-2 h-2 rounded-full ${sentimentInfo.dotClass}`} />
            <span>Sắc thái: {sentimentInfo.label}</span>
          </div>
        )}
      </div>

      {/* 3. Nội dung chính hoặc Nút bấm yêu cầu khởi tạo AI */}
      {hasAiData ? (
        <div className="space-y-4">
          {/* 3 Luận điểm cốt lõi đánh số 1, 2, 3 */}
          {bullets.length > 0 && (
            <div className="space-y-3 pt-1">
              {bullets.map((point, idx) => {
                const colonIdx = point.indexOf(':');
                const hasPrefix = colonIdx > 0 && colonIdx < 30;
                const prefix = hasPrefix ? point.substring(0, colonIdx + 1) : '';
                const rest = hasPrefix ? point.substring(colonIdx + 1) : point;

                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3 text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed"
                  >
                    <span className="w-5 h-5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      {hasPrefix ? (
                        <span>
                          <strong className="text-slate-900 dark:text-slate-100 font-bold">
                            {prefix}
                          </strong>
                          {rest}
                        </span>
                      ) : (
                        <span>{point}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2 Khung chia đôi Fact vs Opinion: Dữ kiện thực tế & Góc nhìn đầu tư */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Cột 1: Dữ kiện thực tế (FACT) */}
            <div className="bg-sky-50/50 dark:bg-sky-950/20 rounded-xl p-3.5 border border-sky-100/80 dark:border-sky-900/40 space-y-1.5 shadow-2xs">
              <div className="text-[11px] font-bold text-sky-700 dark:text-sky-300 tracking-wider uppercase flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-sky-600 dark:text-sky-400">
                  check_circle
                </span>
                <span>DỮ KIỆN THỰC TẾ (FACT)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {fact ||
                  article.sentimentReason ||
                  'Bài viết tường thuật khách quan dữ liệu và cột mốc hoạt động thực tế từ nguồn báo.'}
              </p>
            </div>

            {/* Cột 2: Góc nhìn đầu tư (AI) */}
            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl p-3.5 border border-indigo-100/80 dark:border-indigo-900/40 space-y-1.5 shadow-2xs">
              <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 tracking-wider uppercase flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-indigo-600 dark:text-indigo-400">
                  lightbulb
                </span>
                <span>GÓC NHÌN ĐẦU TƯ (AI)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {opinion ||
                  'Tin tức mang tính củng cố định vị doanh nghiệp, phù hợp cho nhà đầu tư đánh giá danh mục trung và dài hạn.'}
              </p>
            </div>
          </div>

          {/* Hàng cuối AI Footer: Mã cổ phiếu liên quan & Disclaimer */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            {/* Mã liên quan */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-slate-400">
                  trending_up
                </span>
                <span>Mã liên quan:</span>
              </span>
              {tickers.length > 0 ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {tickers.map((ticker) => (
                    <button
                      key={ticker}
                      type="button"
                      onClick={() => onTickerClick?.(ticker)}
                      title={`Nhấn để xem tin tức liên quan đến mã ${ticker}`}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <span>${ticker}</span>
                      <span className="material-symbols-outlined text-[13px] opacity-75">
                        north_east
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Vĩ mô / Toàn thị trường</span>
              )}
            </div>

            {/* Disclaimer */}
            <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
              ⓘ AI tổng hợp • Không phải khuyến nghị đầu tư
            </span>
          </div>
        </div>
      ) : (
        /* Trạng thái chưa có phân tích: Cho phép người dùng bấm tạo tức thì */
        <div className="text-center py-5 px-3 space-y-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">
              {loading ? 'sync' : 'auto_awesome'}
            </span>
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              Bài viết này chưa có bản phân tích FinMan AI
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Kích hoạt Gemini AI để trích xuất 3 điểm cốt lõi, đối chiếu Fact vs Opinion và bóc tách tác động thị trường trong 5 giây.
            </p>
          </div>

          {errorMsg && (
            <div className="text-xs text-rose-600 font-medium bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg max-w-sm mx-auto">
              {errorMsg}
            </div>
          )}

          {onSummarize && (
            <button
              type="button"
              disabled={loading}
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                  <span>Đang phân tích bài báo...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">bolt</span>
                  <span>Tạo tóm tắt FinMan AI ngay</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
