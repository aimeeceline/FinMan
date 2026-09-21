import type { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: 'Ăn uống', type: 'EXPENSE', icon: 'restaurant', color: '#dc2626', bgColor: '#fee2e2' },
  { id: 2, name: 'Mua sắm', type: 'EXPENSE', icon: 'shopping_bag', color: '#7c3aed', bgColor: '#f3e8ff' },
  { id: 3, name: 'Giao thông', type: 'EXPENSE', icon: 'directions_car', color: '#d97706', bgColor: '#fef3c7' },
  { id: 4, name: 'Nhà cửa & Dịch vụ', type: 'EXPENSE', icon: 'home', color: '#0284c7', bgColor: '#e0f2fe' },
  { id: 5, name: 'Sức khỏe', type: 'EXPENSE', icon: 'medical_services', color: '#e11d48', bgColor: '#ffe4e6' },
  { id: 6, name: 'Giáo dục', type: 'EXPENSE', icon: 'school', color: '#2563eb', bgColor: '#dbeafe' },
  { id: 7, name: 'Tiền lương', type: 'INCOME', icon: 'payments', color: '#059669', bgColor: '#d1fae5' },
  { id: 8, name: 'Thưởng & Đầu tư', type: 'INCOME', icon: 'trending_up', color: '#059669', bgColor: '#d1fae5' },
  { id: 9, name: 'Thu nhập phụ', type: 'INCOME', icon: 'savings', color: '#006c4a', bgColor: '#82f5c1' },
];
