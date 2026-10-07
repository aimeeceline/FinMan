import React, { useEffect } from 'react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: string | React.ReactNode;
  itemTitle?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  icon?: string;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận thao tác',
  message,
  itemTitle,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  type = 'danger',
  icon,
  isLoading = false,
}) => {
  // Support Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isDanger = type === 'danger';
  const isWarning = type === 'warning';

  const defaultIcon = isDanger ? 'delete_forever' : isWarning ? 'warning' : 'info';
  const activeIcon = icon || defaultIcon;

  const iconBgColor = isDanger
    ? 'bg-error-container/60 text-error ring-error/20'
    : isWarning
    ? 'bg-amber-500/15 text-amber-600 ring-amber-500/20'
    : 'bg-primary/10 text-primary ring-primary/20';

  const confirmBtnColor = isDanger
    ? 'bg-error hover:bg-error/90 shadow-error/20 text-white'
    : isWarning
    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20 text-white'
    : 'bg-primary hover:bg-primary-container shadow-primary/20 text-white';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none"
      onClick={() => {
        if (!isLoading) onClose();
      }}
    >
      <div
        className="w-full max-w-md bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-outline-variant/30 space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Icon */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ring-1 shadow-xs ${iconBgColor}`}
          >
            <span className="material-symbols-outlined text-[26px]">{activeIcon}</span>
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h4 className="text-base font-bold text-on-surface tracking-tight">
              {title}
            </h4>
            {message && (
              <div className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                {message}
              </div>
            )}
          </div>
        </div>

        {/* Item Title Preview Box (e.g. tên giao dịch) */}
        {itemTitle && (
          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0">
              receipt_long
            </span>
            <span className="text-xs font-bold text-on-surface truncate">
              {itemTitle}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-outline-variant/15">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={async () => {
              await onConfirm();
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${confirmBtnColor}`}
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[17px]">
                  {isDanger ? 'delete' : 'check'}
                </span>
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
