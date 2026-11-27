import React, { useState } from 'react';
import {
  formatRelativeTimeVi,
  parseBulletPoints,
  parseRelatedTickers,
  type NewsArticle,
} from '../../types/news';
import { SentimentBadge } from './SentimentBadge';

interface NewsCardProps {
  article: NewsArticle;
  onSelectArticle: (article: NewsArticle) => void;
  onToggleSave: (article: NewsArticle, e: React.MouseEvent) => void;
  onTickerClick?: (ticker: string) => void;
}

const getCategoryBadgeStyle = (categoryCode?: string): { bg: string; text: string; icon: string; fallbackGradient: string } => {
  switch (categoryCode?.toUpperCase()) {
    case 'STOCK':
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        text: 'Chứng khoán',
        icon: 'candlestick_chart',
        fallbackGradient: 'from-slate-900 via-emerald-950 to-slate-900',
      };
    case 'MACRO':
      return {
        bg: 'bg-slate-100 text-slate-800 border-slate-200',
        text: 'Kinh tế vĩ mô',
        icon: 'public',
        fallbackGradient: 'from-slate-900 via-slate-800 to-slate-900',
      };
    case 'BANKING':
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        text: 'Ngân hàng & Lãi suất',
        icon: 'account_balance',
        fallbackGradient: 'from-slate-900 via-amber-950 to-slate-900',
      };
    case 'INVESTMENT':
      return {
        bg: 'bg-teal-50 text-teal-800 border-teal-200',
        text: 'Đầu tư',
        icon: 'diamond',
        fallbackGradient: 'from-slate-900 via-teal-950 to-slate-900',
      };
    case 'PERSONAL_FINANCE':
      return {
        bg: 'bg-rose-50 text-rose-800 border-rose-200',
        text: 'Tài chính cá nhân',
        icon: 'savings',
        fallbackGradient: 'from-slate-900 via-rose-950 to-slate-900',
      };
    default:
      return {
        bg: 'bg-slate-100 text-slate-800 border-slate-200',
        text: 'Tài chính',
        icon: 'newspaper',
        fallbackGradient: 'from-slate-900 via-slate-800 to-slate-900',
      };
  }
};

export const NewsCard: React.FC<NewsCardProps> = ({
  article,
  onSelectArticle,
  onToggleSave,
  onTickerClick,
}) => {
  const [imgError, setImgError] = useState(false);

  const catStyle = getCategoryBadgeStyle(article.categoryCode);
  const tickers = parseRelatedTickers(article.relatedTickers);
  const bullets = parseBulletPoints(article.bulletPoints);
  const hasValidThumbnail = Boolean(article.thumbnailUrl && !imgError);

  return (
    <article
      onClick={() => onSelectArticle(article)}
      data-testid={`news-card-${article.id}`}
      className="group bg-surface-container-lowest rounded-2xl border border-outline-variant/25 shadow-[0_2px_12px_rgba(19,27,46,0.04)] hover:shadow-[0_12px_28px_rgba(19,27,46,0.1)] hover:border-outline-variant/50 transition-all duration-200 flex flex-col overflow-hidden cursor-pointer select-none"
    >
      {/* 1. Thumbnail Header */}
      <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-900 shrink-0">
        {hasValidThumbnail ? (
          <img
            src={article.thumbnailUrl}
            alt={article.title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${catStyle.fallbackGradient} flex flex-col items-center justify-center p-4 relative overflow-hidden`}
          >
            <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/5 blur-xl" />
            <span className="material-symbols-outlined text-white/30 text-[48px] mb-1">
              {catStyle.icon}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-white/60">
              {article.sourceName || 'FinMan Intelligence'}
            </span>
          </div>
        )}

        {/* Gradient Overlay for top badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-black/30 pointer-events-none" />

        {/* Top Left: Source & Category Pill */}
        <div className="absolute top-3 left-3 right-12 flex items-center gap-1.5 flex-wrap">
          <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold tracking-wide shadow-xs">
            {article.sourceName || 'Báo Tài Chính'}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-md text-slate-900 text-[11px] font-semibold shadow-xs flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-primary">
              {catStyle.icon}
            </span>
            <span>{article.categoryName || catStyle.text}</span>
          </span>
        </div>

        {/* Top Right: Bookmark / Save Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(article, e);
          }}
          title={article.isSaved ? 'Bỏ lưu bài viết' : 'Lưu bài viết đọc sau'}
          aria-label={article.isSaved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
          data-testid={`save-article-btn-${article.id}`}
          className={`absolute top-3 right-3 w-8 h-8 rounded-xl backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-sm ${
            article.isSaved
              ? 'bg-primary text-white ring-2 ring-white/40 scale-105'
              : 'bg-slate-900/65 text-white/90 hover:bg-slate-900/90 hover:scale-105'
          }`}
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ fontVariationSettings: article.isSaved ? "'FILL' 1" : "'FILL' 0" }}
          >
            {article.isSaved ? 'bookmark_added' : 'bookmark'}
          </span>
        </button>

        {/* Bottom Overlay: Time & Sentiment Badge */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-white/90 text-[11px] font-medium">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            <span>{formatRelativeTimeVi(article.publishedAt)}</span>
          </div>

          {article.sentiment && (
            <SentimentBadge
              sentiment={article.sentiment}
              sentimentReason={article.sentimentReason}
              size="xs"
              variant="subtle"
            />
          )}
        </div>
      </div>

      {/* 2. Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-2">
          {/* Article Title */}
          <h3 className="font-headline-sm text-[15px] leading-snug font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h3>

          {/* Description or First AI Bullet */}
          {bullets.length > 0 ? (
            <div className="p-2.5 rounded-xl bg-surface-container-low/80 border border-outline-variant/20 space-y-1">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-secondary">
                <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                <span>Tóm tắt nhanh AI</span>
              </div>
              <p className="text-xs text-on-surface/85 line-clamp-2 leading-relaxed">
                {bullets[0]}
              </p>
            </div>
          ) : (
            <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed">
              {article.description ||
                article.contentSnippet ||
                'Nhấn vào thẻ bài viết để đọc nội dung chi tiết và phân tích chuyên sâu từ FinMan AI.'}
            </p>
          )}
        </div>

        {/* 3. Card Footer: Tickers & Action */}
        <div className="pt-2.5 border-t border-outline-variant/20 flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-center gap-1 flex-wrap min-w-0">
            {tickers.length > 0 ? (
              tickers.slice(0, 3).map((ticker) => (
                <button
                  key={ticker}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTickerClick?.(ticker);
                  }}
                  title={`Lọc tin tức liên quan mã ${ticker}`}
                  className="px-2 py-0.5 rounded-md bg-tertiary-fixed/60 hover:bg-tertiary-fixed text-on-tertiary-fixed-variant font-currency-row text-[11px] font-bold transition-colors cursor-pointer"
                >
                  {ticker}
                </button>
              ))
            ) : (
              <span className="text-[11px] text-on-surface-variant/80 font-medium truncate">
                {article.author ? `Tác giả: ${article.author}` : 'Bản tin thị trường'}
              </span>
            )}
            {tickers.length > 3 && (
              <span className="text-[10px] font-semibold text-on-surface-variant">
                +{tickers.length - 3}
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform shrink-0">
            <span>Đọc bài</span>
            <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
          </span>
        </div>
      </div>
    </article>
  );
};

