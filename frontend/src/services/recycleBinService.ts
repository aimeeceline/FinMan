import { api } from './api';
import type { RecycleBinItem, RecycleBinActionPayload, RecycleBinType } from '../types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const recycleBinService = {
  /**
   * Lấy danh sách các mục trong thùng rác
   */
  async getItems(type?: RecycleBinType): Promise<RecycleBinItem[]> {
    const params = type && type !== 'ALL' ? { type } : {};
    const res = await api.get<ApiResponse<RecycleBinItem[]>>('/recycle-bin', { params });
    return res.data.data;
  },

  /**
   * Khôi phục các mục đã chọn từ thùng rác
   */
  async restore(payload: RecycleBinActionPayload): Promise<void> {
    await api.post<ApiResponse<void>>('/recycle-bin/restore', payload);
  },

  /**
   * Xóa vĩnh viễn các mục đã chọn khỏi cơ sở dữ liệu
   */
  async permanentDelete(payload: RecycleBinActionPayload): Promise<void> {
    await api.post<ApiResponse<void>>('/recycle-bin/permanent-delete', payload);
  },
};
