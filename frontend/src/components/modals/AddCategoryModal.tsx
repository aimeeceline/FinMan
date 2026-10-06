import React, { useState, useEffect } from 'react';
import type { Category } from '../../types';
import { categoryService } from '../../services/categoryService';

export const PRESET_CATEGORY_ICONS = [
  '🍜', '👕', '🛒', '🚕', '🎮',
  '🏠', '💊', '📚', '☕', '✈️',
  '🎬', '📱', '💻', '🎁', '📈',
  '📦', '⚽', '🛠️', '🪙', '💰',
  '🍔', '🍕', '🍺', '🚗', '⛽',
  '🏥', '👶', '🐕', '🎓', '💼',
  '🏖️', '🏋️', '💡', '💳', '🧾',
];

export interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newCategory: Category) => void;
  initialType?: 'EXPENSE' | 'INCOME';
  showTypeSelector?: boolean;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialType = 'EXPENSE',
  showTypeSelector = false,
}) => {
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>(initialType);
  const [name, setName] = useState<string>('');
  const [selectedIcon, setSelectedIcon] = useState<string>('🍜');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state whenever modal opens or initialType changes
  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setName('');
      setSelectedIcon(initialType === 'INCOME' ? '💰' : '🍜');
      setErrorMessage(null);
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMessage('Vui lòng nhập tên danh mục.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const created = await categoryService.createCategory({
        name: trimmed,
        type,
        icon: selectedIcon,
        color: type === 'INCOME' ? '#059669' : '#dc2626',
      });

      // Dispatch global event for other components listening
      window.dispatchEvent(new CustomEvent('finman_categories_updated', { detail: created }));

      if (onSuccess) {
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      console.error('Lỗi khi tạo danh mục:', err);
      const msg = err.response?.data?.message || err.message || 'Không thể tạo danh mục mới. Vui lòng thử lại!';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isExpense = type === 'EXPENSE';
  const primaryThemeColor = isExpense ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700';
  const iconThemeColor = isExpense ? 'text-red-600' : 'text-emerald-600';
  const activeIconBg = isExpense ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white';

  return (
    <div
      className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in zoom-in-95 duration-150 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <span className={`material-symbols-outlined ${iconThemeColor} text-[22px]`}>
              add_circle
            </span>
            Thêm danh mục {isExpense ? 'Chi tiêu' : 'Thu nhập'} mới
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
            title="Đóng"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200 animate-in fade-in duration-150">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Optional Type Selector (when used in SettingsPage) */}
          {showTypeSelector && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Loại danh mục
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setType('EXPENSE');
                    if (selectedIcon === '💰') setSelectedIcon('🍜');
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isExpense
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Chi tiêu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('INCOME');
                    if (selectedIcon === '🍜') setSelectedIcon('💰');
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    !isExpense
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Thu nhập
                </button>
              </div>
            </div>
          )}

          {/* Category Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ví dụ: Du lịch, Thú cưng, Bảo hiểm..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            />
          </div>

          {/* Category Icon Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Chọn biểu tượng icon
            </label>
            <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto custom-scroll p-1.5 bg-slate-50 rounded-xl border border-slate-200">
              {PRESET_CATEGORY_ICONS.map((icon) => {
                const isSelected = selectedIcon === icon;
                return (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setSelectedIcon(icon)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? `${activeIconBg} shadow-md scale-105`
                        : 'bg-white hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {icon}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer ${primaryThemeColor}`}
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo danh mục'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default AddCategoryModal;
