import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  DEFAULT_NEWS_CATEGORIES,
  DEFAULT_NEWS_SOURCES,
  newsService,
} from '../../services/newsService';
import type { NewsArticle, NewsCategory, NewsSource } from '../../types/news';
import { NewsCard } from '../../components/news/NewsCard';
import { NewsDetailModal } from '../../components/news/NewsDetailModal';
import { MarketTickerRibbon } from '../../components/news/MarketTickerRibbon';
import { HeroFeaturedNews } from '../../components/news/HeroFeaturedNews';
import { MarketOverviewMatrix } from '../../components/news/MarketOverviewMatrix';
import { BreakingNewsSidebar } from '../../components/news/BreakingNewsSidebar';
import { StockDetailModal } from '../../components/market/StockDetailModal';
import { MarketOverviewSection } from '../../components/market/MarketOverviewSection';
import { DailyMorningBriefBox } from '../../components/news/DailyMorningBriefBox';
import { marketService, FALLBACK_STOCK_QUOTES } from '../../services/marketService';
import type { StockQuote } from '../../types/market';

interface NewsDashboardPageProps {
  externalSearchQuery?: string;
  autoScrollToMarket?: boolean;
  onNavigateToAi?: (prompt?: string) => void;
  onNavigateToBudget?: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  ALL: 'apps',
  STOCK: 'candlestick_chart',
  MACRO: 'public',
  BANKING: 'account_balance',
  INVESTMENT: 'diamond',
  PERSONAL_FINANCE: 'savings',
};

const PAGE_SIZE = 12;

