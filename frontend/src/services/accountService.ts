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

export const accountService = {
  /**
   * Lấy tổng hợp Net Worth và danh sách tài khoản của người dùng
   */
  async getAccountsSummary(includeArchived = false): Promise<AccountSummary> {
    const res = await api.get<ApiResponse<AccountSummary>>('/accounts', {
      params: { includeArchived },
    });
    const data = res.data.data;

    if (includeArchived && data && Array.isArray(data.accounts)) {
      const backendArchived = data.accounts.filter((a) => a.isArchived);
      if (backendArchived.length > 0) {
        // Backend natively supports includeArchived, sync to local cache
        try {
          localStorage.setItem(ARCHIVED_ACCOUNTS_STORAGE_KEY, JSON.stringify(backendArchived));
        } catch {
          // Ignore storage errors
        }
      } else {
        // Backend running without includeArchived; merge cached archived accounts
        const cached = getCachedArchivedAccounts();
        const activeIds = new Set(data.accounts.map((a) => a.id));
        const validArchived = cached.filter((a) => !activeIds.has(a.id));
        if (validArchived.length > 0) {
          data.accounts = [...data.accounts, ...validArchived];
        }
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
    return res.data.data;
  },

  /**
   * Tạo tài khoản mới (Khoản tiền mục đích)
   */
  async createAccount(payload: AccountCreatePayload): Promise<Account> {
    const res = await api.post<ApiResponse<Account>>('/accounts', payload);
    return res.data.data;
  },

  /**
   * Cập nhật thông tin tài khoản
   */
  async updateAccount(id: number, payload: AccountUpdatePayload): Promise<Account> {
    const res = await api.put<ApiResponse<Account>>(`/accounts/${id}`, payload);
    return res.data.data;
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
    let result: Account | void;
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
