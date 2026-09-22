import { api } from './api';
import type { Category } from '../types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const categoryService = {
  /**
   * Lấy danh sách danh mục thu chi thực tế từ Backend Database
   */
  async getCategories(type?: 'INCOME' | 'EXPENSE'): Promise<Category[]> {
    const params = type ? { type } : {};
    const res = await api.get<ApiResponse<Category[]>>('/categories', { params });
    return res.data.data;
  },

  /**
   * Lấy chi tiết một danh mục theo ID
   */
  async getCategoryById(id: number): Promise<Category> {
    const res = await api.get<ApiResponse<Category>>(`/categories/${id}`);
    return res.data.data;
  },

  /**
   * Tạo danh mục tùy biến mới trong cơ sở dữ liệu
   */
  async createCategory(payload: {
    name: string;
    type: 'INCOME' | 'EXPENSE';
    icon: string;
    color?: string;
  }): Promise<Category> {
    const res = await api.post<ApiResponse<Category>>('/categories', payload);
    return res.data.data;
  },

  /**
   * Xóa danh mục cá nhân khỏi cơ sở dữ liệu
   */
  async deleteCategory(id: number): Promise<void> {
    await api.delete<ApiResponse<void>>(`/categories/${id}`);
  },
};
