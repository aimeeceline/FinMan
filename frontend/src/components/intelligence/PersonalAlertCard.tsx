import React from 'react';
import type { PersonalFinancialAlert } from '../../types/intelligence';

interface PersonalAlertCardProps {
  alert?: PersonalFinancialAlert;
  onNavigateToBudget?: () => void;
}

export const PersonalAlertCard: React.FC<PersonalAlertCardProps> = ({
  alert,
  onNavigateToBudget,
}) => {
  if (!alert) return null;

  const isSafe = alert.alertLevel === 'SAFE';
  const isWarning = alert.alertLevel === 'WARNING';
  const isDanger = alert.alertLevel === 'DANGER';

  const badgeColor = isDanger
    ? 'bg-error-container text-on-error-container border-error/30'
    : isWarning
    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
    : isSafe
    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
    : 'bg-primary/10 text-primary border-primary/20';

  const iconName = isDanger
    ? 'warning'
    : isWarning
    ? 'info'
    : isSafe
    ? 'verified'
    : 'account_balance_wallet';

  return (
    <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-5 sm:p-6 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-outline-variant/15">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
              isDanger
                ? 'bg-error/10 text-error'
                : isWarning
                ? 'bg-amber-500/10 text-amber-600'
                : 'bg-primary/10 text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{iconName}</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-sm sm:text-base font-bold text-on-surface">
              Góc Cố Vấn Dòng Tiền Cá Nhân
            </h3>
            <p className="text-[11px] text-on-surface-variant">
              Đối chiếu tiến độ chu kỳ tháng và hạn mức chi tiêu thực tế
            </p>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badgeColor}`}>
          {isDanger
            ? 'Cảnh báo chi tiêu'
            : isWarning
            ? 'Cần chú ý'
            : isSafe
            ? 'Tiến độ an toàn'
            : 'Thông tin'}
        </span>
      </div>

      {/* Progress Bars comparison */}
      <div className="space-y-3 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20">
        <div className="flex items-center justify-between text-xs">
          <span className="text-on-surface-variant font-medium">
            Tiến độ ngày trong tháng: <strong>Ngày {alert.dayOfMonth}/{alert.daysInMonth}</strong>
          </span>
          <span className="font-bold text-on-surface tabular-nums">
            {alert.monthProgressPercent.toFixed(1)}%
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
          <div
            className="h-full bg-slate-400 dark:bg-slate-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, alert.monthProgressPercent)}%` }}
          />
        </div>

        {alert.totalBudget > 0 && (
          <>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-on-surface-variant font-medium">
                Tỷ lệ ngân sách đã dùng:
              </span>
              <span
                className={`font-bold tabular-nums ${
                  alert.spentPercentage > alert.monthProgressPercent + 10
                    ? 'text-error'
                    : 'text-secondary'
                }`}
              >
                {alert.spentPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isDanger ? 'bg-error' : isWarning ? 'bg-amber-500' : 'bg-primary'
                }`}
                style={{ width: `${Math.min(100, alert.spentPercentage)}%` }}
              />
            </div>
          </>
        )}
      </div>

      {/* Detailed numbers */}
      {alert.totalBudget > 0 ? (
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15">
            <div className="text-[10px] uppercase font-bold text-on-surface-variant/70 tracking-wider">
              Tổng Ngân Sách
            </div>
            <div className="mt-1 font-currency-row font-bold text-xs sm:text-sm text-on-surface tabular-nums truncate">
              {alert.totalBudget.toLocaleString('vi-VN')} đ
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15">
            <div className="text-[10px] uppercase font-bold text-on-surface-variant/70 tracking-wider">
              Đã Chi Tiêu
            </div>
            <div className="mt-1 font-currency-row font-bold text-xs sm:text-sm text-error tabular-nums truncate">
              {alert.totalSpent.toLocaleString('vi-VN')} đ
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15">
            <div className="text-[10px] uppercase font-bold text-on-surface-variant/70 tracking-wider">
              Còn Lại
            </div>
            <div className="mt-1 font-currency-row font-bold text-xs sm:text-sm text-secondary tabular-nums truncate">
              {alert.totalRemaining.toLocaleString('vi-VN')} đ
            </div>
          </div>
        </div>
      ) : null}

      {/* Message & Recommendation */}
      <div className="space-y-2 p-3.5 rounded-2xl bg-surface-container-low/60 border border-outline-variant/20">
        <p className="text-xs text-on-surface leading-relaxed">
          {alert.message}
        </p>
        {alert.recommendation && (
          <div className="flex items-start gap-2 pt-1 border-t border-outline-variant/15">
            <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">
              lightbulb
            </span>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              <strong>Khuyến nghị:</strong> {alert.recommendation}
            </p>
          </div>
        )}
      </div>

      {/* Navigation CTA */}
      {onNavigateToBudget && (
        <button
          type="button"
          onClick={onNavigateToBudget}
          className="w-full py-2.5 px-3 rounded-2xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 text-xs font-bold text-on-surface flex items-center justify-center gap-1.5 transition-all cursor-pointer group"
        >
          <span>Quản lý & Điều chỉnh Ngân sách chi tiêu</span>
          <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform text-primary">
            arrow_forward
          </span>
        </button>
      )}
    </div>
  );
};
