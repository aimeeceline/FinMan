import { api } from './api';
import type {
  Account,
  AccountSummary,
  AccountCreatePayload,
  AccountUpdatePayload,
} from '../types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const ARCHIVED_ACCOUNTS_STORAGE_KEY = 'finman_archived_accounts_cache';

export const getCachedArchivedAccounts = (): Account[] => {
  try {
    const raw = localStorage.getItem(ARCHIVED_ACCOUNTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveCachedArchivedAccount = (account: Partial<Account> & { id: number }) => {
  try {
    const list = getCachedArchivedAccounts().filter((a) => a.id !== account.id);
    list.unshift({ ...account, isArchived: true } as Account);
    localStorage.setItem(ARCHIVED_ACCOUNTS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to cache archived account:', e);
  }
};

export const removeCachedArchivedAccount = (accountId: number) => {
  try {
    const list = getCachedArchivedAccounts().filter((a) => a.id !== accountId);
    localStorage.setItem(ARCHIVED_ACCOUNTS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to remove cached archived account:', e);
  }
};

export interface CreditCardConfig {
  statementDay?: number;
  paymentDueDay?: number;
  paymentAccountId?: number | null;
  isAutoPayment?: boolean;
}

export const getCachedCreditCardConfig = (accountId: number): CreditCardConfig | null => {
  try {
    const raw = localStorage.getItem(`finman_cc_config_${accountId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveCachedCreditCardConfig = (accountId: number, config: CreditCardConfig) => {
  try {
    const current = getCachedCreditCardConfig(accountId) || {};
    const merged = { ...current, ...config };
    localStorage.setItem(`finman_cc_config_${accountId}`, JSON.stringify(merged));
  } catch (e) {
    console.warn('Failed to cache credit card config:', e);
  }
};

const mergeCreditCardConfig = (account: Account): Account => {
  if (account.type !== 'CREDIT_CARD') return account;
  const cached = getCachedCreditCardConfig(account.id);
  const statementDay = account.statementDay ?? cached?.statementDay ?? 20;
  const paymentDueDay = account.paymentDueDay ?? cached?.paymentDueDay ?? 5;
  const paymentAccountId = account.paymentAccountId !== undefined ? account.paymentAccountId : (cached?.paymentAccountId ?? null);
  const isAutoPayment = account.isAutoPayment !== undefined ? account.isAutoPayment : (cached?.isAutoPayment ?? false);

  // Keep cache synchronized
  saveCachedCreditCardConfig(account.id, {
    statementDay,
    paymentDueDay,
    paymentAccountId,
    isAutoPayment,
  });

  return {
    ...account,
    statementDay,
    paymentDueDay,
    paymentAccountId,
    isAutoPayment,
  };
};

export const accountService = {
  /**
   * Lấy tổng hợp Net Worth và danh sách tài khoản của người dùng
   */
  async getAccountsSummary(includeArchived = false): Promise<AccountSummary> {
    const res = await api.get<ApiResponse<AccountSummary>>('/accounts', {
      params: { includeArchived },
    });
    const data = res.data.data;

    if (data && Array.isArray(data.accounts)) {
      data.accounts = data.accounts.map(mergeCreditCardConfig);
    }

    if (includeArchived && data && Array.isArray(data.accounts)) {
      const backendArchived = data.accounts.filter((a) => a.isArchived);
      try {
        if (backendArchived.length > 0) {
          localStorage.setItem(ARCHIVED_ACCOUNTS_STORAGE_KEY, JSON.stringify(backendArchived));
        } else {
          localStorage.removeItem(ARCHIVED_ACCOUNTS_STORAGE_KEY);
        }
      } catch {
        // Ignore storage errors
      }
    }

    return data;
  },

  /**
   * Lấy danh sách tài khoản của người dùng
   */
  async getAccounts(includeArchived = false): Promise<Account[]> {
    const summary = await this.getAccountsSummary(includeArchived);
    return summary.accounts || [];
  },

  /**
   * Lấy chi tiết tài khoản theo ID
   */
  async getAccountById(id: number): Promise<Account> {
    const res = await api.get<ApiResponse<Account>>(`/accounts/${id}`);
    return mergeCreditCardConfig(res.data.data);
  },

  /**
   * Tạo tài khoản mới (Khoản tiền mục đích)
   */
  async createAccount(payload: AccountCreatePayload): Promise<Account> {
    const res = await api.post<ApiResponse<Account>>('/accounts', payload);
    const created = res.data.data;
    if (payload.type === 'CREDIT_CARD') {
      saveCachedCreditCardConfig(created.id, {
        statementDay: payload.statementDay,
        paymentDueDay: payload.paymentDueDay,
        paymentAccountId: payload.paymentAccountId,
        isAutoPayment: payload.isAutoPayment,
      });
    }
    return mergeCreditCardConfig(created);
  },

  /**
   * Cập nhật thông tin tài khoản
   */
  async updateAccount(id: number, payload: AccountUpdatePayload): Promise<Account> {
    if (
      payload.statementDay !== undefined ||
      payload.paymentDueDay !== undefined ||
      payload.paymentAccountId !== undefined ||
      payload.isAutoPayment !== undefined
    ) {
      saveCachedCreditCardConfig(id, {
        statementDay: payload.statementDay,
        paymentDueDay: payload.paymentDueDay,
        paymentAccountId: payload.paymentAccountId,
        isAutoPayment: payload.isAutoPayment,
      });
    }

    const res = await api.put<ApiResponse<Account>>(`/accounts/${id}`, payload);
    const updated = res.data.data;
    return mergeCreditCardConfig(updated);
  },

  /**
   * Lưu trữ hoặc khôi phục (Archive/Unarchive) tài khoản.
   * Có cơ chế fallback:
   * - Nếu backend hỗ trợ PATCH /accounts/{id}/archive, dùng PATCH.
   * - Nếu backend cũ (chưa restart JVM), lưu trữ bằng DELETE /accounts/{id} và khôi phục bằng PUT /accounts/{id}.
   */
  async archiveAccount(
    id: number,
    archived = true,
    accountData?: Partial<Account>
  ): Promise<Account | void> {
    let result: Account | void = undefined;
    try {
      const res = await api.patch<ApiResponse<Account>>(`/accounts/${id}/archive`, null, {
        params: { archived },
      });
      result = res.data?.data;
    } catch (patchErr: any) {
      // Fallback for running backend where PATCH /accounts/{id}/archive returns 404 or 405
      if (patchErr?.response?.status === 404 || patchErr?.response?.status === 405) {
        if (archived) {
          // DELETE /accounts/{id} performs soft delete (isArchived = true)
          await api.delete(`/accounts/${id}`);
        } else {
          // PUT /accounts/{id} updates isArchived = false
          const payload: AccountUpdatePayload = {
            name: accountData?.name || 'Tài khoản',
            creditLimit: accountData?.creditLimit,
            accountNumber: accountData?.accountNumber,
            note: accountData?.note,
            isArchived: false,
          };
          const res = await api.put<ApiResponse<Account>>(`/accounts/${id}`, payload);
          result = res.data?.data;
        }
      } else {
        throw patchErr;
      }
    }

    // Synchronize local cache
    if (archived) {
      if (accountData) {
        saveCachedArchivedAccount({ ...accountData, id, isArchived: true });
      }
    } else {
      removeCachedArchivedAccount(id);
    }

    return result;
  },

  /**
   * Lưu trữ (Soft delete) tài khoản
   */
  async deleteAccount(id: number, accountData?: Partial<Account>): Promise<void> {
    await this.archiveAccount(id, true, accountData);
  },
};
