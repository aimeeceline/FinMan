import React, { useState, useEffect } from 'react';
import type { Account, Category, Transaction, TransactionType } from '../../types';
import { categoryService } from '../../services/categoryService';
import { formatCurrencyInput, parseCurrencyInput } from '../../utils/formatters';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  accounts?: Account[];
  categories?: Category[];
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  accounts = [],
  categories,
}) => {
  const [categoriesList, setCategoriesList] = useState<Category[]>(categories || []);
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');

  // Load categories from database if not provided
  useEffect(() => {
    if (categories && categories.length > 0) {
      setCategoriesList(categories);
    } else if (isOpen) {
      categoryService
        .getCategories()
        .then(setCategoriesList)
        .catch((err) => console.error('Error fetching categories in modal:', err));
    }
  }, [categories, isOpen]);

  const filteredCategories = categoriesList.filter((c) =>
    type === 'INCOME' ? c.type === 'INCOME' : c.type === 'EXPENSE'
  );

  // Sync selectedCategory when type or filteredCategories change
  useEffect(() => {
    if (filteredCategories.length > 0) {
      if (!selectedCategory || selectedCategory.type !== type || !filteredCategories.some(c => c.id === selectedCategory.id)) {
        setSelectedCategory(filteredCategories[0]);
      }
    } else {
      setSelectedCategory(null);
    }
  }, [filteredCategories, type]);

  // Sync selectedAccount when accounts change
  useEffect(() => {
    if (accounts.length > 0) {
      if (!selectedAccount || !accounts.some(a => a.id === selectedAccount.id)) {
        setSelectedAccount(accounts[0]);
      }
    } else {
      setSelectedAccount(null);
    }
  }, [accounts]);

  if (!isOpen) return null;

  const quickAmounts = [10000, 50000, 100000, 500000, 1000000];

  const handleAddQuickAmount = (val: number) => {
    setAmount((prev) => prev + val);
  };

  const handleClearAmount = () => {
    setAmount(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !selectedCategory || !selectedAccount) return;

    onAddTransaction({
      amount,
      type,
      category: selectedCategory,
      account: selectedAccount,
      date,
      time: new Date().toTimeString().slice(0, 5),
      note: note.trim() || undefined,
    });

    // Reset and close
    setAmount(0);
    setNote('');
    onClose();
  };

  const hasNoAccounts = accounts.length === 0;

  return (
    <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-md z-50 flex items-center justify-center p-4 lg:p-6 transition-all duration-300 select-none">
      <section
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-fadeIn border border-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Bar */}
        <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
            <h2 className="text-base font-bold text-slate-900">Ghi nhận Giao dịch Mới</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </header>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {hasNoAccounts && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
              <span className="material-symbols-outlined text-amber-600 text-lg">warning</span>
              <span>
                Bạn chưa có tài khoản/ví nào trong cơ sở dữ liệu. Vui lòng vào trang <strong>Tài khoản & Tài sản</strong> để tạo tài khoản trước khi ghi nhận giao dịch.
              </span>
            </div>
          )}

          {/* Type Toggle: Chi tiêu vs Thu nhập */}
          <div className="flex items-center justify-center">
            <nav className="flex p-1 bg-slate-100 rounded-2xl w-full max-w-sm justify-between shadow-inner">
              <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                  type === 'EXPENSE'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-slate-600 hover:text-red-700 hover:bg-white/80'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                <span>Khoản Chi tiêu</span>
              </button>
              <button
                type="button"
                onClick={() => setType('INCOME')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                  type === 'INCOME'
                    ? 'bg-secondary text-white shadow-md'
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-white/80'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                <span>Khoản Thu nhập</span>
              </button>
            </nav>
          </div>

          {/* Amount Hero Input */}
          <div
            className={`rounded-2xl p-5 text-center shadow-sm border transition-all ${
              type === 'EXPENSE'
                ? 'bg-gradient-to-b from-red-50/60 to-transparent border-red-100'
                : 'bg-gradient-to-b from-emerald-50/60 to-transparent border-emerald-100'
            }`}
          >
            <label
              className={`block text-xs font-bold uppercase tracking-wider mb-1 ${
                type === 'EXPENSE' ? 'text-red-600/80' : 'text-emerald-600/80'
              }`}
            >
              {type === 'EXPENSE' ? 'Số tiền chi tiêu' : 'Số tiền thu nhập'}
            </label>
            <div className="flex items-center justify-center gap-2">
              <span
                className={`text-3xl lg:text-4xl font-extrabold tracking-tight ${
                  type === 'EXPENSE' ? 'text-primary' : 'text-secondary'
                }`}
              >
                {type === 'EXPENSE' ? '-' : '+'}
              </span>
              <input
                className={`w-72 lg:w-96 text-center text-4xl lg:text-5xl font-extrabold bg-transparent border-0 border-b-2 focus:ring-0 p-0 tracking-tight font-currency-display ${
                  type === 'EXPENSE'
                    ? 'text-primary border-red-300 focus:border-red-600'
                    : 'text-secondary border-emerald-300 focus:border-emerald-600'
                }`}
                type="text"
                inputMode="numeric"
                value={amount > 0 ? formatCurrencyInput(amount) : ''}
                onChange={(e) => setAmount(parseCurrencyInput(e.target.value))}
                placeholder="0"
              />
              <span
                className={`text-2xl lg:text-3xl font-bold underline ${
                  type === 'EXPENSE'
                    ? 'text-primary decoration-red-300'
                    : 'text-secondary decoration-emerald-300'
                }`}
              >
                ₫
              </span>
            </div>

            {/* Quick Denominations */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleAddQuickAmount(q)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-red-400 hover:text-red-600 hover:bg-red-50/50 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  +{q.toLocaleString('vi-VN')}₫
                </button>
              ))}
              <button
                type="button"
                onClick={handleClearAmount}
                className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 shadow-sm active:scale-95 transition-all cursor-pointer"
                title="Xóa số tiền"
              >
                Xóa (C)
              </button>
            </div>
          </div>

          {/* Form Fields: Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-1">
            {/* Category Select (7 cols) */}
            <div className="md:col-span-7 space-y-3">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    type === 'EXPENSE' ? 'bg-primary' : 'bg-secondary'
                  }`}
                ></span>
                Chọn Danh mục
              </label>

              {filteredCategories.length === 0 ? (
                <div className="text-xs text-slate-500 py-3 text-center bg-slate-50 rounded-xl">
                  Chưa có danh mục nào trong cơ sở dữ liệu.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                  {filteredCategories.map((c) => {
                    const isSelected = selectedCategory?.id === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCategory(c)}
                        className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20 text-on-surface font-semibold shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: c.bgColor || '#fee2e2', color: c.color || '#dc2626' }}
                        >
                          <span className="material-symbols-outlined text-[18px]">{c.icon}</span>
                        </div>
                        <span className="text-xs truncate">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Account & Details (5 cols) */}
            <div className="md:col-span-5 space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[18px] text-tertiary">
                    account_balance_wallet
                  </span>
                  Tài khoản giao dịch
                </label>
                {hasNoAccounts ? (
                  <div className="text-xs text-red-500 font-medium">Chưa có tài khoản</div>
                ) : (
                  <select
                    value={selectedAccount?.id || ''}
                    onChange={(e) => {
                      const acc = accounts.find((a) => a.id === Number(e.target.value));
                      if (acc) setSelectedAccount(acc);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-tertiary/40"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.currentBalance.toLocaleString('vi-VN')} ₫)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[18px] text-slate-500">
                    event
                  </span>
                  Ngày giao dịch
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-tertiary/40"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[18px] text-slate-500">
                    edit_note
                  </span>
                  Ghi chú (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Ăn trưa với đối tác, Đổ xăng..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-tertiary/40"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-sm transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={amount <= 0 || hasNoAccounts || !selectedCategory || !selectedAccount}
              className={`px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer ${
                type === 'EXPENSE'
                  ? 'bg-primary hover:bg-primary-container'
                  : 'bg-secondary hover:brightness-110'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Lưu giao dịch
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
