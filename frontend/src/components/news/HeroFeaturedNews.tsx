import React from 'react';
import type { NewsArticle } from '../../types/news';
import {
  parseBulletPoints,
  parseRelatedTickers,
  formatRelativeTimeVi,
} from '../../types/news';
import { SentimentBadge } from './SentimentBadge';

interface HeroFeaturedNewsProps {
  article: NewsArticle;
  onSelectArticle: (article: NewsArticle) => void;
  onToggleSave: (article: NewsArticle, e: React.MouseEvent) => void;
  onTickerClick?: (ticker: string) => void;
}

export const HeroFeaturedNews: React.FC<HeroFeaturedNewsProps> = ({
  article,
  onSelectArticle,
  onToggleSave,
  onTickerClick,
}) => {
  const bulletPoints = parseBulletPoints(article.bulletPoints);
  const tickers = parseRelatedTickers(article.relatedTickers);

  return (
    <article
      data-testid="hero-featured-news"
      onClick={() => onSelectArticle(article)}
      className="group relative overflow-hidden rounded-2xl bg-slate-900 text-white border border-slate-800 p-5 sm:p-7 shadow-sm hover:border-slate-700 transition-all cursor-pointer"
    >
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left / Main Content (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-3.5">
          {/* Top Badges & Meta */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold uppercase text-[10px] tracking-wider shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
              <span>Tiêu Điểm Vĩ Mô</span>
            </span>

            {article.categoryName && (
              <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-slate-200 font-semibold text-[11px]">
                {article.categoryName}
              </span>
            )}

            {article.sourceName && (
              <span className="text-slate-400 font-medium text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                {article.sourceName}
              </span>
            )}

            <span className="text-slate-400 text-[11px]">
              • {formatRelativeTimeVi(article.publishedAt)}
            </span>

            {article.sentiment && (
              <div className="ml-auto">
                <SentimentBadge
                  sentiment={article.sentiment}
                  sentimentReason={article.sentimentReason}
                  size="sm"
                  variant="subtle"
                />
              </div>
            )}
          </div>

          {/* Title */}
          <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white leading-snug group-hover:text-amber-200 transition-colors line-clamp-2 sm:line-clamp-3">
            {article.title}
          </h2>

          {/* Excerpt / AI Bullet Points Preview */}
          {bulletPoints.length > 0 ? (
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-white/10 space-y-1.5">
              <div className="text-[10px] font-bold text-amber-300 flex items-center gap-1 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                <span>Tóm tắt phân tích nhanh bởi FinMan AI</span>
              </div>
              <ul className="space-y-1 text-xs text-slate-200">
                {bulletPoints.slice(0, 2).map((bp, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-secondary-fixed font-bold leading-none mt-1">▸</span>
                    <span className="line-clamp-2 leading-relaxed">{bp}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 sm:line-clamp-3 leading-relaxed">
              {article.description || article.contentSnippet || 'Xem chi tiết bản tin và góc nhìn tác động thị trường...'}
            </p>
          )}

          {/* Bottom Actions & Tickers */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            {/* Ticker chips */}
            {tickers.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400">Mã liên quan:</span>
                {tickers.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTickerClick?.(t);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] font-bold border border-white/15 transition-all cursor-pointer"
                  >
                    ${t}
                  </button>
                ))}
              </div>
            )}

            {/* CTAs */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                data-testid={`save-article-btn-${article.id}`}
                onClick={(e) => onToggleSave(article, e)}
                title={article.isSaved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                  article.isSaved
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-white/10 text-slate-300 hover:text-white border-white/15 hover:bg-white/20'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {article.isSaved ? 'bookmark' : 'bookmark_border'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectArticle(article)}
                className="px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-amber-100 font-bold text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>Đọc chi tiết</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right / Hero Image (5 cols on lg) */}
        <div className="lg:col-span-5 relative h-48 sm:h-64 lg:h-72 rounded-2xl overflow-hidden bg-slate-800 border border-white/10 shadow-md">
          {article.thumbnailUrl ? (
            <img
              src={article.thumbnailUrl}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                // Fallback nếu ảnh không tải được
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-tr from-slate-900 to-slate-800">
              <span className="material-symbols-outlined text-4xl text-white/30 mb-2">
                analytics
              </span>
              <span className="text-xs font-semibold text-white/60">
                FinMan Executive Macro News
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-white/90">
            <span className="font-semibold">{article.author || 'TS. Nguyễn Minh Quân • Nghiên Cứu'}</span>
            <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md font-mono text-[10px]">
              ⏱ 5 phút đọc
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};
