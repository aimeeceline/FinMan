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

export const accountService = {
  /**
   * Lấy tổng hợp Net Worth và danh sách tài khoản của người dùng
   */
  async getAccountsSummary(): Promise<AccountSummary> {
    const res = await api.get<ApiResponse<AccountSummary>>('/accounts');
    return res.data.data;
  },

  /**
   * Lấy chi tiết tài khoản theo ID
   */
  async getAccountById(id: number): Promise<Account> {
    const res = await api.get<ApiResponse<Account>>(`/accounts/${id}`);
    return res.data.data;
  },

  /**
   * Tạo tài khoản mới (Ví tiền mặt / Ngân hàng / Thẻ tín dụng)
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
   * Lưu trữ (Soft delete) tài khoản
   */
  async deleteAccount(id: number): Promise<void> {
    await api.delete<ApiResponse<void>>(`/accounts/${id}`);
  },
};
