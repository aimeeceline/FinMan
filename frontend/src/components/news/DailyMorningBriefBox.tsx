import React, { useState, useEffect, useCallback, useRef } from 'react';
import { dailyIntelligenceService } from '../../services/dailyIntelligenceService';
import type { DailyIntelligenceData } from '../../types/intelligence';

export interface DailyMorningBriefBoxProps {
  onAskAiPrompt?: (prompt: string) => void;
  onNavigateToBudget?: () => void;
}

export const DailyMorningBriefBox: React.FC<DailyMorningBriefBoxProps> = ({
  onAskAiPrompt,
  onNavigateToBudget,
}) => {
  const [data, setData] = useState<DailyIntelligenceData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRecompiling, setIsRecompiling] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('finman_morning_brief_collapsed') === 'true';
  });

  const promptsContainerRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await dailyIntelligenceService.getTodayIntelligence();
      setData(res);
    } catch (err) {
      console.warn('Lỗi tải bản tin sáng:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [loadData]);

  const handleToggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('finman_morning_brief_collapsed', String(next));
  };

  const handleRecompile = async () => {
    if (isRecompiling) return;
    setIsRecompiling(true);
    showToast('Gemini AI đang đồng bộ dữ liệu thị trường và ngân sách mới nhất...');
    try {
      const refreshed = await dailyIntelligenceService.recompileDailyDigest();
      setData(refreshed);
      showToast('Đã cập nhật bản tin sáng thành công!');
    } catch (err) {
      console.error('Lỗi tổng hợp lại bản tin:', err);
      showToast('Có lỗi xảy ra khi cập nhật bản tin. Vui lòng thử lại!');
    } finally {
      setIsRecompiling(false);
    }
  };

  const scrollPrompts = (amount: number) => {
    if (promptsContainerRef.current) {
      promptsContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const handlePromptClick = (promptText: string) => {
    const clean = promptText.replace(/[“”"']/g, '').trim();
    showToast(`Đang chuyển câu hỏi tới FinMan AI: "${clean}"`);
    if (onAskAiPrompt) {
      onAskAiPrompt(clean);
    }
  };

  const formatDateVi = (dateStr?: string) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    const dayOfWeek = [
      'Chủ Nhật',
      'Thứ Hai',
      'Thứ Ba',
      'Thứ Tư',
      'Thứ Năm',
      'Thứ Sáu',
      'Thứ Bảy',
    ][d.getDay()];
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dayOfWeek}, ${dd}/${mm}/${yyyy}`;
  };

  const formatCurrencyAbbr = (val: number) => {
    if (!val || val === 0) return '0M';
    if (Math.abs(val) >= 1_000_000_000) {
      return `${(val / 1_000_000_000).toFixed(1)}B`;
    }
    if (Math.abs(val) >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(val) >= 1_000) {
      return `${(val / 1_000).toFixed(0)}K`;
    }
    return `${val.toLocaleString('vi-VN')}₫`;
  };

  const alert = data?.personalAlert;
  const isDanger = alert?.alertLevel === 'DANGER';
  const isWarning = alert?.alertLevel === 'WARNING';

  const badgeColor = isDanger
    ? 'bg-rose-100 text-rose-700 border-rose-300'
    : isWarning
    ? 'bg-amber-100 text-amber-700 border-amber-300'
    : 'bg-emerald-100 text-emerald-700 border-emerald-300';

  const defaultTakeaways = [
    'Chỉ số VN-Index giữ vững đà tăng trưởng, dòng tiền lan tỏa ở nhóm vốn hóa lớn và ngành công nghệ.',
    'Tỷ giá trung tâm và mặt bằng lãi suất tiền gửi ổn định, tạo môi trường thuận lợi cho tích lũy tài chính cá nhân.',
    'Ưu tiên rà soát định kỳ các mục tiêu ngân sách tháng để duy trì tỷ lệ thặng dư thu chi trên 20%.',
  ];

  const takeaways = (data?.keyTakeaways && data.keyTakeaways.length > 0)
    ? data.keyTakeaways.slice(0, 3)
    : defaultTakeaways;

  const defaultPrompts = [
    'Diễn biến thị trường hôm nay tác động thế nào đến kế hoạch tài chính cá nhân của tôi?',
    'Với xu hướng lãi suất và kinh tế hiện tại, tôi nên phân bổ tài sản thế nào cho an toàn?',
    'Tóm tắt giúp tôi những khoản chi tiêu chiếm tỷ trọng lớn nhất trong tháng này.',
  ];

  const prompts = (data?.suggestedPrompts && data.suggestedPrompts.length > 0)
    ? data.suggestedPrompts
    : defaultPrompts;

  // Month progress
  const now = new Date();
  const dayOfMonth = alert?.dayOfMonth || now.getDate();
  const daysInMonth = alert?.daysInMonth || new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const timeProgressPercent = alert?.monthProgressPercent || Math.round((dayOfMonth / daysInMonth) * 100);

  const totalBudget = alert?.totalBudget ?? 0;
  const totalSpent = alert?.totalSpent ?? 0;
  const totalRemaining = alert?.totalRemaining ?? (totalBudget - totalSpent);
  const spentPercent = alert?.spentPercentage ?? (totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0);
  const hasBudget = totalBudget > 0;

  return (
    <div
      data-testid="daily-morning-brief-box"
      className="w-full bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-200/80 overflow-hidden transition-all duration-300 relative select-none"
    >
      {/* 1. Header Banner: Gradient rực rỡ & chiều sâu */}
      <header className="relative bg-gradient-to-r from-slate-900 via-teal-950 to-indigo-950 px-5 py-4 sm:px-7 sm:py-5 text-white overflow-hidden">
        {/* Hiệu ứng ánh sáng trang trí nền */}
        <div className="absolute -top-24 -left-16 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Icon + Title + Metadata */}
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0 ring-2 ring-white/15">
              <span className="material-symbols-outlined text-white text-[24px]">auto_awesome</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white font-heading">
                  BẢN TIN SÁNG
                </h2>
                
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-teal-400">calendar_month</span>
                <span>{formatDateVi(data?.digestDate)}</span>
              </p>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2.5 self-end sm:self-center">
            <button
              id="btn-refresh"
              type="button"
              onClick={handleRecompile}
              disabled={isRecompiling || isLoading}
              title="Kích hoạt AI tổng hợp lại bản tin mới nhất"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <span
                className={`material-symbols-outlined text-[17px] text-emerald-300 ${
                  isRecompiling ? 'animate-spin' : ''
                }`}
              >
                refresh
              </span>
              <span>{isRecompiling ? 'Đang cập nhật...' : 'Cập nhật AI'}</span>
            </button>

            <button
              id="btn-toggle"
              type="button"
              onClick={handleToggleCollapse}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer"
            >
              <span>{isCollapsed ? 'Mở rộng' : 'Thu gọn'}</span>
              <span className="material-symbols-outlined text-[18px]">
                {isCollapsed ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Dòng Tóm Tắt Khi Thu Gọn */}
      {isCollapsed && (
        <div className="px-5 py-3.5 sm:px-7 bg-slate-50 flex items-center justify-between gap-4 text-xs sm:text-sm text-slate-700 border-b border-slate-200/60">
          <p className="truncate font-medium">
            <strong className="text-slate-900 font-bold">Điểm tin:</strong>{' '}
            {data?.keyTakeaways?.[0] || data?.aiMacroSummary || 'Thị trường tài chính khởi sắc với sắc xanh lan tỏa, thanh khoản duy trì ổn định.'}
          </p>
          <button
            type="button"
            onClick={handleToggleCollapse}
            className="shrink-0 text-emerald-700 font-bold hover:underline cursor-pointer"
          >
            Xem đầy đủ
          </button>
        </div>
      )}

      {/* 3. Collapsible Main Content */}
      {!isCollapsed && (
        <div id="briefing-body" className="p-5 sm:p-7 space-y-6 animate-fadeIn">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
              <div className="lg:col-span-7 space-y-4 bg-slate-50 p-6 rounded-2xl">
                <div className="h-5 bg-slate-200 rounded w-1/3" />
                <div className="h-24 bg-white rounded-xl border border-slate-100" />
                <div className="space-y-2.5 pt-3">
                  <div className="h-10 bg-white rounded-xl border border-slate-100" />
                  <div className="h-10 bg-white rounded-xl border border-slate-100" />
                </div>
              </div>
              <div className="lg:col-span-5 h-80 bg-slate-50 rounded-2xl p-6" />
            </div>
          ) : (
            <>
              {/* Two-Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left Column (7 cols): Nhận Định Vĩ Mô & Xu Hướng Hôm Nay */}
                <section className="lg:col-span-7 bg-gradient-to-b from-white to-slate-50/80 rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                  {/* Thanh màu trang trí trên cùng */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500" />

                  <div>
                    {/* Section Title */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px]">trending_up</span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-800">
                          Nhận Định Vĩ Mô &amp; Xu Hướng Hôm Nay
                        </h3>
                      </div>
                      <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="material-symbols-outlined text-[15px]">north_east</span>
                        <span>Tích cực</span>
                      </span>
                    </div>

                    {/* Main Paragraph */}
                    <p className="text-sm sm:text-[15px] text-slate-600 leading-relaxed bg-white p-4 rounded-xl border border-slate-100 shadow-2xs font-normal">
                      {data?.aiMacroSummary || (
                        <>
                          Thị trường tài chính khởi sắc với{' '}
                          <span className="font-semibold text-emerald-600">sắc xanh lan tỏa</span>, chỉ số{' '}
                          <span className="font-semibold text-slate-800">VN-Index</span> giữ vững đà tăng trưởng
                          phản ánh tâm lý lạc quan từ các tín hiệu vĩ mô và dòng vốn tín dụng hỗ trợ sản xuất kinh
                          doanh. Các kênh đầu tư duy trì thanh khoản ổn định, trong khi áp lực lạm phát và tỷ giá
                          vẫn nằm trong tầm kiểm soát của cơ quan quản lý tiền tệ. Đây là thời điểm thuận lợi để
                          người dùng rà soát lại cơ cấu dòng tiền, gia tăng tích lũy tài sản sinh lời song hành
                          cùng duy trì hạn mức ngân sách an toàn.
                        </>
                      )}
                    </p>
                  </div>

                  {/* 3 Key Takeaways */}
                  <div className="mt-5 pt-5 border-t border-slate-200/70">
                    <div className="flex items-center gap-2 mb-3.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        3 Điểm Then Chốt Cho Kế Hoạch Tài Chính
                      </h4>
                    </div>

                    <div className="space-y-2.5">
                      {takeaways.map((item, idx) => {
                        const styleConfig = [
                          {
                            bg: 'bg-emerald-50/60 hover:bg-emerald-50 border-emerald-200/70',
                            numBg: 'bg-emerald-500 text-white',
                          },
                          {
                            bg: 'bg-blue-50/60 hover:bg-blue-50 border-blue-200/70',
                            numBg: 'bg-blue-500 text-white',
                          },
                          {
                            bg: 'bg-violet-50/60 hover:bg-violet-50 border-violet-200/70',
                            numBg: 'bg-violet-500 text-white',
                          },
                        ][idx % 3];

                        return (
                          <div
                            key={idx}
                            className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${styleConfig.bg}`}
                          >
                            <span
                              className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${styleConfig.numBg}`}
                            >
                              {idx + 1}
                            </span>
                            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-snug">
                              {item}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>

                {/* Right Column (5 cols): Cố Vấn Ngân Sách Hôm Nay */}
                <section className="lg:col-span-5 bg-gradient-to-b from-white to-indigo-50/30 rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                  {/* Thanh màu trang trí trên cùng */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

                  <div>
                    {/* Header & Status Badge */}
                    <div className="flex items-center justify-between gap-2 mb-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-800">
                          Cố Vấn Ngân Sách Hôm Nay
                        </h3>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${
                          !hasBudget
                            ? 'bg-amber-50 text-amber-700 border-amber-300'
                            : badgeColor
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {!hasBudget ? 'help_outline' : isDanger ? 'warning' : isWarning ? 'info' : 'verified_user'}
                        </span>
                        <span>
                          {!hasBudget
                            ? 'Chưa đặt hạn mức'
                            : isDanger
                            ? 'Nguy cơ vượt'
                            : isWarning
                            ? 'Cần chú ý'
                            : 'An toàn'}
                        </span>
                      </span>
                    </div>

                    {hasBudget ? (
                      <>
                        {/* Progress Bars Card */}
                        <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 space-y-4">
                          {/* Time Progress */}
                          <div>
                            <div className="flex justify-between items-center text-xs sm:text-sm mb-1.5">
                              <span className="text-slate-600 font-medium flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px] text-indigo-500">schedule</span>
                                <span>
                                  Tiến độ tháng: <strong className="text-slate-800">Ngày {dayOfMonth}/{daysInMonth}</strong>
                                </span>
                              </span>
                              <span className="font-bold text-indigo-600 tabular-nums">
                                {timeProgressPercent.toFixed(1)}% thời gian
                              </span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, timeProgressPercent)}%` }}
                              />
                            </div>
                          </div>

                          {/* Budget Progress */}
                          <div>
                            <div className="flex justify-between items-center text-xs sm:text-sm mb-1.5">
                              <span className="text-slate-600 font-medium flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px] text-emerald-500">pie_chart</span>
                                <span>Tỷ lệ ngân sách đã dùng:</span>
                              </span>
                              <span
                                className={`font-bold tabular-nums ${
                                  spentPercent > timeProgressPercent + 10 ? 'text-rose-600' : 'text-emerald-600'
                                }`}
                              >
                                {spentPercent.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  spentPercent > timeProgressPercent + 10
                                    ? 'bg-gradient-to-r from-rose-500 to-red-600'
                                    : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                }`}
                                style={{ width: `${Math.min(100, spentPercent)}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* 3 Metric Boxes */}
                        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mt-4">
                          {/* Hạn mức */}
                          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3 text-center">
                            <span className="block text-[11px] sm:text-xs font-medium text-blue-700 mb-0.5">Hạn mức</span>
                            <span className="block text-sm sm:text-base font-extrabold text-slate-800 tabular-nums">
                              {formatCurrencyAbbr(totalBudget)}
                            </span>
                          </div>
                          {/* Đã chi */}
                          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 text-center">
                            <span className="block text-[11px] sm:text-xs font-medium text-amber-700 mb-0.5">Đã chi</span>
                            <span className="block text-sm sm:text-base font-extrabold text-amber-700 tabular-nums">
                              {formatCurrencyAbbr(totalSpent)}
                            </span>
                          </div>
                          {/* Còn lại */}
                          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3 text-center">
                            <span className="block text-[11px] sm:text-xs font-medium text-emerald-700 mb-0.5">Còn lại</span>
                            <span
                              className={`block text-sm sm:text-base font-extrabold tabular-nums ${
                                totalRemaining >= 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {formatCurrencyAbbr(totalRemaining)}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Empty Budget State Card */}
                        <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 space-y-3.5">
                          {/* Time Progress */}
                          <div>
                            <div className="flex justify-between items-center text-xs sm:text-sm mb-1.5">
                              <span className="text-slate-600 font-medium flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px] text-indigo-500">schedule</span>
                                <span>
                                  Tiến độ tháng: <strong className="text-slate-800">Ngày {dayOfMonth}/{daysInMonth}</strong>
                                </span>
                              </span>
                              <span className="font-bold text-indigo-600 tabular-nums">
                                {timeProgressPercent.toFixed(1)}% thời gian
                              </span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, timeProgressPercent)}%` }}
                              />
                            </div>
                          </div>

                          <div className="p-3.5 bg-white rounded-xl border border-slate-200/70 text-xs sm:text-sm text-slate-600 leading-relaxed shadow-2xs">
                            <p className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[17px] text-amber-500">notification_important</span>
                              <span>Chưa thiết lập ngân sách tháng này</span>
                            </p>
                            <p className="text-slate-600">
                              {alert?.message ||
                                `Hôm nay đã là ngày ${dayOfMonth}/${daysInMonth}. Hãy thiết lập ngân sách chi tiêu để FinMan AI tự động theo dõi và cảnh báo bạn.`}
                            </p>
                            {totalSpent > 0 && (
                              <p className="mt-2 text-xs font-semibold text-amber-700">
                                Đã phát sinh chi tiêu tháng này: {formatCurrencyAbbr(totalSpent)}
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Recommendation Callout */}
                    <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/90 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-emerald-800">Khuyến nghị hôm nay:</h4>
                        <p className="text-xs sm:text-sm text-emerald-700/90 mt-0.5 leading-snug">
                          {alert?.recommendation || (
                            hasBudget
                              ? 'Duy trì thói quen chi tiêu này để gia tăng thặng dư tích lũy vào cuối tháng.'
                              : 'Thiết lập ngân sách hàng tháng giúp bạn gia tăng 20% khả năng tích lũy tài sản dài hạn.'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  {onNavigateToBudget && (
                    <button
                      type="button"
                      onClick={onNavigateToBudget}
                      className="mt-5 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer"
                    >
                      <span>{hasBudget ? 'Quản lý hạn mức ngân sách' : '+ Thiết lập ngân sách ngay'}</span>
                      <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
                    </button>
                  )}
                </section>
              </div>

              {/* Footer Chat Prompts Section */}
              <section className="pt-4 border-t border-slate-200/80">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs">
                      <span className="material-symbols-outlined text-[16px]">neurology</span>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      Hỏi Trợ lý FinMan AI về bản tin hôm nay:
                    </span>
                  </div>
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                    Nhấn để trò chuyện
                  </span>
                </div>

                {/* Horizontal Scrollable Prompts with Controls */}
                <div className="relative flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => scrollPrompts(-260)}
                    aria-label="Cuộn trái"
                    className="hidden sm:flex w-8 h-8 rounded-full bg-white border border-slate-200 shadow-xs items-center justify-center text-slate-600 hover:text-emerald-600 hover:border-emerald-300 shrink-0 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>

                  <div
                    ref={promptsContainerRef}
                    className="flex items-center gap-3 overflow-x-auto pb-2.5 custom-scroll w-full scroll-smooth"
                  >
                    {prompts.map((promptText, idx) => {
                      const pillColors = [
                        'bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-500 hover:to-teal-600 text-emerald-800 hover:text-white border-emerald-200',
                        'bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-500 hover:to-indigo-600 text-blue-800 hover:text-white border-blue-200',
                        'bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-500 hover:to-purple-600 text-violet-800 hover:text-white border-violet-200',
                      ][idx % 3];

                      const arrowColors = [
                        'text-emerald-600 group-hover:text-white',
                        'text-blue-600 group-hover:text-white',
                        'text-violet-600 group-hover:text-white',
                      ][idx % 3];

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handlePromptClick(promptText)}
                          className={`shrink-0 group inline-flex items-center gap-2 px-4 py-2.5 rounded-full border hover:border-transparent text-xs sm:text-sm font-medium transition-all shadow-2xs cursor-pointer ${pillColors}`}
                        >
                          <span>&ldquo;{promptText}&rdquo;</span>
                          <span
                            className={`material-symbols-outlined text-[15px] transition-transform group-hover:translate-x-0.5 ${arrowColors}`}
                          >
                            arrow_forward
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => scrollPrompts(260)}
                    aria-label="Cuộn phải"
                    className="hidden sm:flex w-8 h-8 rounded-full bg-white border border-slate-200 shadow-xs items-center justify-center text-slate-600 hover:text-emerald-600 hover:border-emerald-300 shrink-0 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </section>
            </>
          )}
        </div>
      )}

      {/* Toast Notification (Feedback khi click prompt hoặc refresh) */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-fadeIn pointer-events-none">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 max-w-sm">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-100">{toastMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};
