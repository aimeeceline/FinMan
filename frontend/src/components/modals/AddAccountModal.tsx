import React, { useState, useEffect } from 'react';
import type { Account, AccountType, AccountCreatePayload, Category } from '../../types';
import { accountService } from '../../services/accountService';
import { transactionService } from '../../services/transactionService';
import { categoryService } from '../../services/categoryService';
import { formatCurrencyInput, parseCurrencyInput } from '../../utils/formatters';

export interface PurposePreset {
  name: string;
  icon: string;
  note: string;
  type: AccountType;
}

export interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newAccount: Account) => void;
  defaultType?: AccountType;
  existingAccounts?: Account[];
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultType = 'BANK',
  existingAccounts = [],
}) => {
  const [modalType, setModalType] = useState<AccountType>(defaultType);
  const [modalName, setModalName] = useState('');
  const [modalNote, setModalNote] = useState('');
  const [modalBalance, setModalBalance] = useState<string>('');
  const [modalCreditLimit, setModalCreditLimit] = useState<string>('');
  const [modalAccountNumber, setModalAccountNumber] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Credit card specific fields
  const [statementDay, setStatementDay] = useState<number>(20);
  const [paymentDueDay, setPaymentDueDay] = useState<number>(5);
  const [paymentAccountId, setPaymentAccountId] = useState<number | null>(null);
  const [isAutoPayment, setIsAutoPayment] = useState<boolean>(false);

  // Funding source choice when initialBalance > 0
  const [fundingSource, setFundingSource] = useState<'INCOME' | 'TRANSFER'>('INCOME');
  const [fromAccountId, setFromAccountId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Source accounts list & income categories
  const [sourceAccounts, setSourceAccounts] = useState<Account[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    setModalType(defaultType);
    setModalName('');
    setModalNote('');
    setModalBalance('');
    setModalCreditLimit('');
    setModalAccountNumber('');
    setModalError(null);
    setFundingSource('INCOME');
    setStatementDay(20);
    setPaymentDueDay(5);
    setIsAutoPayment(false);

    // 1. Sync or fetch source accounts for TRANSFER & credit card settlement
    if (existingAccounts && existingAccounts.length > 0) {
      const active = existingAccounts.filter((a) => !a.isArchived);
      setSourceAccounts(active);
      if (active.length > 0) {
        setFromAccountId(active[0].id);
        const nonCredit = active.filter((a) => a.type !== 'CREDIT_CARD');
        setPaymentAccountId(nonCredit.length > 0 ? nonCredit[0].id : active[0].id);
      } else {
        setFromAccountId(null);
        setPaymentAccountId(null);
      }
    } else {
      accountService.getAccounts()
        .then((accs) => {
          const active = (accs || []).filter((a) => !a.isArchived);
          setSourceAccounts(active);
          if (active.length > 0) {
            setFromAccountId(active[0].id);
            const nonCredit = active.filter((a) => a.type !== 'CREDIT_CARD');
            setPaymentAccountId(nonCredit.length > 0 ? nonCredit[0].id : active[0].id);
          } else {
            setFromAccountId(null);
            setPaymentAccountId(null);
          }
        })
        .catch((err) => console.warn('Could not load accounts in AddAccountModal:', err));
    }

    // 2. Fetch categories for INCOME funding
    categoryService.getCategories()
      .then((cats) => {
        const incCats = (cats || []).filter((c) => c.type === 'INCOME');
        setIncomeCategories(incCats);
        const defaultCat =
          incCats.find((c) => c.name.toLowerCase().includes('khác')) || incCats[0];
        if (defaultCat) {
          setSelectedCategoryId(defaultCat.id);
        }
      })
      .catch((err) => console.warn('Could not load categories in AddAccountModal:', err));
  }, [isOpen]);

  if (!isOpen) return null;

  const initialBal = parseCurrencyInput(modalBalance);

  const applyPreset = (preset: PurposePreset) => {
    setModalName(preset.name);
    setModalNote(preset.note);
    setModalType(preset.type);
    if (modalError) setModalError(null);
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const trimmedName = modalName.trim();
    if (!trimmedName) {
      setModalError('Vui lòng nhập tên tài khoản / mục đích sử dụng.');
      return;
    }

    const creditLim = modalType === 'CREDIT_CARD' ? parseCurrencyInput(modalCreditLimit) : 0;
    if (modalType === 'CREDIT_CARD' && creditLim <= 0) {
      setModalError('Vui lòng nhập hạn mức tín dụng lớn hơn 0 cho thẻ tín dụng.');
      return;
    }

    const accNum = modalAccountNumber.trim();
    const finalNote = modalNote.trim();

    const effectiveInitialBal = modalType === 'CREDIT_CARD' ? 0 : initialBal;

    // Validate funding parameters BEFORE creating the account in database
    let resolvedIncomeCatId: number | undefined = undefined;

    if (effectiveInitialBal > 0) {
      if (fundingSource === 'TRANSFER') {
        if (sourceAccounts.length === 0) {
          setModalError('Chưa có tài khoản nào khác để trích tiền. Hãy chọn "Tạo giao dịch thu mới".');
          return;
        }
        if (!fromAccountId) {
          setModalError('Vui lòng chọn tài khoản nguồn để trích tiền sang tài khoản mới.');
          return;
        }
      } else {
        // INCOME: Resolve valid category ID before proceeding
        resolvedIncomeCatId = selectedCategoryId || undefined;
        if (!resolvedIncomeCatId) {
          const matched =
            incomeCategories.find((c) => c.name.toLowerCase().includes('khác')) ||
            incomeCategories[0];
          resolvedIncomeCatId = matched?.id;
        }

        // Fallback: If still undefined, fetch categories dynamically
        if (!resolvedIncomeCatId) {
          try {
            const allCats = await categoryService.getCategories();
            const incCats = (allCats || []).filter((c) => c.type === 'INCOME');
            if (incCats.length > 0) {
              const matched =
                incCats.find((c) => c.name.toLowerCase().includes('khác')) || incCats[0];
              resolvedIncomeCatId = matched.id;
            } else {
              // Create default income category if none exists in database
              const createdCat = await categoryService.createCategory({
                name: 'Thu nhập khác',
                type: 'INCOME',
                icon: 'savings',
              });
              resolvedIncomeCatId = createdCat.id;
            }
          } catch (catErr) {
            console.error('Error resolving income category:', catErr);
          }
        }

        if (!resolvedIncomeCatId) {
          setModalError('Không tìm thấy danh mục thu nhập hợp lệ để ghi nhận giao dịch ban đầu.');
          return;
        }
      }
    }

    // Step 1: Create the account with initialBalance = 0 so the subsequent transaction credits it accurately
    const payload: AccountCreatePayload = {
      name: trimmedName,
      type: modalType,
      initialBalance: 0,
      creditLimit: creditLim,
      accountNumber: accNum || undefined,
      note: finalNote || undefined,
    };

    setIsSubmitting(true);
    let createdAccount: Account | null = null;

    try {
      createdAccount = await accountService.createAccount(payload);

      // Step 2: Create initial funding transaction if effectiveInitialBal > 0
      if (effectiveInitialBal > 0 && createdAccount) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        try {
          if (fundingSource === 'INCOME') {
            await transactionService.createTransaction({
              accountId: createdAccount.id,
              type: 'INCOME',
              amount: effectiveInitialBal,
              categoryId: resolvedIncomeCatId,
              transactionDate: todayStr,
              note: `Số dư ban đầu: ${createdAccount.name}`,
            });
          } else if (fundingSource === 'TRANSFER' && fromAccountId) {
            await transactionService.createTransaction({
              accountId: fromAccountId,
              toAccountId: createdAccount.id,
              type: 'TRANSFER',
              amount: effectiveInitialBal,
              transactionDate: todayStr,
              note: `Chuyển số dư ban đầu sang ${createdAccount.name}`,
            });
          }
        } catch (txErr: any) {
          console.error('Error creating funding transaction, rolling back account:', txErr);
          // Rollback the created account so we don't leave an empty/broken account in DB
          if (createdAccount?.id) {
            try {
              await accountService.deleteAccount(createdAccount.id);
            } catch (delErr) {
              console.warn('Rollback delete failed:', delErr);
            }
          }

          const txMsg =
            txErr?.response?.data?.message ||
            txErr?.response?.data?.error?.message ||
            'Không thể tạo giao dịch ban đầu cho tài khoản.';
          setModalError(`Lỗi khi tạo giao dịch số dư: ${txMsg}`);
          return;
        }
      }

      const finalAccount: Account = {
        ...createdAccount,
        initialBalance: effectiveInitialBal,
        currentBalance: effectiveInitialBal,
        creditLimit: creditLim,
        note: finalNote || createdAccount.note,
      };

      window.dispatchEvent(new CustomEvent('finman_accounts_updated'));
      window.dispatchEvent(
        new CustomEvent('finman_transactions_updated', {
          detail: {},
        })
      );

      onClose();
      onSuccess(finalAccount);
    } catch (err: any) {
      console.error('Error creating account:', err);
      const backendMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.details?.name ||
        err?.response?.data?.error?.message;

      setModalError(backendMsg || 'Dữ liệu không hợp lệ hoặc tên tài khoản đã tồn tại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
    >
      <div className="w-full max-w-xl mx-space-md bg-surface-container-lowest rounded-xl shadow-2xl p-space-xl flex flex-col gap-space-lg relative animate-in zoom-in-95 duration-200 border border-outline-variant/20 max-h-[90vh] overflow-y-auto custom-scroll">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <div className="w-10 h-10 rounded-xl bg-secondary-fixed/50 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">savings</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Tạo Tài Khoản Mới
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleAccountSubmit} className="flex flex-col gap-space-md">
          {modalError && (
            <div className="p-space-sm rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2 border border-error/20">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{modalError}</span>
            </div>
          )}

          {/* 1. Hình thức giữ tiền - ĐƯỢC ĐƯA LÊN ĐẦU */}
          <div className="flex flex-col gap-space-2xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-primary">account_balance_wallet</span>
              <span>Hình thức giữ tiền:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-space-xs">
              <label
                className={`flex flex-col items-center justify-center p-space-sm rounded-xl cursor-pointer transition-colors ${
                  modalType === 'BANK'
                    ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                }`}
              >
                <input
                  type="radio"
                  name="acc_type"
                  value="BANK"
                  checked={modalType === 'BANK'}
                  onChange={() => {
                    setModalType('BANK');
                    setModalCreditLimit('');
                  }}
                  className="sr-only"
                />
                <span className="material-symbols-outlined text-[20px]">account_balance</span>
                <span className="font-label-sm text-label-sm mt-1">Tài khoản NH</span>
              </label>

              <label
                className={`flex flex-col items-center justify-center p-space-sm rounded-xl cursor-pointer transition-colors ${
                  modalType === 'CASH'
                    ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                }`}
              >
                <input
                  type="radio"
                  name="acc_type"
                  value="CASH"
                  checked={modalType === 'CASH'}
                  onChange={() => {
                    setModalType('CASH');
                    setModalCreditLimit('');
                  }}
                  className="sr-only"
                />
                <span className="material-symbols-outlined text-[20px]">payments</span>
                <span className="font-label-sm text-label-sm mt-1">Ví tiền mặt</span>
              </label>

              <label
                className={`flex flex-col items-center justify-center p-space-sm rounded-xl cursor-pointer transition-colors ${
                  modalType === 'CREDIT_CARD'
                    ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                }`}
              >
                <input
                  type="radio"
                  name="acc_type"
                  value="CREDIT_CARD"
                  checked={modalType === 'CREDIT_CARD'}
                  onChange={() => {
                    setModalType('CREDIT_CARD');
                    setModalBalance('');
                  }}
                  className="sr-only"
                />
                <span className="material-symbols-outlined text-[20px]">credit_card</span>
                <span className="font-label-sm text-label-sm mt-1">Thẻ tín dụng</span>
              </label>

              <label
                className={`flex flex-col items-center justify-center p-space-sm rounded-xl cursor-pointer transition-colors ${
                  modalType === 'INVESTMENT'
                    ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                }`}
              >
                <input
                  type="radio"
                  name="acc_type"
                  value="INVESTMENT"
                  checked={modalType === 'INVESTMENT'}
                  onChange={() => {
                    setModalType('INVESTMENT');
                    setModalCreditLimit('');
                  }}
                  className="sr-only"
                />
                <span className="material-symbols-outlined text-[20px]">trending_up</span>
                <span className="font-label-sm text-label-sm mt-1">Đầu tư</span>
              </label>

              <label
                className={`flex flex-col items-center justify-center p-space-sm rounded-xl cursor-pointer transition-colors ${
                  modalType === 'OTHER'
                    ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                }`}
              >
                <input
                  type="radio"
                  name="acc_type"
                  value="OTHER"
                  checked={modalType === 'OTHER'}
                  onChange={() => {
                    setModalType('OTHER');
                    setModalCreditLimit('');
                  }}
                  className="sr-only"
                />
                <span className="material-symbols-outlined text-[20px]">category</span>
                <span className="font-label-sm text-label-sm mt-1">Khác</span>
              </label>
            </div>
          </div>

          {/* 2. Tên tài khoản */}
          <div className="flex flex-col gap-space-2xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="accName">
              {modalType === 'CREDIT_CARD' ? 'Tên thẻ tín dụng:' : 'Tên tài khoản:'} <span className="text-primary">*</span>
            </label>
            <input
              id="accName"
              type="text"
              required
              placeholder={modalType === 'CREDIT_CARD' ? 'Ví dụ: Techcombank Visa Platinum, VIB Cashback...' : 'Ví dụ: Nuôi con, Phụng dưỡng bố mẹ, Đầu tư...'}
              value={modalName}
              onChange={(e) => {
                setModalName(e.target.value);
                if (modalError) setModalError(null);
              }}
              className={`w-full bg-surface-container-low text-on-surface px-space-md py-space-sm rounded-xl font-body-md text-body-md focus:outline-none focus:ring-2 border transition-all ${
                modalError && !modalName.trim()
                  ? 'border-red-400 focus:ring-red-300 ring-1 ring-red-300'
                  : 'border-outline-variant/30 focus:ring-secondary/50'
              }`}
            />
          </div>

          {/* 3. Ghi chú mục đích */}
          <div className="flex flex-col gap-space-2xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="accNote">
              Ghi chú mục đích:
            </label>
            <input
              id="accNote"
              type="text"
              placeholder="Ví dụ: Chi tiêu gia đình, mua sắm định kỳ, dự phòng khẩn cấp..."
              value={modalNote}
              onChange={(e) => setModalNote(e.target.value)}
              className="w-full bg-surface-container-low text-on-surface px-space-md py-space-sm rounded-xl font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary/50 border border-outline-variant/30"
            />
          </div>

          {/* 4. Số tiền ban đầu & Hạn mức tín dụng (Logic động: Thẻ tín dụng ngược lại các hình thức khác) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            {/* Số tiền ban đầu: Cho nhập khi != CREDIT_CARD, Khóa khi == CREDIT_CARD */}
            <div className="flex flex-col gap-space-2xs">
              <label
                className={`font-label-md text-label-md font-semibold ${
                  modalType === 'CREDIT_CARD' ? 'text-on-surface-variant/60' : 'text-on-surface'
                }`}
                htmlFor="accBalance"
              >
                Số tiền ban đầu
              </label>
              <div className="relative">
                <input
                  id="accBalance"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  disabled={modalType === 'CREDIT_CARD'}
                  value={modalType === 'CREDIT_CARD' ? '0' : modalBalance}
                  onChange={(e) => setModalBalance(formatCurrencyInput(e.target.value))}
                  className={`w-full bg-surface-container-low text-on-surface pl-space-md pr-10 py-space-sm rounded-xl font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary/50 border border-outline-variant/30 font-currency-row ${
                    modalType === 'CREDIT_CARD'
                      ? 'opacity-50 cursor-not-allowed bg-slate-100/70 dark:bg-surface-container'
                      : ''
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-label-md text-label-md font-bold">
                  ₫
                </span>
              </div>
            </div>

            {/* Hạn mức tín dụng: Khóa khi != CREDIT_CARD, Cho nhập khi == CREDIT_CARD */}
            <div className="flex flex-col gap-space-2xs">
              <label
                className={`font-label-md text-label-md font-semibold ${
                  modalType !== 'CREDIT_CARD' ? 'text-on-surface-variant/60' : 'text-on-surface'
                }`}
                htmlFor="accLimit"
              >
                Hạn mức tín dụng
              </label>
              <div className="relative">
                <input
                  id="accLimit"
                  type="text"
                  inputMode="numeric"
                  disabled={modalType !== 'CREDIT_CARD'}
                  value={modalType !== 'CREDIT_CARD' ? '0' : modalCreditLimit}
                  onChange={(e) => setModalCreditLimit(formatCurrencyInput(e.target.value))}
                  placeholder="0"
                  className={`w-full bg-surface-container-low text-on-surface pl-space-md pr-10 py-space-sm rounded-xl font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary/50 border border-outline-variant/30 font-currency-row ${
                    modalType !== 'CREDIT_CARD'
                      ? 'opacity-50 cursor-not-allowed bg-slate-100/70 dark:bg-surface-container'
                      : 'border-red-300 dark:border-red-900 focus:ring-red-500'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-label-md text-label-md font-bold">
                  ₫
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================
              5. CẤU HÌNH ĐẶC THÙ KHI CHỌN THẺ TÍN DỤNG:
              - Ngày quyết toán (sao kê)
              - Ngày thanh toán (hạn nợ)
              - Tài khoản thanh toán
              - Nút chọn "Thanh toán tự động"
          ======================================================== */}
          {modalType === 'CREDIT_CARD' && (
            <div className="p-space-md rounded-2xl bg-red-50/40 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/40 flex flex-col gap-space-md animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 text-slate-800 dark:text-on-surface font-bold text-xs uppercase tracking-wide">
                <span className="material-symbols-outlined text-red-600 text-[19px]">credit_score</span>
                <span>Chu kỳ sao kê &amp; Thanh toán thẻ tín dụng</span>
              </div>

              {/* Hàng 1: Ngày quyết toán (sao kê) & Ngày thanh toán */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                {/* Ngày quyết toán */}
                <div className="flex flex-col gap-space-2xs">
                  <label className="font-label-md text-label-md text-on-surface font-semibold flex items-center justify-between" htmlFor="statementDay">
                    <span>Ngày quyết toán</span>
                  </label>
                  <div className="relative">
                    <select
                      id="statementDay"
                      value={statementDay}
                      onChange={(e) => setStatementDay(Number(e.target.value))}
                      className="w-full bg-white dark:bg-surface-container text-on-surface px-space-md py-space-sm rounded-xl font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-red-500 border border-outline-variant/30 cursor-pointer shadow-2xs font-semibold"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          Ngày {d} hàng tháng
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Ngày thanh toán */}
                <div className="flex flex-col gap-space-2xs">
                  <label className="font-label-md text-label-md text-on-surface font-semibold flex items-center justify-between" htmlFor="paymentDueDay">
                    <span>Ngày thanh toán</span>
                  </label>
                  <div className="relative">
                    <select
                      id="paymentDueDay"
                      value={paymentDueDay}
                      onChange={(e) => setPaymentDueDay(Number(e.target.value))}
                      className="w-full bg-white dark:bg-surface-container text-on-surface px-space-md py-space-sm rounded-xl font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-red-500 border border-outline-variant/30 cursor-pointer shadow-2xs font-semibold"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          Ngày {d} hàng tháng
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Hàng 2: Tài khoản thanh toán (Trích nợ) */}
              <div className="flex flex-col gap-space-2xs pt-1 border-t border-red-100 dark:border-red-950/40">
                <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="paymentAccountSelect">
                  Tài khoản thanh toán:
                </label>
                {sourceAccounts.filter((a) => a.type !== 'CREDIT_CARD').length > 0 ? (
                  <select
                    id="paymentAccountSelect"
                    value={paymentAccountId || ''}
                    onChange={(e) => setPaymentAccountId(Number(e.target.value) || null)}
                    className="w-full bg-white dark:bg-surface-container text-on-surface px-space-md py-space-sm rounded-xl font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-red-500 border border-outline-variant/30 cursor-pointer shadow-2xs font-medium"
                  >
                    <option value="">-- Chọn tài khoản thanh toán nợ thẻ --</option>
                    {sourceAccounts
                      .filter((a) => a.type !== 'CREDIT_CARD')
                      .map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.type === 'BANK' ? 'Ngân hàng' : 'Tiền mặt'} • Số dư: {(acc.currentBalance ?? 0).toLocaleString('vi-VN')} ₫)
                        </option>
                      ))}
                  </select>
                ) : (
                  <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200">
                    Chưa có tài khoản ngân hàng hoặc tiền mặt nào để liên kết. Bạn có thể chọn sau.
                  </p>
                )}
                <span className="text-[11px] text-on-surface-variant">
                  Tài khoản nguồn dùng để trích tiền thanh toán dư nợ sao kê hàng tháng
                </span>
              </div>

              {/* Hàng 3: Nút chọn "Thanh toán tự động" */}
              <div className="pt-2 border-t border-red-100 dark:border-red-950/40">
                <label
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    isAutoPayment
                      ? 'bg-red-50 dark:bg-red-950/50 border-red-500/80 ring-1 ring-red-500/30'
                      : 'bg-white dark:bg-surface-container border-slate-200 dark:border-outline-variant/30 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                        isAutoPayment
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-surface-container-high text-slate-500'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">autorenew</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-on-surface">
                        Thanh toán tự động
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-on-surface-variant">
                        Tự động trích tiền từ tài khoản thanh toán khi đến hạn sao kê
                      </span>
                    </div>
                  </div>

                  {/* Modern Toggle Switch UI */}
                  <div className="relative inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={isAutoPayment}
                      onChange={(e) => setIsAutoPayment(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${
                        isAutoPayment ? 'bg-red-600' : 'bg-slate-300 dark:bg-surface-container-high'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                          isAutoPayment ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* ========================================================
              LOGIC HỎI NGUỒN TIỀN BAN ĐẦU: THU MỚI HAY CHUYỂN TIỀN (Chỉ cho tài khoản thông thường khi initialBal > 0)
          ======================================================== */}
          {modalType !== 'CREDIT_CARD' && initialBal > 0 && (
            <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-space-sm animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-on-surface font-semibold text-sm">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  sync_alt
                </span>
                <span>Nguồn gốc số tiền ban đầu ({modalBalance} ₫):</span>
              </div>
              <p className="text-xs text-on-surface-variant -mt-1 leading-relaxed">
                Số tiền này sẽ được tự động tạo thành <strong>1 giao dịch</strong> trong lịch sử thu chi để đảm bảo báo cáo dòng tiền chuẩn xác. Bạn muốn ghi nhận theo cách nào?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm mt-1">
                {/* Lựa chọn 1: Tạo giao dịch thu mới */}
                <div
                  onClick={() => setFundingSource('INCOME')}
                  className={`p-space-sm rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${
                    fundingSource === 'INCOME'
                      ? 'bg-secondary-container/25 border-secondary text-on-surface shadow-xs ring-1 ring-secondary/50'
                      : 'bg-surface-container-lowest border-outline-variant/20 hover:bg-surface-container text-on-surface-variant'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-secondary">
                      <span className="material-symbols-outlined text-[18px]">add_circle</span>
                      <span>Tạo giao dịch thu mới</span>
                    </div>
                    <input
                      type="radio"
                      name="funding_source"
                      checked={fundingSource === 'INCOME'}
                      onChange={() => setFundingSource('INCOME')}
                      className="text-secondary focus:ring-secondary cursor-pointer"
                    />
                  </div>
                  <span className="text-[11px] text-on-surface-variant leading-tight">
                    Nguồn tiền mới vào hệ thống (lương thưởng, thu nhập khác, tiền ngoài...).
                  </span>
                </div>

                {/* Lựa chọn 2: Chuyển tiền từ tài khoản có sẵn */}
                <div
                  onClick={() => setFundingSource('TRANSFER')}
                  className={`p-space-sm rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${
                    fundingSource === 'TRANSFER'
                      ? 'bg-secondary-container/25 border-secondary text-on-surface shadow-xs ring-1 ring-secondary/50'
                      : 'bg-surface-container-lowest border-outline-variant/20 hover:bg-surface-container text-on-surface-variant'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-tertiary">
                      <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                      <span>Chuyển từ tài khoản có sẵn</span>
                    </div>
                    <input
                      type="radio"
                      name="funding_source"
                      checked={fundingSource === 'TRANSFER'}
                      onChange={() => setFundingSource('TRANSFER')}
                      className="text-secondary focus:ring-secondary cursor-pointer"
                    />
                  </div>
                  <span className="text-[11px] text-on-surface-variant leading-tight">
                    Trích số tiền này từ một tài khoản hiện có sang tài khoản mới tạo.
                  </span>
                </div>
              </div>

              {/* Lựa chọn chi tiết khi chọn INCOME */}
              {fundingSource === 'INCOME' && (
                <div className="flex flex-col gap-1 mt-1 pt-2 border-t border-outline-variant/20 animate-in fade-in duration-150">
                  <label className="text-xs font-semibold text-on-surface" htmlFor="incomeCategorySelect">
                    Danh mục thu nhập: <span className="text-primary">*</span>
                  </label>
                  {incomeCategories.length > 0 ? (
                    <select
                      id="incomeCategorySelect"
                      value={selectedCategoryId || ''}
                      onChange={(e) => setSelectedCategoryId(Number(e.target.value) || null)}
                      className="w-full bg-surface-container-lowest text-on-surface px-3 py-2 rounded-xl text-xs border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-secondary/50 font-medium cursor-pointer"
                    >
                      {incomeCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant bg-surface-container-lowest px-3 py-2 rounded-xl border border-outline-variant/20">
                      <span className="material-symbols-outlined text-[16px] text-secondary">savings</span>
                      <span>Mặc định: <strong>Thu nhập khác</strong></span>
                    </div>
                  )}
                  <span className="text-[11px] text-on-surface-variant">
                    Giao dịch thu {modalBalance} ₫ sẽ được tự động lưu vào danh mục này.
                  </span>
                </div>
              )}

              {/* Lựa chọn chi tiết khi chọn TRANSFER */}
              {fundingSource === 'TRANSFER' && (
                <div className="flex flex-col gap-1 mt-1 pt-2 border-t border-outline-variant/20 animate-in fade-in duration-150">
                  <label className="text-xs font-semibold text-on-surface" htmlFor="fromAccountSelect">
                    Chọn tài khoản trích tiền: <span className="text-primary">*</span>
                  </label>
                  {sourceAccounts.length > 0 ? (
                    <select
                      id="fromAccountSelect"
                      value={fromAccountId || ''}
                      onChange={(e) => setFromAccountId(Number(e.target.value) || null)}
                      className="w-full bg-surface-container-lowest text-on-surface px-3 py-2 rounded-xl text-xs border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-secondary/50 font-medium cursor-pointer"
                    >
                      {sourceAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} (Số dư hiện tại: {(acc.currentBalance ?? 0).toLocaleString('vi-VN')} ₫)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-amber-600 font-medium bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                      Chưa có tài khoản nào khác để chuyển tiền. Vui lòng chọn "Tạo giao dịch thu mới".
                    </p>
                  )}
                  <span className="text-[11px] text-on-surface-variant">
                    Giao dịch chuyển tiền {modalBalance} ₫ sẽ được trích từ tài khoản này sang tài khoản mới.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Masked Number / Notes */}
          <div className="flex flex-col gap-space-2xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="accNumber">
              4 số cuối thẻ / Số tài khoản (Ghi nhớ)
            </label>
            <input
              id="accNumber"
              type="text"
              maxLength={16}
              placeholder="Ví dụ: 9968"
              value={modalAccountNumber}
              onChange={(e) => setModalAccountNumber(e.target.value)}
              className="w-full bg-surface-container-low text-on-surface px-space-md py-space-sm rounded-xl font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary/50 border border-outline-variant/30"
            />
          </div>

          <div className="flex items-center justify-end gap-space-sm pt-space-sm border-t border-surface-container">
            <button
              type="button"
              onClick={onClose}
              className="px-space-lg py-space-sm rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-space-xl py-space-sm rounded-xl bg-primary-container hover:opacity-95 text-on-primary font-label-lg text-label-lg font-bold shadow-md transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
