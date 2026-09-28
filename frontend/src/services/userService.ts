import { api } from './api';
import type { User } from '../types';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface UpdateProfilePayload {
  fullName: string;
  avatarUrl?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export const userService = {
  /**
   * Lấy thông tin cá nhân của người dùng hiện tại
   */
  async getProfile(): Promise<User> {
    const res = await api.get<ApiResponse<User>>('/users/profile');
    return res.data.data;
  },

  /**
   * Cập nhật thông tin cá nhân (Họ tên, ảnh đại diện)
   */
  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const res = await api.put<ApiResponse<User>>('/users/profile', payload);
    return res.data.data;
  },

  /**
   * Đổi mật khẩu tài khoản
   */
  async changePassword(payload: ChangePasswordPayload): Promise<string> {
    const res = await api.post<ApiResponse<void>>('/users/change-password', payload);
    return res.data.message || 'Đổi mật khẩu thành công';
  },

  /**
   * Đăng xuất khỏi hệ thống
   */
  async logout(): Promise<void> {
    try {
      await api.post<ApiResponse<void>>('/users/logout');
    } catch (error) {
      console.warn('API logout failed, clearing local session anyway', error);
    } finally {
      localStorage.removeItem('finman_token');
      localStorage.removeItem('finman_user');
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
  },
};
