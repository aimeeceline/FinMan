import React, { useState } from 'react';
import type { UserWatchlistItem } from '../../types/market';
import {
  formatChangePrice,
  formatPercent,
  formatVndPrice,
} from '../../types/market';

interface WatchlistTableProps {
  watchlist: UserWatchlistItem[];
  isLoading?: boolean;
  onRemove: (symbol: string) => void;
  onAdd: (symbol: string, note?: string, targetPrice?: number) => void;
  onUpdate: (id: number, note?: string, targetPrice?: number, alertEnabled?: boolean) => void;
  onSelectStock: (symbol: string) => void;
}

export const WatchlistTable: React.FC<WatchlistTableProps> = ({
  watchlist,
  isLoading = false,
  onRemove,
  onAdd,
  onUpdate,
  onSelectStock,
}) => {
  const [newSymbol, setNewSymbol] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newTargetPrice, setNewTargetPrice] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Quick suggestions if empty
  const suggestions = ['FPT', 'VCB', 'HPG', 'MWG', 'SSI', 'SHS'];

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim()) return;
    const target = newTargetPrice ? parseFloat(newTargetPrice) : undefined;
    onAdd(newSymbol.trim().toUpperCase(), newNote.trim() || undefined, target);
    setNewSymbol('');
    setNewNote('');
    setNewTargetPrice('');
    setIsAdding(false);
  };

  return (
    <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden flex flex-col">
      {/* 1. Header: Tiêu đề, Số lượng & Nút Thêm mới */}
      <div className="p-4 sm:p-5 border-b border-outline-variant/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-[22px]">
              stars
            </span>
            <h3 className="font-headline-sm text-lg sm:text-xl font-extrabold text-on-surface">
              Danh Mục Cổ Phiếu Theo Dõi (Watchlist)
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono">
              {watchlist.length} mã
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Quản lý danh sách cổ phiếu trọng điểm, ghi chú chiến lược và theo dõi giá mục tiêu
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          data-testid="add-watchlist-btn"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary/95 active:scale-[0.98] transition-all cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[17px]">
            {isAdding ? 'close' : 'add_circle'}
          </span>
          <span>{isAdding ? 'Đóng' : 'Thêm mã theo dõi'}</span>
        </button>
      </div>

      {/* 2. Inline Add Form */}
      {isAdding && (
        <form
          onSubmit={handleAddNew}
          data-testid="add-watchlist-form"
          className="p-4 bg-surface-container/60 border-b border-outline-variant/20 flex flex-col sm:flex-row items-center gap-3 animate-fadeIn"
        >
          <div className="w-full sm:w-36">
            <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
              Mã CP (*)
            </label>
            <input
              type="text"
              required
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              placeholder="VD: FPT"
              maxLength={10}
              className="w-full px-3 py-1.5 rounded-xl bg-surface-container-lowest text-xs font-mono font-bold uppercase text-on-surface border border-outline-variant/40 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="w-full sm:w-44">
            <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
              Giá mục tiêu (VNĐ)
            </label>
            <input
              type="number"
              value={newTargetPrice}
              onChange={(e) => setNewTargetPrice(e.target.value)}
              placeholder="VD: 150000"
              step={100}
              className="w-full px-3 py-1.5 rounded-xl bg-surface-container-lowest text-xs font-mono text-on-surface border border-outline-variant/40 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="w-full sm:flex-1">
            <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
              Ghi chú chiến lược
            </label>
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="VD: Chờ mua tích lũy khi kiểm định MA20..."
              className="w-full px-3 py-1.5 rounded-xl bg-surface-container-lowest text-xs text-on-surface border border-outline-variant/40 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="w-full sm:w-auto self-end pt-2 sm:pt-0">
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Lưu mã
            </button>
          </div>
        </form>
      )}

      {/* 3. Watchlist Table */}
      <div className="overflow-x-auto custom-scroll flex-1">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-surface-container/50 border-b border-outline-variant/20 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider select-none">
              <th className="py-3 px-4">Mã CP</th>
              <th className="py-3 px-4">Tên Doanh Nghiệp</th>
              <th className="py-3 px-3 text-center">Sàn</th>
              <th className="py-3 px-4 text-right">Giá Khớp</th>
              <th className="py-3 px-4 text-right">Biến Động</th>
              <th className="py-3 px-4 text-right">Giá Mục Tiêu</th>
              <th className="py-3 px-4">Ghi Chú</th>
              <th className="py-3 px-3 text-center">Cảnh Báo</th>
              <th className="py-3 px-4 text-center">Thao Tác</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-outline-variant/10 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-16 text-center text-on-surface-variant">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[32px] text-primary animate-spin">
                      progress_activity
                    </span>
                    <span className="text-xs font-medium">Đang tải danh sách theo dõi...</span>
                  </div>
                </td>
              </tr>
            ) : watchlist.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center text-on-surface-variant">
                  <div className="flex flex-col items-center justify-center gap-3 max-w-md mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[28px]">star_outline</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-on-surface">Danh sách theo dõi đang trống</h4>
                      <p className="text-xs text-on-surface-variant/70 mt-1">
                        Hãy thêm các mã cổ phiếu bạn quan tâm để theo dõi biến động sát sao và thiết lập giá mục tiêu.
                      </p>
                    </div>

                    {/* Quick Suggestions */}
                    <div className="flex items-center gap-1.5 flex-wrap justify-center pt-2">
                      <span className="text-xs font-medium text-on-surface-variant mr-1">Thêm nhanh:</span>
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => onAdd(s)}
                          className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-mono font-bold text-xs transition-colors cursor-pointer"
                        >
                          +{s}
                        </button>
                      ))}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              watchlist.map((item) => {
                const isPositive = item.changePrice > 0;
                const isNegative = item.changePrice < 0;
                const colorClass = isPositive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : isNegative
                  ? 'text-rose-600 dark:text-rose-400 font-bold'
                  : 'text-amber-600 dark:text-amber-400 font-bold';

                // Tính khoảng cách đến giá mục tiêu (%)
                let diffTargetPct: number | null = null;
                if (item.targetPrice && item.currentPrice > 0) {
                  diffTargetPct = ((item.targetPrice - item.currentPrice) / item.currentPrice) * 100;
                }

                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectStock(item.symbol)}
                    data-testid={`watchlist-row-${item.symbol}`}
                    className="hover:bg-surface-container/60 transition-colors cursor-pointer group"
                  >
                    {/* Mã CP */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-currency-row font-black text-sm tracking-wider text-on-surface group-hover:text-primary transition-colors">
                          {item.symbol}
                        </span>
                        {item.sector && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-medium hidden sm:inline-block">
                            {item.sector}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Tên Doanh Nghiệp */}
                    <td className="py-3 px-4 max-w-[200px]">
                      <span className="truncate block font-medium text-on-surface-variant group-hover:text-on-surface" title={item.companyName}>
                        {item.companyName}
                      </span>
                    </td>

                    {/* Sàn */}
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-surface-container text-on-surface-variant">
                        {item.exchange}
                      </span>
                    </td>

                    {/* Giá Khớp */}
                    <td className="py-3 px-4 text-right">
                      <span className={`font-currency-row text-sm font-black ${colorClass}`}>
                        {formatVndPrice(item.currentPrice)}
                      </span>
                    </td>

                    {/* Biến Động */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span className={`font-mono text-xs ${colorClass}`}>
                          {formatChangePrice(item.changePrice)}
                        </span>
                        <span className={`font-mono text-[11px] ${colorClass}`}>
                          {formatPercent(item.percentChange)}
                        </span>
                      </div>
                    </td>

                    {/* Giá Mục Tiêu */}
                    <td className="py-3 px-4 text-right font-mono text-xs">
                      {item.targetPrice ? (
                        <div>
                          <span className="font-bold text-on-surface block">
                            {formatVndPrice(item.targetPrice)}
                          </span>
                          {diffTargetPct !== null && (
                            <span
                              className={`text-[10px] font-semibold ${
                                diffTargetPct > 0 ? 'text-emerald-600' : 'text-slate-400'
                              }`}
                            >
                              {diffTargetPct > 0 ? `+${diffTargetPct.toFixed(1)}%` : `${diffTargetPct.toFixed(1)}%`}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-on-surface-variant/40">—</span>
                      )}
                    </td>

                    {/* Ghi Chú */}
                    <td className="py-3 px-4 max-w-[220px]">
                      <span className="text-xs text-on-surface-variant truncate block" title={item.note || ''}>
                        {item.note || <span className="text-on-surface-variant/40 italic">Chưa có ghi chú</span>}
                      </span>
                    </td>

                    {/* Cảnh Báo Toggle */}
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdate(item.id, item.note, item.targetPrice, !item.alertEnabled)
                        }
                        title={item.alertEnabled ? 'Đang bật cảnh báo' : 'Tắt cảnh báo'}
                        className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-colors cursor-pointer ${
                          item.alertEnabled
                            ? 'text-primary bg-primary/10 hover:bg-primary/20'
                            : 'text-on-surface-variant/40 hover:text-on-surface-variant'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[17px]">
                          {item.alertEnabled ? 'notifications_active' : 'notifications_off'}
                        </span>
                      </button>
                    </td>

                    {/* Thao Tác (Chi tiết & Xóa) */}
                    <td className="py-3 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectStock(item.symbol)}
                          title="Xem chi tiết & lịch sử giá"
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                        >
                          Chi tiết
                        </button>

                        <button
                          type="button"
                          onClick={() => onRemove(item.symbol)}
                          title="Xóa khỏi Watchlist"
                          className="w-7 h-7 rounded-lg text-rose-500 hover:bg-rose-500/10 inline-flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[17px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