export const NewsDashboardPage: React.FC<NewsDashboardPageProps> = ({
  externalSearchQuery = '',
  autoScrollToMarket = false,
  onNavigateToAi,
  onNavigateToBudget,
}) => {
  // Check whether Market Section is enabled in Settings
  const [isMarketEnabled, setIsMarketEnabled] = useState<boolean>(() => {
    return localStorage.getItem('finman_enable_market_section') === 'true';
  });

  useEffect(() => {
    const handleSettingsChange = () => {
      setIsMarketEnabled(localStorage.getItem('finman_enable_market_section') === 'true');
    };
    window.addEventListener('finman_settings_changed', handleSettingsChange);
    window.addEventListener('storage', handleSettingsChange);
    return () => {
      window.removeEventListener('finman_settings_changed', handleSettingsChange);
      window.removeEventListener('storage', handleSettingsChange);
    };
  }, []);

  const scrollToMarketSection = useCallback(() => {
    const el = document.getElementById('market-terminal-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  useEffect(() => {
    if (autoScrollToMarket && isMarketEnabled) {
      const timer = setTimeout(() => {
        scrollToMarketSection();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [autoScrollToMarket, isMarketEnabled, scrollToMarketSection]);

  // Metadata state
  const [categories, setCategories] = useState<NewsCategory[]>(DEFAULT_NEWS_CATEGORIES);
  const [sources, setSources] = useState<NewsSource[]>(DEFAULT_NEWS_SOURCES);

  // Filter & Pagination state
  const [viewTab, setViewTab] = useState<'ALL' | 'SAVED'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [keywordInput, setKeywordInput] = useState<string>('');
  const [debouncedKeyword, setDebouncedKeyword] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(0);

  // Articles & UI state
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState<number>(() => newsService.getSavedCount());
  const [topHeroArticle, setTopHeroArticle] = useState<NewsArticle | null>(null);
  const [breakingArticles, setBreakingArticles] = useState<NewsArticle[]>([]);
  const hasAttemptedInitialCrawl = useRef<boolean>(false);
  const categorySectionRef = useRef<HTMLElement>(null);

  // Stock Detail Modal & Watchlist states (Cross-linking từ Task 17.5)
  const [selectedStockForModal, setSelectedStockForModal] = useState<StockQuote | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState<boolean>(false);
  const [watchlistSymbols, setWatchlistSymbols] = useState<Set<string>>(new Set());

  useEffect(() => {
    marketService.getWatchlist().then((list) => {
      if (Array.isArray(list) && list.length > 0) {
        setWatchlistSymbols(new Set(list.map((i) => i.symbol)));
      }
    });
  }, []);

  // Nhảy ngay lập tức (không chạy hiệu ứng cuộn) lên ngang thanh chuyên mục & bộ lọc
  const scrollToCategoryTop = useCallback(() => {
    if (categorySectionRef.current) {
      categorySectionRef.current.scrollIntoView({
        behavior: 'instant',
        block: 'start',
      });
    }
  }, []);

  const handlePageChange = useCallback(
    (newPage: number) => {
      setCurrentPage(newPage);
      scrollToCategoryTop();
    },
    [scrollToCategoryTop]
  );

  // Đảm bảo sau khi chuyển trang và React cập nhật DOM, vị trí luôn được định vị ngay tức thì ngang thanh danh mục
  const prevPageRef = useRef(currentPage);
  useEffect(() => {
    if (prevPageRef.current !== currentPage) {
      prevPageRef.current = currentPage;
      if (categorySectionRef.current) {
        categorySectionRef.current.scrollIntoView({
          behavior: 'instant',
          block: 'start',
        });
      }
    }
  }, [currentPage]);

  // Đồng bộ ô tìm kiếm từ TopHeader nếu người dùng gõ trên thanh tìm kiếm chung
  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setKeywordInput(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  // Debounce từ khóa tìm kiếm 250ms để gõ mượt mà, không giật lag
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedKeyword(keywordInput.trim());
      setCurrentPage(0);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [keywordInput]);

  // Tải danh mục & nguồn tin khi khởi chạy
  useEffect(() => {
    let isMounted = true;
    Promise.all([newsService.getCategories(), newsService.getSources()])
      .then(([cats, srcs]) => {
        if (!isMounted) return;
        if (cats && cats.length > 0) setCategories(cats);
        if (srcs && srcs.length > 0) setSources(srcs);
      })
      .catch(() => {
        // Giữ nguyên danh mục mặc định
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Hàm hiển thị thông báo ngắn (Toast)
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  // Tải danh sách bài báo theo bộ lọc & phân trang
  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    try {
      if (viewTab === 'SAVED') {
        const savedPage = await newsService.getSavedArticles(currentPage, PAGE_SIZE);
        let list = savedPage.content || [];

        if (selectedCategory !== 'ALL') {
          list = list.filter(
            (a) => a.categoryCode?.toUpperCase() === selectedCategory.toUpperCase()
          );
        }
        if (selectedSource !== 'ALL') {
          list = list.filter(
            (a) => a.sourceCode?.toUpperCase() === selectedSource.toUpperCase()
          );
        }
        if (debouncedKeyword) {
          const kw = debouncedKeyword.toLowerCase();
          list = list.filter(
            (a) =>
              a.title.toLowerCase().includes(kw) ||
              (a.description && a.description.toLowerCase().includes(kw)) ||
              (typeof a.relatedTickers === 'string' &&
                a.relatedTickers.toLowerCase().includes(kw))
          );
        }

        setArticles(list);
        const count = savedPage.totalElements ?? list.length;
        setTotalElements(count);
        setSavedCount(count);
        setTotalPages(Math.max(1, savedPage.totalPages || 1));
      } else {
        const pageData = await newsService.getArticles({
          categoryCode: selectedCategory !== 'ALL' ? selectedCategory : undefined,
          sourceCode: selectedSource !== 'ALL' ? selectedSource : undefined,
          keyword: debouncedKeyword || undefined,
          fromDate: selectedDate || undefined,
          toDate: selectedDate || undefined,
          page: currentPage,
          size: PAGE_SIZE,
        });

        // Nếu hệ thống chưa có bài viết thực tế nào, tự động kích hoạt tiến trình cào tin lần đầu
        if (pageData.totalElements === 0 && !hasAttemptedInitialCrawl.current) {
          hasAttemptedInitialCrawl.current = true;
          newsService.crawlNews().then(() => {
            fetchArticles();
          }).catch(() => { });
        }

        setArticles(pageData.content || []);
        if (pageData.content && pageData.content.length > 0 && viewTab === 'ALL') {
          setTopHeroArticle((prev) => prev || pageData.content[0]);
          setBreakingArticles((prev) => (prev.length > 0 ? prev : pageData.content.slice(1, 4)));
        }
        setTotalElements(pageData.totalElements ?? 0);
        setTotalPages(Math.max(1, pageData.totalPages || 1));
      }
    } catch {
      setArticles([]);
      setTotalElements(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, [viewTab, selectedCategory, selectedSource, debouncedKeyword, selectedDate, currentPage]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Tự động đồng bộ và cập nhật tin tức định kỳ mỗi 60 giây (Silent Live Auto-Refresh)
  useEffect(() => {
    const timer = setInterval(() => {
      if (currentPage === 0 && viewTab === 'ALL' && !debouncedKeyword) {
        newsService
          .getArticles({
            categoryCode: selectedCategory !== 'ALL' ? selectedCategory : undefined,
            sourceCode: selectedSource !== 'ALL' ? selectedSource : undefined,
            fromDate: selectedDate || undefined,
            toDate: selectedDate || undefined,
            page: 0,
            size: PAGE_SIZE,
          })
          .then((pageData) => {
            if (pageData.content && pageData.content.length > 0) {
              setArticles(pageData.content);
              setTotalElements(pageData.totalElements ?? pageData.content.length);
            }
          })
          .catch(() => { });
      }
    }, 60_000);
    return () => clearInterval(timer);
  }, [currentPage, viewTab, debouncedKeyword, selectedCategory, selectedSource, selectedDate]);

  // Xử lý chọn danh mục ngang
  const handleSelectCategory = (code: string) => {
    setSelectedCategory(code);
    setCurrentPage(0);
  };

  // Xử lý mở modal đọc chi tiết bài báo
  const handleOpenArticleModal = async (article: NewsArticle) => {
    setSelectedArticle(article);
    setIsModalOpen(true);

    try {
      const fullArticle = await newsService.getArticleById(article.id, false);
      setSelectedArticle((prev) => (prev && prev.id === article.id ? { ...prev, ...fullArticle } : prev));
      setArticles((prev) =>
        prev.map((item) => (item.id === article.id ? { ...item, ...fullArticle } : item))
      );
    } catch {
      // Giữ nguyên dữ liệu hiện có trên thẻ
    }
  };

  // Xử lý Lưu / Bỏ lưu bài báo (Optimistic Update)
  const handleToggleSave = async (article: NewsArticle, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextSaved = !article.isSaved;

    // Optimistic update trên lưới và trong modal
    setArticles((prev) => {
      if (viewTab === 'SAVED' && !nextSaved) {
        return prev.filter((item) => item.id !== article.id);
      }
      return prev.map((item) =>
        item.id === article.id ? { ...item, isSaved: nextSaved } : item
      );
    });
    setSelectedArticle((prev) =>
      prev && prev.id === article.id ? { ...prev, isSaved: nextSaved } : prev
    );
    setTopHeroArticle((prev) =>
      prev && prev.id === article.id ? { ...prev, isSaved: nextSaved } : prev
    );
    setBreakingArticles((prev) =>
      prev.map((item) => (item.id === article.id ? { ...item, isSaved: nextSaved } : item))
    );

    // Cập nhật số lượng bài viết đã lưu
    setSavedCount((prev) => Math.max(0, nextSaved ? prev + 1 : prev - 1));

    try {
      if (nextSaved) {
        await newsService.saveArticle(article.id);
        showToast('Đã lưu bài viết vào danh sách cá nhân');
      } else {
        await newsService.unsaveArticle(article.id);
        showToast('Đã bỏ lưu bài viết');
      }
      setSavedCount(newsService.getSavedCount());
    } catch {
      showToast('Không thể đồng bộ trạng thái lưu bài viết');
      setSavedCount(newsService.getSavedCount());
    }
  };

  // Xử lý yêu cầu Gemini AI tóm tắt trong Modal
  const handleSummarizeArticle = async (articleId: number) => {
    const summarized = await newsService.summarizeArticle(articleId);
    setSelectedArticle((prev) =>
      prev && prev.id === articleId ? { ...prev, ...summarized } : prev
    );
    setArticles((prev) =>
      prev.map((item) => (item.id === articleId ? { ...item, ...summarized } : item))
    );
    showToast('Đã tạo bản tóm tắt FinMan AI cho bài viết');
    return summarized;
  };

  // Click vào chip mã cổ phiếu (VD: FPT, VCB) hoặc ticker trong mục Cổ Phiếu Tâm Điểm
  const handleTickerClick = async (ticker: string) => {
    // 1. Thử tìm thông tin cổ phiếu để mở popup chi tiết & biểu đồ lịch sử giá (Task 17.5)
    try {
      const pageData = await marketService.getStockQuotes({ keyword: ticker, size: 5 });
      const found = pageData?.content?.find((s) => s.symbol.toUpperCase() === ticker.toUpperCase()) ||
        FALLBACK_STOCK_QUOTES.find((s) => s.symbol.toUpperCase() === ticker.toUpperCase());
      if (found) {
        setSelectedStockForModal(found);
        setIsStockModalOpen(true);
        return;
      }
    } catch {
      // ignore
    }

    // 2. Nếu không tìm thấy mã, fallback lọc danh sách tin tức
    handleFilterNewsByTicker(ticker);
  };

  // Lọc bài báo theo mã cổ phiếu (từ nút 'Xem toàn bộ tin tức' trong modal cổ phiếu)
  const handleFilterNewsByTicker = (ticker?: string) => {
    setIsStockModalOpen(false);
    setViewTab('ALL');
    setSelectedCategory('ALL');
    const kw = ticker || '';
    setKeywordInput(kw);
    setDebouncedKeyword(kw);
    setCurrentPage(0);
    scrollToCategoryTop();
  };

  // Bật/tắt theo dõi cổ phiếu trong Watchlist từ modal chi tiết
  const handleToggleWatchlist = async (symbol: string, isWatched: boolean) => {
    try {
      if (isWatched) {
        await marketService.removeFromWatchlist(symbol);
        setWatchlistSymbols((prev) => {
          const next = new Set(prev);
          next.delete(symbol);
          return next;
        });
        showToast(`Đã xóa mã ${symbol} khỏi danh mục theo dõi`);
      } else {
        await marketService.addToWatchlist({ symbol });
        setWatchlistSymbols((prev) => new Set([...prev, symbol]));
        showToast(`Đã thêm mã ${symbol} vào danh mục theo dõi`);
      }
    } catch {
      setWatchlistSymbols((prev) => {
        const next = new Set(prev);
        if (isWatched) next.delete(symbol);
        else next.add(symbol);
        return next;
      });
    }
  };

  // Xóa toàn bộ bộ lọc
  const handleResetFilters = () => {
    setSelectedCategory('ALL');
    setSelectedSource('ALL');
    setKeywordInput('');
    setDebouncedKeyword('');
    setSelectedDate('');
    setCurrentPage(0);
  };

  const hasActiveFilters =
    selectedCategory !== 'ALL' ||
    selectedSource !== 'ALL' ||
    Boolean(debouncedKeyword) ||
    Boolean(selectedDate);

  // Xử lý bật/tắt xem bài viết đã lưu: Bấm lần 1 mở danh sách đã lưu, bấm lần 2 tắt đi quay lại tất cả
  const handleToggleSavedView = () => {
    setViewTab((prev) => {
      const next = prev === 'SAVED' ? 'ALL' : 'SAVED';
      if (next === 'SAVED') {
        showToast('Đang hiển thị danh sách bài viết đã lưu');
      } else {
        showToast('Đã tắt danh sách đã lưu, quay lại tất cả bản tin');
      }
      return next;
    });
    setCurrentPage(0);
  };

  const savedArticlesCount = useMemo(
    () => Math.max(savedCount, articles.filter((a) => a.isSaved).length),
    [savedCount, articles]
  );

  // Phân tách bài báo đảm bảo TUYỆT ĐỐI KHÔNG TRÙNG LẶP trên toàn trang:
  const isDefaultHomeView =
    viewTab === 'ALL' && !hasActiveFilters && currentPage === 0;

  // 1. Hero Featured Story: Giữ nguyên ổn định ở đầu trang, luôn xuất hiện ở mọi trang
  const featuredArticle = useMemo(() => {
    return topHeroArticle || (articles.length > 0 ? articles[0] : null);
  }, [topHeroArticle, articles]);

  // 2. Sidebar Breaking News: Giữ nguyên ổn định 3 bài tin nóng bên cột phải
  const sidebarArticles = useMemo(() => {
    if (breakingArticles.length > 0) return breakingArticles;
    if (articles.length > 1) return articles.slice(1, 4);
    return [];
  }, [breakingArticles, articles]);

  // 3. Grid Articles: Các bài viết cho lưới chính
  const gridArticles = useMemo(() => {
    if (viewTab === 'SAVED') {
      // Khi xem bài đã lưu: Lưới hiển thị toàn bộ bài viết đã lưu
      return articles;
    }
    if (isDefaultHomeView) {
      // Ở trang chủ mặc định: Bỏ qua bài đã có ở Hero (index 0) và Sidebar (index 1, 2, 3)
      if (articles.length > 4) {
        return articles.slice(4);
      }
      return [];
    }
    // Khi ở trang 2 trở đi hoặc đang tìm kiếm / lọc: loại bỏ bài trùng với Hero nếu có
    if (featuredArticle) {
      return articles.filter((a) => a.id !== featuredArticle.id);
    }
    return articles;
  }, [viewTab, isDefaultHomeView, articles, featuredArticle]);

  // Danh sách ID bài viết đã xuất hiện trên Hero và Grid để Sidebar loại trừ hoàn toàn
  const excludedIdsFromSidebar = useMemo(() => {
    const ids: number[] = [];
    if (featuredArticle) ids.push(featuredArticle.id);
    gridArticles.forEach((a) => ids.push(a.id));
    return ids;
  }, [featuredArticle, gridArticles]);

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* 1. Live Market Ticker Ribbon (Phong cách FinPulse Terminal) */}
      <MarketTickerRibbon onTickerClick={handleTickerClick} />

      <div className="max-w-[1600px] mx-auto px-3.5 sm:px-6 md:px-margin-desktop space-y-5 sm:space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            role="status"
            data-testid="news-toast"
            className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-xl flex items-center gap-2 animate-fadeIn"
          >
            <span className="material-symbols-outlined text-[17px] text-secondary-fixed">
              check_circle
            </span>
            <span>{toastMessage}</span>
          </div>
        )}


        {/* 2. Top Executive Briefing Box: BẢN TIN SÁNG (Chỉ phần đặc biệt, loại bỏ lặp lại) */}
        <DailyMorningBriefBox
          onAskAiPrompt={onNavigateToAi}
          onNavigateToBudget={onNavigateToBudget}
        />

        {/* 3. Market Overview Multi-Asset Matrix (FinPulse Overview) */}
        <MarketOverviewMatrix
          onAssetClick={handleTickerClick}
          onScrollToMarket={scrollToMarketSection}
          isMarketEnabled={isMarketEnabled}
        />

        {/* 4. Main Two-Column Terminal Content */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Main Stream Column (8 cols on XL) */}
          <main className="xl:col-span-8 space-y-6">
            {/* Hero Featured Story (Luôn hiển thị ổn định ở mọi trang theo yêu cầu) */}
            {featuredArticle && (
              <HeroFeaturedNews
                article={featuredArticle}
                onSelectArticle={handleOpenArticleModal}
                onToggleSave={handleToggleSave}
                onTickerClick={handleTickerClick}
              />
            )}

            {/* Horizontal Category Selector Bar (Chips) */}
            <section
              ref={categorySectionRef}
              aria-label="Bộ chọn danh mục tin tức"
              className="space-y-3 scroll-mt-20 md:scroll-mt-24"
            >
              <div
                data-testid="news-category-chips"
                className="flex items-center gap-2 overflow-x-auto custom-scroll pb-1.5"
              >
                <button
                  type="button"
                  onClick={() => handleSelectCategory('ALL')}
                  data-testid="category-chip-ALL"
                  className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${selectedCategory === 'ALL'
                      ? 'bg-on-surface text-white shadow-sm scale-[1.01]'
                      : 'bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant border border-outline-variant/30'
                    }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {CATEGORY_ICONS.ALL}
                  </span>
                  <span>Tất cả chuyên mục</span>
                </button>

                {categories.map((cat) => {
                  const isActive = selectedCategory.toUpperCase() === cat.code.toUpperCase();
                  const iconName = CATEGORY_ICONS[cat.code.toUpperCase()] || 'newspaper';
                  return (
                    <button
                      key={cat.code}
                      type="button"
                      onClick={() => handleSelectCategory(cat.code)}
                      data-testid={`category-chip-${cat.code}`}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${isActive
                          ? 'bg-primary text-white shadow-sm scale-[1.01]'
                          : 'bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant border border-outline-variant/30'
                        }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{iconName}</span>
                      <span>{cat.nameVi}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search & Source / Date Filter Toolbar */}
              <div className="bg-surface-container-lowest p-3 sm:p-4 rounded-2xl border border-outline-variant/25 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Keyword Search Input */}
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[19px] pointer-events-none">
                    search
                  </span>
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder="Tìm kiếm tin tức, từ khóa vĩ mô, mã cổ phiếu (VD: FPT, VCB, lãi suất, CPI)..."
                    data-testid="news-search-input"
                    className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/80 pl-10 pr-9 py-2.5 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 border border-transparent focus:border-primary/30 transition-all"
                  />
                  {keywordInput && (
                    <button
                      type="button"
                      onClick={() => setKeywordInput('')}
                      aria-label="Xóa từ khóa tìm kiếm"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[17px]">close</span>
                    </button>
                  )}
                </div>

                {/* Right Filters: Source Dropdown, Date Filter, Reset */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {/* Source Select */}
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[16px] pointer-events-none">
                      source
                    </span>
                    <select
                      value={selectedSource}
                      onChange={(e) => {
                        setSelectedSource(e.target.value);
                        setCurrentPage(0);
                      }}
                      aria-label="Lọc theo nguồn báo"
                      data-testid="news-source-select"
                      className="bg-surface-container-low text-on-surface pl-9 pr-7 py-2.5 rounded-xl text-xs font-semibold border border-outline-variant/25 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                    >
                      <option value="ALL">Tất cả nguồn báo</option>
                      {sources.map((src) => (
                        <option key={src.code} value={src.code}>
                          {src.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Filter */}
                  <div className="relative flex items-center">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setCurrentPage(0);
                      }}
                      aria-label="Lọc theo ngày xuất bản"
                      data-testid="news-date-input"
                      className="bg-surface-container-low text-on-surface px-3 py-2 rounded-xl text-xs font-semibold border border-outline-variant/25 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                    />
                  </div>

                  {/* Nút Save bật/tắt (Toggle) nằm chung trong div lọc */}
                  <button
                    type="button"
                    onClick={handleToggleSavedView}
                    data-testid="tab-saved-news"
                    title={
                      viewTab === 'SAVED'
                        ? 'Bấm để tắt phần bài viết đã lưu và quay lại tất cả bản tin'
                        : 'Bấm để hiển thị danh sách bài viết đã lưu'
                    }
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border ${viewTab === 'SAVED'
                        ? 'bg-primary text-white border-primary shadow-xs ring-2 ring-primary/25'
                        : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant border-outline-variant/25 hover:text-on-surface'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">
                      {viewTab === 'SAVED' ? 'bookmark_added' : 'bookmarks'}
                    </span>
                    <span>Đã lưu</span>
                    {savedArticlesCount > 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${viewTab === 'SAVED'
                            ? 'bg-white/25 text-white'
                            : 'bg-primary/10 text-primary'
                          }`}
                      >
                        {savedArticlesCount}
                      </span>
                    )}
                  </button>

                  {/* Reset Filters Button */}
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      data-testid="news-reset-filters-btn"
                      className="px-3 py-2.5 rounded-xl bg-error-container/50 hover:bg-error-container text-on-error-container text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <span className="material-symbols-outlined text-[15px]">filter_alt_off</span>
                      <span>Xóa lọc</span>
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* News Cards Grid or Loading / Empty State */}
            <section
              aria-label="Danh sách bài viết tài chính"
              className="relative min-h-[380px]"
            >
              {/* Subtle top loading progress indicator when filtering / refetching */}
              {isLoading && (
                <div className="absolute -top-1.5 left-0 right-0 h-1 bg-primary/15 overflow-hidden rounded-full z-10">
                  <div className="h-full bg-primary animate-pulse w-2/5 rounded-full" />
                </div>
              )}

              {isInitialLoading && articles.length === 0 ? (
                <div
                  data-testid="news-loading-grid"
                  className="grid grid-cols-1 md:grid-cols-2 gap-5"
                >
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden animate-pulse flex flex-col h-[360px]"
                    >
                      <div className="h-44 bg-surface-container-high w-full" />
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-2.5">
                          <div className="h-4 bg-surface-container-high rounded w-11/12" />
                          <div className="h-4 bg-surface-container-high rounded w-3/4" />
                          <div className="h-14 bg-surface-container rounded-xl w-full mt-2" />
                        </div>
                        <div className="h-4 bg-surface-container rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : gridArticles.length === 0 ? (
                <div
                  data-testid="news-empty-state"
                  className="bg-surface-container-lowest rounded-3xl border border-outline-variant/25 p-10 sm:p-14 text-center max-w-xl mx-auto my-4 space-y-3 shadow-2xs"
                >
                  <div className="w-14 h-14 rounded-2xl bg-surface-container mx-auto flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[32px]">
                      {viewTab === 'SAVED' ? 'bookmark_border' : 'manage_search'}
                    </span>
                  </div>
                  <h3 className="font-headline-md text-base sm:text-lg font-bold text-on-surface">
                    {viewTab === 'SAVED'
                      ? 'Bạn chưa lưu bài viết tài chính nào'
                      : 'Không tìm thấy bài viết phù hợp'}
                  </h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                    {viewTab === 'SAVED'
                      ? 'Nhấn vào biểu tượng đánh dấu trên bất kỳ thẻ bản tin nào để lưu lại các bài phân tích quan trọng cần đọc sau.'
                      : 'Không có bản tin nào khớp với từ khóa hoặc bộ lọc hiện tại. Hãy thử từ khóa khác hoặc đặt lại bộ lọc.'}
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-2">
                    {viewTab === 'SAVED' ? (
                      <button
                        type="button"
                        onClick={() => setViewTab('ALL')}
                        className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-95 transition-opacity cursor-pointer"
                      >
                        Khám phá bản tin ngay
                      </button>
                    ) : (
                      hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-95 transition-opacity cursor-pointer"
                        >
                          Đặt lại bộ lọc
                        </button>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div
                  data-testid="news-cards-grid"
                  className={`grid grid-cols-1 md:grid-cols-2 gap-5 transition-opacity duration-200 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'
                    }`}
                >
                  {gridArticles.map((article) => (
                    <NewsCard
                      key={article.id}
                      article={article}
                      onSelectArticle={handleOpenArticleModal}
                      onToggleSave={handleToggleSave}
                      onTickerClick={handleTickerClick}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Pagination Bar */}
            {totalPages > 1 && (
              <nav
                aria-label="Phân trang tin tức"
                data-testid="news-pagination"
                className="bg-surface-container-lowest px-4 py-3 rounded-2xl border border-outline-variant/25 flex flex-col sm:flex-row items-center justify-between gap-3"
              >
                <span className="text-xs text-on-surface-variant font-medium">
                  Trang <strong className="text-on-surface">{currentPage + 1}</strong> /{' '}
                  <strong className="text-on-surface">{totalPages}</strong> • Tổng{' '}
                  <strong className="text-on-surface">{totalElements}</strong> bản tin
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage <= 0}
                    onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
                    className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high disabled:opacity-40 text-on-surface text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                    <span>Trước</span>
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                    const startPage = Math.max(
                      0,
                      Math.min(currentPage - 2, totalPages - Math.min(5, totalPages))
                    );
                    const pageNum = startPage + idx;
                    const isCurrent = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${isCurrent
                            ? 'bg-primary text-white shadow-xs'
                            : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                          }`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => handlePageChange(Math.min(totalPages - 1, currentPage + 1))}
                    className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high disabled:opacity-40 text-on-surface text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <span>Sau</span>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </nav>
            )}
          </main>

          {/* Sidebar Column (4 cols on XL) */}
          <div className="xl:col-span-4">
            <BreakingNewsSidebar
              articles={sidebarArticles}
              excludeIds={excludedIdsFromSidebar}
              onSelectArticle={handleOpenArticleModal}
              onTickerClick={handleTickerClick}
            />
          </div>
        </div>

        {/* 5. Phân hệ Bảng giá thị trường & Phân tích chi tiết (Chỉ hiển thị khi bật trong Cài đặt) */}
        {isMarketEnabled && (
          <MarketOverviewSection
            id="market-terminal-section"
            onScrollToTop={scrollToCategoryTop}
            onNavigateToNews={handleFilterNewsByTicker}
          />
        )}

        {/* Clean Article Reading & AI Summary Modal */}
        <NewsDetailModal
          article={selectedArticle}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onToggleSave={handleToggleSave}
          onSummarize={handleSummarizeArticle}
          onTickerClick={handleTickerClick}
        />

        {/* Stock Detail Modal with 25-Day History & Cross-Linked News (Task 17.5) */}
        <StockDetailModal
          stock={selectedStockForModal}
          isOpen={isStockModalOpen}
          onClose={() => setIsStockModalOpen(false)}
          isWatched={selectedStockForModal ? watchlistSymbols.has(selectedStockForModal.symbol) : false}
          onToggleWatchlist={handleToggleWatchlist}
          onNavigateToNews={handleFilterNewsByTicker}
        />
      </div>
    </div>
  );
};
