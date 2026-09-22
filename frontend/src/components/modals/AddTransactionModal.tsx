import React, { useState } from 'react';
import type { Account, Category, Transaction, TransactionType } from '../../types';
import { DEFAULT_CATEGORIES } from '../../constants/categories';
import { DEFAULT_ACCOUNTS } from '../../constants/accounts';
import { formatCurrencyInput, parseCurrencyInput } from '../../utils/formatters';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  accounts?: Account[];
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  accounts,
}) => {
  const accountList = accounts && accounts.length > 0 ? accounts : DEFAULT_ACCOUNTS;
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<Category>(DEFAULT_CATEGORIES[0]);
  const [selectedAccount, setSelectedAccount] = useState<Account>(accountList[0]);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');

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
    if (amount <= 0) return;

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

  const filteredCategories = DEFAULT_CATEGORIES.filter((c) =>
    type === 'INCOME' ? c.type === 'INCOME' : c.type === 'EXPENSE'
  );

  return (
    <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-md z-50 flex items-center justify-center p-4 lg:p-6 transition-all duration-300 select-none">
      <section className="bg-white w-full max-w-4xl rounded-3xl shadow-modal border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <header className="relative px-7 pt-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/70 via-white to-amber-50/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-full border border-amber-300/40 p-0.5 bg-amber-50 flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-amber-600 text-2xl">
                  add_card
                </span>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-primary border-2 border-white"></span>
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Thêm giao dịch mới
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Ghi nhận thu chi nhanh chóng vào sổ cái tài chính
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </header>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto custom-scroll px-7 py-5 space-y-6">
          {/* Transaction Type Tabs */}
          <div className="flex justify-center">
            <nav className="inline-flex p-1.5 bg-slate-100/90 rounded-2xl gap-1 border border-slate-200/80 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setType('EXPENSE');
                  const firstExp = DEFAULT_CATEGORIES.find((c) => c.type === 'EXPENSE');
                  if (firstExp) setSelectedCategory(firstExp);
                }}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                  type === 'EXPENSE'
                    ? 'bg-primary text-white shadow-glow-red'
                    : 'text-slate-600 hover:text-red-600 hover:bg-white/80'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                <span>Khoản Chi tiêu</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('INCOME');
                  const firstInc = DEFAULT_CATEGORIES.find((c) => c.type === 'INCOME');
                  if (firstInc) setSelectedCategory(firstInc);
                }}
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {filteredCategories.map((c) => {
                  const isSelected = selectedCategory.id === c.id;
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
                <select
                  value={selectedAccount.id}
                  onChange={(e) => {
                    const acc = accountList.find((a) => a.id === Number(e.target.value));
                    if (acc) setSelectedAccount(acc);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-tertiary/40"
                >
                  {accountList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currentBalance.toLocaleString('vi-VN')} ₫)
                    </option>
                  ))}
                </select>
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
              disabled={amount <= 0}
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
