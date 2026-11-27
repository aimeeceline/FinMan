import React, { useState } from 'react';
import type { HeadlineItem } from '../../types/intelligence';

interface TopHeadlinesListProps {
  headlines: HeadlineItem[];
  onSelectHeadline?: (item: HeadlineItem) => void;
  onTickerClick?: (ticker: string) => void;
}

export const TopHeadlinesList: React.FC<TopHeadlinesListProps> = ({
  headlines,
  onSelectHeadline,
  onTickerClick,
}) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const formatTimeAgo = (isoDate: string): string => {
    try {
      const now = Date.now();
      const past = new Date(isoDate).getTime();
      const diffMinutes = Math.floor((now - past) / 60000);

      if (diffMinutes < 60) return `${Math.max(1, diffMinutes)} phút trước`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours} giờ trước`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} ngày trước`;
    } catch {
      return 'Vừa cập nhật';
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-5 sm:p-6 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">newspaper</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-sm sm:text-base font-bold text-on-surface">
              Top 5 Tin Tức Tài Chính Nổi Bật
            </h3>
            <p className="text-[11px] text-on-surface-variant">
              Tổng hợp từ các hãng tin uy tín, chọn lọc và tóm tắt bởi Gemini AI
            </p>
          </div>
        </div>

        <span className="text-[11px] font-bold text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full">
          24h qua
        </span>
      </div>

      {/* Headlines List */}
      <div className="space-y-3.5">
        {headlines.map((item, index) => {
          const isPositive = item.sentiment === 'POSITIVE';
          const isNegative = item.sentiment === 'NEGATIVE';
          const isExpanded = expandedId === item.id;

          const sentimentLabel = isPositive
            ? 'Tích cực'
            : isNegative
            ? 'Tiêu cực'
            : 'Trung lập';

          const sentimentClass = isPositive
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
            : isNegative
            ? 'bg-error/10 text-error border-error/20'
            : 'bg-surface-container text-on-surface-variant border-outline-variant/20';

          return (
            <article
              key={item.id}
              className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 hover:border-outline-variant/40 transition-all space-y-2.5"
            >
              {/* Meta row: Number, Source, Time, Category, Sentiment */}
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="font-bold text-on-surface text-[11px]">{item.sourceName}</span>
                  <span className="text-on-surface-variant/40">•</span>
                  <span className="text-[11px] text-on-surface-variant font-medium">
                    {formatTimeAgo(item.publishedAt)}
                  </span>
                  <span className="text-on-surface-variant/40 hidden sm:inline">•</span>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant hidden sm:inline">
                    {item.categoryName}
                  </span>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sentimentClass}`}>
                  {sentimentLabel}
                </span>
              </div>

              {/* Title */}
              <h4
                onClick={() => onSelectHeadline?.(item)}
                className="font-headline-sm text-sm sm:text-[15px] font-bold text-on-surface hover:text-primary transition-colors cursor-pointer leading-snug"
              >
                {item.title}
              </h4>

              {/* Summary bullets */}
              {item.summaryBullets && item.summaryBullets.length > 0 && (
                <div className="p-3 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/15 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-primary">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
                      <span>AI Tóm Tắt Ý Chính:</span>
                    </div>
                    {item.summaryBullets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.id)}
                        className="text-[10px] text-on-surface-variant hover:text-on-surface font-semibold cursor-pointer"
                      >
                        {isExpanded ? 'Thu gọn ▲' : `Xem thêm (${item.summaryBullets.length}) ▼`}
                      </button>
                    )}
                  </div>

                  <ul className="space-y-1 text-xs text-on-surface-variant leading-relaxed pl-1">
                    {(isExpanded ? item.summaryBullets : item.summaryBullets.slice(0, 1)).map((bullet, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2">
                        <span className="text-primary font-bold mt-0.5">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Footer: Related tickers & Read original button */}
              <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {item.relatedTickers && item.relatedTickers.length > 0 && (
                    <>
                      <span className="text-[10px] text-on-surface-variant/70 font-semibold">Mã liên quan:</span>
                      {item.relatedTickers.map((ticker) => (
                        <button
                          key={ticker}
                          type="button"
                          onClick={() => onTickerClick?.(ticker)}
                          className="px-2 py-0.5 rounded-lg bg-surface-container hover:bg-primary/10 hover:text-primary text-[10px] font-mono font-bold text-on-surface border border-outline-variant/25 transition-all cursor-pointer"
                          title={`Xem tin tức & bảng giá mã ${ticker}`}
                        >
                          ${ticker}
                        </button>
                      ))}
                    </>
                  )}
                </div>

                {item.originalUrl && (
                  <a
                    href={item.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline ml-auto"
                  >
                    <span>Bài viết gốc</span>
                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
