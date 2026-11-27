import React, { useState, useEffect } from 'react';
import {
  formatFullDateTimeVi,
  formatRelativeTimeVi,
  parseNewsTags,
  type NewsArticle,
} from '../../types/news';
import { AiSummaryCard } from './AiSummaryCard';

interface NewsDetailModalProps {
  article: NewsArticle | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleSave: (article: NewsArticle, e?: React.MouseEvent) => void;
  onSummarize?: (articleId: number) => Promise<NewsArticle | void>;
  onTickerClick?: (ticker: string) => void;
}

export const NewsDetailModal: React.FC<NewsDetailModalProps> = ({
  article,
  isOpen,
  onClose,
  onToggleSave,
  onSummarize,
  onTickerClick,
}) => {
  const [imgError, setImgError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    setImgError(false);
    setIsExpanded(true);
  }, [article?.id]);

  // Đóng modal bằng phím Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !article) return null;

  const tags = parseNewsTags(article.tags);

  // Trích xuất các đoạn văn bản đầy đủ từ contentSnippet hoặc description
  const rawText = (article.contentSnippet || article.description || '').trim();
  const rawParagraphs = rawText
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  let fullParagraphs: string[] = [];
  if (rawParagraphs.length > 1) {
    fullParagraphs = rawParagraphs;
  } else if (rawParagraphs.length === 1) {
    const single = rawParagraphs[0];
    if (single.length > 250) {
      const sentences = single.match(/[^.!?]+[.!?]+(\s+|$)/g);
      if (sentences && sentences.length >= 4) {
        const mid = Math.ceil(sentences.length / 2);
        fullParagraphs = [
          sentences.slice(0, mid).join('').trim(),
          sentences.slice(mid).join('').trim(),
        ];
      } else {
        fullParagraphs = [single];
      }
    } else {
      fullParagraphs = [single];
    }
  }

  // Nếu bài viết có cả description riêng biệt không trùng với các đoạn trên, thêm vào đầu
  if (article.description && article.description.trim()) {
    const desc = article.description.trim();
    if (!fullParagraphs.some((p) => p.includes(desc) || desc.includes(p))) {
      fullParagraphs = [desc, ...fullParagraphs];
    }
  }

  // Số lượng đoạn hiển thị theo trạng thái Thu gọn / Xem thêm
  const displayedParagraphs = isExpanded
    ? fullParagraphs
    : fullParagraphs.slice(0, 1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="news-detail-modal-title"
      data-testid="news-detail-modal"
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Sticky Top Bar: Nguồn báo, Chuyên mục, Thời gian, Nút Lưu & Nút Đóng */}
        <div className="px-6 py-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {/* Nguồn báo pill đen sang trọng */}
            <span className="px-3 py-1 rounded-lg bg-[#18181B] dark:bg-slate-800 text-white text-xs font-bold tracking-tight">
              {article.sourceName || 'Báo Tài Chính'}
            </span>

            {/* Dấu chấm ngăn cách */}
            <span className="text-slate-300 dark:text-slate-600 font-bold">•</span>

            {/* Chuyên mục pill hồng */}
            {article.categoryName && (
              <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-semibold">
                {article.categoryName}
              </span>
            )}

            {/* Thời gian xuất bản tương đối */}
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">schedule</span>
              <span>{formatRelativeTimeVi(article.publishedAt)}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Nút Lưu / Bỏ lưu bài viết (Outline pill theo thiết kế mới) */}
            <button
              type="button"
              onClick={(e) => onToggleSave(article, e)}
              data-testid="modal-save-article-btn"
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                article.isSaved
                  ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 shadow-2xs'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              <span
                className="material-symbols-outlined text-[17px]"
                style={{ fontVariationSettings: article.isSaved ? "'FILL' 1" : "'FILL' 0" }}
              >
                {article.isSaved ? 'bookmark_added' : 'bookmark'}
              </span>
              <span>{article.isSaved ? 'Đã lưu' : 'Lưu bài'}</span>
            </button>

            {/* Nút Đóng Modal */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng cửa sổ"
              data-testid="modal-close-btn"
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* 2. Scrollable Content Area */}
        <div className="p-6 sm:p-7 overflow-y-auto custom-scroll space-y-5 flex-1">
          {/* Tiêu đề bài viết & Thông tin tác giả / ngày xuất bản */}
          <div className="space-y-2.5">
            <h2
              id="news-detail-modal-title"
              className="font-extrabold text-[22px] sm:text-[25px] text-slate-900 dark:text-slate-100 leading-snug tracking-tight"
            >
              {article.title}
            </h2>

            <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="material-symbols-outlined text-[15px] text-slate-400">person</span>
                <span>Tác giả: {article.author || article.sourceName || 'Ban Biên Tập'}</span>
              </span>
              {article.publishedAt && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-slate-400">
                    calendar_today
                  </span>
                  <span>{formatFullDateTimeVi(article.publishedAt)}</span>
                </span>
              )}
            </div>
          </div>

          {/* 3. Khung FinMan AI Summary Box chuẩn phong cách mới */}
          <AiSummaryCard
            article={article}
            variant="full"
            onSummarize={onSummarize}
            onTickerClick={(ticker) => {
              onTickerClick?.(ticker);
              onClose();
            }}
            testId="modal-ai-summary-card"
          />

          {/* 4. Hình ảnh bài viết kèm thanh chú thích dưới ảnh (Image Card with Caption) */}
          {article.thumbnailUrl && !imgError && (
            <div className="rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 bg-slate-900 w-full shadow-2xs">
              <img
                src={article.thumbnailUrl}
                alt={article.title}
                onError={() => setImgError(true)}
                className="w-full max-h-96 object-cover"
              />
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
                <span className="line-clamp-2">
                  {article.imageCaption || `Đại diện lãnh đạo trao kỷ niệm và ghi nhận thành tích cho tập thể ${article.sourceName || 'doanh nghiệp'}.`}
                </span>
                <span className="text-slate-400 dark:text-slate-500 font-medium shrink-0">
                  Ảnh: {article.sourceCode === 'VNEXPRESS' && article.title.includes('Vietcombank') ? 'VCB' : (article.sourceCode || article.sourceName || 'VCB')}
                </span>
              </div>
            </div>
          )}

          {/* 5. Nội dung toàn văn bài báo & Nút Thu gọn / Đọc tiếp phong cách Gemini */}
          <div className="space-y-3.5 text-slate-800 dark:text-slate-200">
            {displayedParagraphs.length > 0 ? (
              <div className="space-y-4 text-sm sm:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                {displayedParagraphs.map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">
                Nội dung chi tiết đang được cập nhật từ nguồn báo gốc. Bạn có thể mở liên kết gốc bên dưới để xem toàn văn bài báo.
              </p>
            )}

            {/* Nút Thu gọn / Đọc toàn bộ bài viết */}
            {fullParagraphs.length > 1 && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer pt-1 transition-colors"
              >
                <span>{isExpanded ? 'Thu gọn' : 'Đọc toàn bộ bài viết'}</span>
                <span className="material-symbols-outlined text-[16px]">
                  {isExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                </span>
              </button>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Miễn trừ trách nhiệm */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] text-amber-500 shrink-0 mt-0.5">
              info
            </span>
            <span>
              <strong>Lưu ý miễn trừ trách nhiệm:</strong> Mọi thông tin và góc nhìn do FinMan AI tổng hợp chỉ nhằm mục đích tham khảo, hỗ trợ ra quyết định tài chính cá nhân, không phải khuyến nghị mua bán chứng khoán hay tư vấn đầu tư chuyên nghiệp.
            </span>
          </div>
        </div>

        {/* 6. Sticky Modal Footer: Nguồn gốc bên trái & Nút Đỏ "Đọc toàn văn tại nguồn ↗" bên phải */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
            Nguồn tin: <strong className="text-slate-800 dark:text-slate-200">{article.sourceName || 'Báo Tài Chính'}</strong>
          </span>

          <div className="flex items-center gap-2">
            {article.originalUrl && (
              <a
                href={article.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="modal-original-url-link"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <span>Đọc toàn văn tại nguồn</span>
                <span className="material-symbols-outlined text-[15px]">open_in_new</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
