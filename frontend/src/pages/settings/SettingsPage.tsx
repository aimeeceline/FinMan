import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { categoryService } from '../../services/categoryService';
import { recycleBinService } from '../../services/recycleBinService';
import type { Category, RecycleBinItem, RecycleBinType } from '../../types';
import { AddCategoryModal } from '../../components/modals/AddCategoryModal';
import { ConfirmModal } from '../../components/modals/ConfirmModal';
import { getCategoryTheme } from '../../utils/categoryTheme';

// Preset avatar list for quick 1-click selection
const PRESET_AVATARS = [
  { id: 'av-1', label: 'Felix', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
  { id: 'av-2', label: 'Aneka', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka' },
  { id: 'av-3', label: 'Aiden', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aiden' },
  { id: 'av-4', label: 'Zoe', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe' },
  { id: 'av-5', label: 'Leo', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo' },
  { id: 'av-6', label: 'FinBot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=FinBot' },
  { id: 'av-7', label: 'Doanh nhân 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { id: 'av-8', label: 'Doanh nhân 2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
];

type SettingsTab = 'profile' | 'security' | 'categories' | 'recycle_bin';

/**
 * Tự động phân giải liên kết trang web thông dụng sang liên kết tệp ảnh trực tiếp (Direct Image URL).
 * Hỗ trợ: Wikipedia / Wikimedia Commons file page, Google Drive, Dropbox, Imgur.
 */
const resolveDirectImageUrl = async (rawUrl: string): Promise<string> => {
  const url = rawUrl.trim();

  // 1. Trang tập tin Wikipedia / Wikimedia Commons
  // Ví dụ: https://vi.wikipedia.org/wiki/T%E1%BA%ADp_tin:Lotus_flower_%28978659%29.jpg
  // hoặc https://commons.wikimedia.org/wiki/File:Lotus_flower_(978659).jpg
  const wikiMatch = url.match(/(?:wikipedia\.org|wikimedia\.org)\/wiki\/(?:T%E1%BA%ADp_tin|Tập_tin|File):([^#?]+)/i);
  if (wikiMatch && wikiMatch[1]) {
    try {
      const fileName = decodeURIComponent(wikiMatch[1]);
      // Gọi Wikimedia Commons API lấy link ảnh gốc
      const commonsApi = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url&format=json&origin=*`;
      const res = await fetch(commonsApi);
      const data = await res.json();
      const pages = data?.query?.pages;
      if (pages) {
        const firstPage = Object.values(pages)[0] as any;
        if (firstPage?.imageinfo?.[0]?.url) {
          // Bỏ tham số theo dõi UTM để URL gọn gàng dưới 500 ký tự
          return firstPage.imageinfo[0].url.split('?')[0];
        }
      }
      // Dự phòng gọi trực tiếp API của vi.wikipedia.org
      const viApi = `https://vi.wikipedia.org/w/api.php?action=query&titles=T%E1%BA%ADp_tin:${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url&format=json&origin=*`;
      const viRes = await fetch(viApi);
      const viData = await viRes.json();
      const viPages = viData?.query?.pages;
      if (viPages) {
        const firstViPage = Object.values(viPages)[0] as any;
        if (firstViPage?.imageinfo?.[0]?.url) {
          return firstViPage.imageinfo[0].url.split('?')[0];
        }
      }
    } catch (err) {
      console.warn('Không thể tự động phân giải link Wikipedia:', err);
    }
  }

  // 2. Google Drive share link: https://drive.google.com/file/d/ID/view...
  const gDriveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gDriveMatch && gDriveMatch[1]) {
    return `https://drive.google.com/uc?export=view&id=${gDriveMatch[1]}`;
  }

  // 3. Dropbox share link: dl=0 -> raw=1
  if (url.includes('dropbox.com') && url.includes('dl=0')) {
    return url.replace('dl=0', 'raw=1');
  }

  // 4. Imgur single image page -> direct .jpg
  const imgurMatch = url.match(/^https?:\/\/(?:i\.)?imgur\.com\/([a-zA-Z0-9]+)(?:\.[a-zA-Z]+)?$/);
  if (imgurMatch && imgurMatch[1] && !url.includes('/a/') && !url.includes('/gallery/')) {
    return `https://i.imgur.com/${imgurMatch[1]}.jpg`;
  }

  return url;
};

/**
 * Kiểm tra xem trình duyệt có tải được ảnh từ URL hay không
 */
const testImageLoad = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    let isSettled = false;
    img.onload = () => {
      if (!isSettled) {
        isSettled = true;
        resolve(true);
      }
    };
    img.onerror = () => {
      if (!isSettled) {
        isSettled = true;
        resolve(false);
      }
    };
    img.src = url;
    // Timeout sau 6 giây đề phòng mạng chậm
    setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        resolve(true);
      }
    }, 6000);
  });
};

export const SettingsPage: React.FC = () => {
  const { user, logout, updateUser } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // --- Profile State ---
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [customAvatarError, setCustomAvatarError] = useState<string | null>(null);
  const [isResolvingAvatar, setIsResolvingAvatar] = useState(false);
  const [avatarImgFailed, setAvatarImgFailed] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // --- Password State ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // --- Category State ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTypeFilter, setCategoryTypeFilter] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [categorySearch, setCategorySearch] = useState('');
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [categoryDeleteError, setCategoryDeleteError] = useState<string | null>(null);
  const [categoryFeedback, setCategoryFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // --- Recycle Bin State ---
  const [recycleBinItems, setRecycleBinItems] = useState<RecycleBinItem[]>([]);
  const [isBinLoading, setIsBinLoading] = useState(false);
  const [binFilter, setBinFilter] = useState<RecycleBinType>('ALL');
  const [selectedBinKeys, setSelectedBinKeys] = useState<Set<string>>(new Set());
  const [binFeedback, setBinFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isBinOperating, setIsBinOperating] = useState(false);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    isOpen: boolean;
    mode: 'single' | 'selected' | 'empty_all';
    targetItem?: RecycleBinItem;
  }>({ isOpen: false, mode: 'selected' });

  // --- Logout Dialog State ---
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Sync user state with local form when user object updates
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setAvatarUrl(user.avatarUrl || '');
      setAvatarImgFailed(false);
    }
  }, [user]);

  // Load recycle bin (Luôn tải toàn bộ 'ALL' để số lượng trên từng tab luôn cố định chính xác)
  const loadRecycleBin = async () => {
    setIsBinLoading(true);
    try {
      const items = await recycleBinService.getItems('ALL');
      setRecycleBinItems(items);
      setSelectedBinKeys((prev) => {
        const next = new Set<string>();
        const itemKeySet = new Set(items.map((i) => `${i.type}-${i.id}`));
        prev.forEach((k) => {
          if (itemKeySet.has(k)) next.add(k);
        });
        return next;
      });
    } catch (err) {
      console.error('Error loading recycle bin:', err);
    } finally {
      setIsBinLoading(false);
    }
  };

  // Số lượng cố định của từng phân loại trong thùng rác
  const binCounts = useMemo(() => {
    return {
      ALL: recycleBinItems.length,
      TRANSACTION: recycleBinItems.filter((i) => i.type === 'TRANSACTION').length,
      CATEGORY: recycleBinItems.filter((i) => i.type === 'CATEGORY').length,
      BUDGET: recycleBinItems.filter((i) => i.type === 'BUDGET').length,
      ACCOUNT: recycleBinItems.filter((i) => i.type === 'ACCOUNT').length,
    };
  }, [recycleBinItems]);

  // Danh sách mục hiển thị theo tab đang chọn
  const displayedBinItems = useMemo(() => {
    if (binFilter === 'ALL') return recycleBinItems;
    return recycleBinItems.filter((i) => i.type === binFilter);
  }, [recycleBinItems, binFilter]);

  // Load categories and recycle bin on mount
  useEffect(() => {
    categoryService.getCategories()
      .then(setCategories)
      .catch((err) => console.error('Error loading categories:', err));
    loadRecycleBin();
  }, []);

  const handleBinFilterChange = (filter: RecycleBinType) => {
    setBinFilter(filter);
  };

  const handleToggleBinItem = (item: RecycleBinItem) => {
    const key = `${item.type}-${item.id}`;
    setSelectedBinKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSelectAllBinItems = () => {
    const visibleKeys = displayedBinItems.map((i) => `${i.type}-${i.id}`);
    const allVisibleSelected =
      visibleKeys.length > 0 && visibleKeys.every((k) => selectedBinKeys.has(k));

    setSelectedBinKeys((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleKeys.forEach((k) => next.delete(k));
      } else {
        visibleKeys.forEach((k) => next.add(k));
      }
      return next;
    });
  };

  const handleRestoreBinItems = async (targets: { id: number; type: string }[]) => {
    if (targets.length === 0) return;
    setIsBinOperating(true);
    setBinFeedback(null);
    try {
      await recycleBinService.restore({ items: targets });
      setBinFeedback({
        type: 'success',
        message: `Đã khôi phục thành công ${targets.length} mục về trạng thái hoạt động!`,
      });
      setTimeout(() => setBinFeedback(null), 5000);
      await loadRecycleBin();
      const updatedCats = await categoryService.getCategories();
      setCategories(updatedCats);
      window.dispatchEvent(new CustomEvent('finman_categories_updated'));
      window.dispatchEvent(new CustomEvent('finman_transactions_updated'));
      window.dispatchEvent(new CustomEvent('finman_accounts_updated'));
    } catch (err: any) {
      setBinFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Có lỗi xảy ra khi khôi phục mục.',
      });
    } finally {
      setIsBinOperating(false);
    }
  };

  const handlePermanentDeleteExecute = async () => {
    setIsBinOperating(true);
    setBinFeedback(null);
    try {
      if (confirmDeleteModal.mode === 'empty_all') {
        await recycleBinService.permanentDelete({ emptyAll: true });
        setBinFeedback({
          type: 'success',
          message: 'Đã dọn sạch thùng rác thành công!',
        });
      } else if (confirmDeleteModal.mode === 'single' && confirmDeleteModal.targetItem) {
        await recycleBinService.permanentDelete({
          items: [{ id: confirmDeleteModal.targetItem.id, type: confirmDeleteModal.targetItem.type }],
        });
        setBinFeedback({
          type: 'success',
          message: `Đã xóa vĩnh viễn mục "${confirmDeleteModal.targetItem.title}"!`,
        });
      } else {
        const itemsToDel = recycleBinItems
          .filter((i) => selectedBinKeys.has(`${i.type}-${i.id}`))
          .map((i) => ({ id: i.id, type: i.type }));
        await recycleBinService.permanentDelete({ items: itemsToDel });
        setBinFeedback({
          type: 'success',
          message: `Đã xóa vĩnh viễn ${itemsToDel.length} mục đã chọn!`,
        });
      }
      setTimeout(() => setBinFeedback(null), 5000);
      setConfirmDeleteModal({ isOpen: false, mode: 'selected' });
      await loadRecycleBin();
      const updatedCats = await categoryService.getCategories();
      setCategories(updatedCats);
      window.dispatchEvent(new CustomEvent('finman_categories_updated'));
      window.dispatchEvent(new CustomEvent('finman_transactions_updated'));
      window.dispatchEvent(new CustomEvent('finman_accounts_updated'));
    } catch (err: any) {
      setBinFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Có lỗi xảy ra khi xóa vĩnh viễn.',
      });
    } finally {
      setIsBinOperating(false);
    }
  };

  // --- Profile Actions ---
  const handleSelectPresetAvatar = (url: string) => {
    setAvatarUrl(url);
    setAvatarImgFailed(false);
    setCustomAvatarInput('');
    setCustomAvatarError(null);
  };

  const handleApplyCustomAvatar = async () => {
    const raw = customAvatarInput.trim();
    if (!raw) return;
    setCustomAvatarError(null);
    setIsResolvingAvatar(true);

    try {
      // 1. Tự động nhận diện và chuyển đổi thông minh (Wikipedia, Google Drive, Dropbox, v.v.)
      const resolved = await resolveDirectImageUrl(raw);

      // 2. Kiểm tra độ dài URL theo chuẩn cơ sở dữ liệu
      if (resolved.length > 500) {
        setCustomAvatarError('Đường dẫn ảnh quá dài (tối đa 500 ký tự). Vui lòng sử dụng liên kết ngắn hơn.');
        setIsResolvingAvatar(false);
        return;
      }

      // 3. Kiểm tra xem trình duyệt có tải được ảnh từ đường dẫn này hay không
      const isValidImage = await testImageLoad(resolved);
      if (!isValidImage) {
        setCustomAvatarError(
          'Không thể tải ảnh từ liên kết này. Hãy đảm bảo đây là đường dẫn trực tiếp tới tệp ảnh (.jpg, .png, .webp, .svg) hoặc bấm chuột phải vào ảnh chọn "Sao chép địa chỉ hình ảnh" (Copy image address).'
        );
        setIsResolvingAvatar(false);
        return;
      }

      setAvatarUrl(resolved);
      setAvatarImgFailed(false);
      setCustomAvatarError(null);

      if (resolved !== raw) {
        setCustomAvatarInput(resolved);
        setProfileFeedback({
          type: 'success',
          message: 'Đã tự động nhận diện và chuyển đổi sang liên kết ảnh trực tiếp!',
        });
      } else {
        setCustomAvatarInput('');
      }
    } catch (err) {
      setCustomAvatarError('Đã xảy ra lỗi khi kiểm tra liên kết ảnh. Vui lòng thử lại.');
    } finally {
      setIsResolvingAvatar(false);
    }
  };

  const handleResetAvatar = () => {
    setAvatarUrl('');
    setAvatarImgFailed(false);
    setCustomAvatarInput('');
    setCustomAvatarError(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileFeedback(null);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setProfileFeedback({ type: 'error', message: 'Họ và tên không được để trống.' });
      return;
    }
    if (trimmedName.length > 100) {
      setProfileFeedback({ type: 'error', message: 'Họ và tên không được vượt quá 100 ký tự.' });
      return;
    }

    setProfileSaving(true);
    try {
      const updatedUser = await userService.updateProfile({
        fullName: trimmedName,
        avatarUrl: avatarUrl.trim() || undefined,
      });

      // Update global context immediately so TopHeader and Sidebar update
      updateUser({
        fullName: updatedUser.fullName,
        avatarUrl: updatedUser.avatarUrl,
      });

      setProfileFeedback({
        type: 'success',
        message: 'Cập nhật hồ sơ cá nhân thành công!',
      });

      setTimeout(() => setProfileFeedback(null), 4000);
    } catch (err: any) {
      let msg = 'Không thể cập nhật hồ sơ. Vui lòng thử lại sau.';
      if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.response?.data?.error?.details) {
        msg = Object.values(err.response.data.error.details).join(', ');
      }
      setProfileFeedback({ type: 'error', message: msg });
    } finally {
      setProfileSaving(false);
    }
  };

  // --- Password Actions ---
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!currentPassword) {
      setPasswordFeedback({ type: 'error', message: 'Vui lòng nhập mật khẩu hiện tại.' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
      return;
    }
    if (newPassword.length > 50) {
      setPasswordFeedback({ type: 'error', message: 'Mật khẩu mới không được vượt quá 50 ký tự.' });
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordFeedback({ type: 'error', message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.' });
      return;
    }
    if (confirmPassword !== newPassword) {
      setPasswordFeedback({ type: 'error', message: 'Mật khẩu xác nhận không khớp với mật khẩu mới.' });
      return;
    }

    setPasswordSaving(true);
    try {
      const message = await userService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setPasswordFeedback({
        type: 'success',
        message: message || 'Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.',
      });

      // Clear input fields on success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => setPasswordFeedback(null), 5000);
    } catch (err: any) {
      let msg = 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại.';
      const resData = err.response?.data;
      if (resData?.message) {
        if (resData.message === 'INVALID_CURRENT_PASSWORD') {
          msg = 'Mật khẩu hiện tại không chính xác. Vui lòng thử lại.';
        } else if (resData.message === 'NEW_PASSWORD_SAME_AS_OLD') {
          msg = 'Mật khẩu mới không được trùng với mật khẩu hiện tại.';
        } else if (resData.message === 'PASSWORD_CONFIRMATION_MISMATCH') {
          msg = 'Mật khẩu xác nhận không khớp với mật khẩu mới.';
        } else {
          msg = resData.message;
        }
      } else if (resData?.error?.details) {
        msg = Object.values(resData.error.details).join(', ');
      }
      setPasswordFeedback({ type: 'error', message: msg });
    } finally {
      setPasswordSaving(false);
    }
  };

  // --- Category Actions ---
  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setIsDeletingCategory(true);
    setCategoryDeleteError(null);
    try {
      await categoryService.deleteCategory(categoryToDelete.id);
      setCategories((prev) => prev.filter((item) => item.id !== categoryToDelete.id));
      window.dispatchEvent(
        new CustomEvent('finman_categories_updated', {
          detail: { deletedId: categoryToDelete.id },
        })
      );
      setCategoryFeedback({
        type: 'success',
        message: `Đã chuyển danh mục "${categoryToDelete.name}" vào Thùng rác (lưu trữ 15 ngày)!`,
      });
      loadRecycleBin();
      setTimeout(() => setCategoryFeedback(null), 4000);
      setCategoryToDelete(null);
    } catch (err: any) {
      console.error('Lỗi khi xóa danh mục:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Không thể xóa danh mục này. Vui lòng thử lại sau!';
      setCategoryDeleteError(msg);
    } finally {
      setIsDeletingCategory(false);
    }
  };

  // Filtered categories (Chỉ phân loại Chi tiêu hoặc Thu nhập)
  const filteredCategories = categories.filter((c) => {
    const matchesType = c.type === categoryTypeFilter;
    const matchesSearch =
      !categorySearch.trim() ||
      c.name.toLowerCase().includes(categorySearch.toLowerCase().trim());
    return matchesType && matchesSearch;
  });

  return (
    <div className="w-full max-w-[1400px] mx-auto px-gutter-desktop py-space-lg select-none">
      
      {/* 2-Column Responsive Layout: Left Sidebar Menu + Right Content */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Sidebar Menu */}
        <aside className="w-full lg:w-72 shrink-0 bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/20 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center gap-3 p-2.5 bg-surface-container-low/70 rounded-xl border border-outline-variant/15">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-amber-600 text-white flex items-center justify-center font-bold text-base shrink-0 overflow-hidden ring-2 ring-primary/20">
              {avatarUrl && !avatarImgFailed ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                (fullName || user?.email || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs text-on-surface truncate">{fullName || 'Người dùng'}</div>
              <div className="text-[11px] text-on-surface-variant truncate">{user?.email}</div>
            </div>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-primary text-white shadow-sm shadow-primary/25'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[19px]">person</span>
                <span>Hồ sơ cá nhân</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-primary text-white shadow-sm shadow-primary/25'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[19px]">lock</span>
                <span>Bảo mật &amp; Mật khẩu</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-primary text-white shadow-sm shadow-primary/25'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[19px]">tune</span>
                <span>Danh mục thu chi</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'categories'
                    ? 'bg-white/20 text-white'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {categories.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('recycle_bin');
                loadRecycleBin();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'recycle_bin'
                  ? 'bg-primary text-white shadow-sm shadow-primary/25'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[19px]">delete</span>
                <span>Thùng rác</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'recycle_bin'
                    ? 'bg-white/20 text-white'
                    : recycleBinItems.length > 0
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 font-semibold'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {recycleBinItems.length}
              </span>
            </button>
          </div>          

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-error hover:bg-error-container/30 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Đăng xuất tài khoản</span>
            </button>
          </div>
        </aside>

        {/* Right Main Content Area */}
        <main className="flex-1 min-w-0 w-full">

      {/* ========================================================================= */}
      {/* TAB 1: HỒ SƠ CÁ NHÂN (PROFILE) */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop">
          {/* Left: Avatar Picker & Identity Card (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/20 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Ảnh đại diện
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-secondary/15 text-secondary">
                  Hiển thị thực tế
                </span>
              </div>

              {/* Large Current Avatar Preview */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-container-low/70 border border-outline-variant/15 text-center">
                <div className="relative mb-3 group">
                  {avatarUrl && !avatarImgFailed ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/20 shadow-md transition-transform group-hover:scale-105"
                      onError={() => {
                        setAvatarImgFailed(true);
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-amber-600 text-white flex items-center justify-center font-extrabold text-3xl ring-4 ring-primary/20 shadow-md">
                      {(fullName || user?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  {avatarUrl && !avatarImgFailed && (
                    <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center ring-2 ring-surface-container-lowest text-[12px] shadow-sm">
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    </span>
                  )}
                </div>

                <span className="font-title-md text-title-md font-bold text-on-surface">
                  {fullName || 'Chưa đặt tên'}
                </span>
                <span className="text-xs text-on-surface-variant mt-0.5">
                  {user?.email}
                </span>

                {avatarImgFailed && avatarUrl && (
                  <p className="mt-2 text-[11px] text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 text-center max-w-[260px] leading-relaxed">
                    Ảnh không thể hiển thị từ liên kết hiện tại. Vui lòng chọn ảnh khác hoặc kiểm tra lại URL.
                  </p>
                )}

                {avatarUrl && (
                  <button
                    onClick={handleResetAvatar}
                    type="button"
                    className="mt-3 text-[11px] text-error hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                    <span>Xóa ảnh tùy chỉnh (Dùng chữ cái đầu)</span>
                  </button>
                )}
              </div>

              {/* Preset Avatars Selector */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-2">
                  Bộ sưu tập ảnh đại diện có sẵn:
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {PRESET_AVATARS.map((item) => {
                    const isSelected = avatarUrl === item.url && !avatarImgFailed;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectPresetAvatar(item.url)}
                        title={item.label}
                        className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${isSelected
                            ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                            : 'border-outline-variant/30 hover:border-primary/50 bg-surface-container-lowest'
                          }`}
                      >
                        <img
                          src={item.url}
                          alt={item.label}
                          className="w-11 h-11 rounded-full object-cover"
                        />
                        <span className="text-[10px] text-on-surface font-semibold mt-1 truncate max-w-full">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Image URL input */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  Hoặc nhập liên kết ảnh trực tuyến (Image URL):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/avatar.jpg hoặc link Wikipedia"
                    value={customAvatarInput}
                    onChange={(e) => {
                      setCustomAvatarInput(e.target.value);
                      if (customAvatarError) setCustomAvatarError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyCustomAvatar();
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-xl bg-surface-container-low text-xs text-on-surface placeholder:text-on-surface-variant/50 border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomAvatar}
                    disabled={!customAvatarInput.trim() || isResolvingAvatar}
                    className="px-3 py-2 rounded-xl bg-surface-container-high hover:bg-primary hover:text-white text-on-surface text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    {isResolvingAvatar ? (
                      <>
                        <span className="inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                        <span>Đang tải...</span>
                      </>
                    ) : (
                      <span>Áp dụng</span>
                    )}
                  </button>
                </div>
                {customAvatarError && (
                  <p className="text-[11px] text-error font-medium mt-1.5 flex items-start gap-1 leading-snug">
                    <span className="material-symbols-outlined text-[14px] shrink-0 mt-0.5">error</span>
                    <span>{customAvatarError}</span>
                  </p>
                )}

              </div>
            </div>
          </div>

          {/* Right: Personal Information Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl shadow-sm border border-outline-variant/20 space-y-6">
              <div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Thông tin cá nhân
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Cập nhật các thông tin hiển thị và định danh tài khoản FinMan
                </p>
              </div>

              {/* Feedback Alert */}
              {profileFeedback && (
                <div
                  className={`p-4 rounded-xl flex items-start gap-3 text-xs font-semibold ${profileFeedback.type === 'success'
                      ? 'bg-secondary/10 text-secondary border border-secondary/20'
                      : 'bg-error-container/60 text-error border border-error/20'
                    }`}
                >
                  <span className="material-symbols-outlined text-[20px] shrink-0">
                    {profileFeedback.type === 'success' ? 'check_circle' : 'error'}
                  </span>
                  <div className="flex-1 pt-0.5">{profileFeedback.message}</div>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-5">
                {/* Full Name Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-on-surface">
                      Họ và tên hiển thị <span className="text-primary">*</span>
                    </label>
                    <span className="text-[11px] text-on-surface-variant">
                      {fullName.length}/100 ký tự
                    </span>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[20px]">
                      badge
                    </span>
                    <input
                      type="text"
                      maxLength={100}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nhập họ và tên đầy đủ của bạn..."
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface placeholder:text-on-surface-variant/50 border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Tên này sẽ hiển thị trên thanh điều hướng đầu trang, báo cáo xuất khẩu và nhật ký giao dịch.
                  </p>
                </div>

                {/* Email (Readonly) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-on-surface">
                      Địa chỉ Email đăng nhập
                    </label>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-secondary">
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      <span>Đã xác minh</span>
                    </span>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant/70 text-[20px]">
                      mail
                    </span>
                    <input
                      type="email"
                      readOnly
                      disabled
                      value={user?.email || ''}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-container/60 text-xs font-semibold text-on-surface-variant border border-outline-variant/20 cursor-not-allowed select-text"
                    />
                    <span className="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant/60 text-[18px]">
                      lock
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Email tài khoản được cố định để đảm bảo tính an toàn cho các giao dịch tài chính.
                  </p>
                </div>

                {/* Account Meta Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-surface-container-low/70 border border-outline-variant/20 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">shield_person</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-on-surface-variant uppercase font-bold block">
                        Vai trò hệ thống
                      </span>
                      <span className="text-xs font-bold text-on-surface">
                        {user?.role === 'ADMIN' ? 'Quản trị viên cấp cao' : 'Thành viên FinMan'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-container-low/70 border border-outline-variant/20 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">fingerprint</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-on-surface-variant uppercase font-bold block">
                        Mã tài khoản
                      </span>
                      <span className="text-xs font-bold text-on-surface font-mono">
                        #FM-{user?.id ? String(user.id).padStart(5, '0') : '00001'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Save Profile Button */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    disabled={profileSaving || !fullName.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/20 hover:bg-primary-container active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {profileSaving ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">save</span>
                        <span>Lưu thay đổi hồ sơ</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BẢO MẬT & ĐỔI MẬT KHẨU (SECURITY & PASSWORD) */}
      {/* ========================================================================= */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop">
          {/* Left: Security Info Card (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/20 space-y-5">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">security</span>
              </div>

              <div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Tiêu chuẩn bảo mật FinMan
                </h3>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Bảo vệ an toàn tài sản số và dữ liệu tài chính cá nhân của bạn bằng mật khẩu mạnh mẽ.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-2.5 text-xs text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <span>Mật khẩu phải chứa ít nhất <strong>6 ký tự</strong> và tối đa 50 ký tự.</span>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <span>Mật khẩu mới <strong>không được trùng</strong> với mật khẩu đang sử dụng.</span>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <span>Mã hóa BCrypt chuẩn cấp ngân hàng với khóa bảo mật riêng biệt.</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low text-xs text-on-surface-variant flex items-center gap-3">
                <span className="material-symbols-outlined text-amber-600 text-[20px] shrink-0">
                  lightbulb
                </span>
                <span>
                  Khuyến nghị nên kết hợp cả chữ in hoa, chữ thường, chữ số và ký tự đặc biệt.
                </span>
              </div>
            </div>
          </div>

          {/* Right: Change Password Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl shadow-sm border border-outline-variant/20 space-y-6">
              <div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Đổi mật khẩu tài khoản
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Nhập mật khẩu hiện tại và tạo mật khẩu mới để tăng cường bảo vệ
                </p>
              </div>

              {/* Password Feedback Alert */}
              {passwordFeedback && (
                <div
                  className={`p-4 rounded-xl flex items-start gap-3 text-xs font-semibold ${passwordFeedback.type === 'success'
                      ? 'bg-secondary/10 text-secondary border border-secondary/20'
                      : 'bg-error-container/60 text-error border border-error/20'
                    }`}
                >
                  <span className="material-symbols-outlined text-[20px] shrink-0">
                    {passwordFeedback.type === 'success' ? 'check_circle' : 'error'}
                  </span>
                  <div className="flex-1 pt-0.5">{passwordFeedback.message}</div>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5">
                    Mật khẩu hiện tại <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[20px]">
                      key
                    </span>
                    <input
                      type={showCurrentPw ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Nhập mật khẩu bạn đang dùng..."
                      required
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface placeholder:text-on-surface-variant/50 border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-3 top-2.5 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showCurrentPw ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5">
                    Mật khẩu mới <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[20px]">
                      lock_open
                    </span>
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Ít nhất 6 ký tự bảo mật..."
                      minLength={6}
                      maxLength={50}
                      required
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface placeholder:text-on-surface-variant/50 border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-2.5 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showNewPw ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-on-surface">
                      Xác nhận mật khẩu mới <span className="text-primary">*</span>
                    </label>
                    {confirmPassword && (
                      <span
                        className={`text-[11px] font-bold flex items-center gap-1 ${confirmPassword === newPassword ? 'text-secondary' : 'text-error'
                          }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {confirmPassword === newPassword ? 'check' : 'close'}
                        </span>
                        <span>{confirmPassword === newPassword ? 'Khớp mật khẩu' : 'Chưa khớp'}</span>
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[20px]">
                      lock_reset
                    </span>
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới vừa gõ..."
                      minLength={6}
                      maxLength={50}
                      required
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface placeholder:text-on-surface-variant/50 border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-3 top-2.5 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showConfirmPw ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Save Password Button */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={
                      passwordSaving ||
                      !currentPassword ||
                      !newPassword ||
                      newPassword.length < 6 ||
                      confirmPassword !== newPassword
                    }
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/20 hover:bg-primary-container active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {passwordSaving ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">key</span>
                        <span>Cập nhật mật khẩu mới</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DANH MỤC THU CHI (CATEGORIES) */}
      {/* ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/20 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Danh mục thu chi
              </h3>
              <p className="text-xs text-on-surface-variant">
                Quản lý các hạng mục phân loại tài chính trong Giao dịch
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsAddCatModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary-container transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Thêm danh mục</span>
              </button>
            </div>
          </div>

          {/* Category Success / Error Feedback Banner */}
          {categoryFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 border animate-in fade-in duration-200 ${
                categoryFeedback.type === 'success'
                  ? 'bg-secondary/10 border-secondary/25 text-secondary'
                  : 'bg-error/10 border-error/25 text-error'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">
                  {categoryFeedback.type === 'success' ? 'check_circle' : 'error'}
                </span>
                <span>{categoryFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setCategoryFeedback(null)}
                className="opacity-70 hover:opacity-100 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}

          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCategoryTypeFilter('EXPENSE')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${categoryTypeFilter === 'EXPENSE'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                  }`}
              >
                Chi tiêu ({categories.filter((c) => c.type === 'EXPENSE').length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryTypeFilter('INCOME')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${categoryTypeFilter === 'INCOME'
                    ? 'bg-secondary text-white shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                  }`}
              >
                Thu nhập ({categories.filter((c) => c.type === 'INCOME').length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-2 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Tìm danh mục..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-container-low text-xs text-on-surface placeholder:text-on-surface-variant/50 border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
            {filteredCategories.map((c) => {
              const theme = getCategoryTheme(c);
              const isDefault = Boolean(c.isDefault);
              return (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/15 flex items-center justify-between transition-all hover:shadow-xs group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: c.bgColor || theme.hexBg,
                        color: c.color || theme.hexColor,
                      }}
                    >
                      <span className="text-xl leading-none select-none">{theme.emoji}</span>
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-bold text-on-surface truncate">
                          {c.name}
                        </span>
                        {isDefault ? (
                          <span
                            className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant/70 border border-outline-variant/20 inline-flex items-center gap-0.5 shrink-0"
                            title="Danh mục mặc định của hệ thống"
                          >
                            <span className="material-symbols-outlined text-[10px]">lock</span>
                            Hệ thống
                          </span>
                        ) : (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0"
                            title="Danh mục tùy biến do bạn tạo"
                          >
                            Tùy biến
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider block mt-0.5 ${
                          c.type === 'INCOME' ? 'text-secondary' : 'text-primary'
                        }`}
                      >
                        {c.type === 'INCOME' ? 'Thu nhập' : 'Chi tiêu'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {isDefault ? (
                      <span
                        className="text-base opacity-25 group-hover:opacity-60 transition-opacity select-none cursor-default"
                        title="Danh mục hệ thống (bảo vệ)"
                      >
                        {theme.emoji}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCategoryToDelete(c);
                          setCategoryDeleteError(null);
                        }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant/60 hover:text-error hover:bg-error/10 active:scale-95 transition-all cursor-pointer opacity-80 group-hover:opacity-100"
                        title={`Xóa danh mục "${c.name}"`}
                      >
                        <span className="material-symbols-outlined text-[18px]">delete_outline</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredCategories.length === 0 && (
              <div className="col-span-full py-12 text-center text-xs text-on-surface-variant">
                Không tìm thấy danh mục nào phù hợp.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: THÙNG RÁC (RECYCLE BIN - 15 NGÀY) */}
      {/* ========================================================================= */}
      {activeTab === 'recycle_bin' && (
        <div className="space-y-6">
          {/* Feedback banner */}
          {binFeedback && (
            <div
              className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold shadow-xs animate-in fade-in duration-200 ${
                binFeedback.type === 'success'
                  ? 'bg-secondary/15 text-secondary border border-secondary/25'
                  : 'bg-error/15 text-error border border-error/25'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">
                {binFeedback.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span className="flex-1">{binFeedback.message}</span>
              <button
                type="button"
                onClick={() => setBinFeedback(null)}
                className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}

          {/* Header Card */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center shrink-0 ring-1 ring-amber-500/20 shadow-xs">
                <span className="material-symbols-outlined text-[28px]">delete_sweep</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Thùng rác hệ thống
                </h3>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed max-w-2xl">
                  Dữ liệu bị xóa được bảo lưu an toàn tối đa <strong>15 ngày</strong>. Bạn có thể khôi phục tức thời hoặc tick chọn để xóa vĩnh viễn.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => loadRecycleBin()}
                disabled={isBinLoading}
                className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Làm mới thùng rác"
              >
                <span className={`material-symbols-outlined text-[18px] ${isBinLoading ? 'animate-spin' : ''}`}>
                  refresh
                </span>
                <span>Làm mới</span>
              </button>

              <button
                type="button"
                disabled={recycleBinItems.length === 0 || isBinOperating}
                onClick={() => setConfirmDeleteModal({ isOpen: true, mode: 'empty_all' })}
                className="px-4 py-2 rounded-xl bg-error/10 hover:bg-error hover:text-white text-error text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
              >
                <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                <span>Dọn sạch thùng rác</span>
              </button>
            </div>
          </div>

          {/* Filter Pills & Selection Controls */}
          <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm space-y-3.5">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { type: 'ALL' as RecycleBinType, label: 'Tất cả', icon: 'apps' },
                { type: 'TRANSACTION' as RecycleBinType, label: 'Giao dịch', icon: 'receipt_long' },
                { type: 'CATEGORY' as RecycleBinType, label: 'Danh mục', icon: 'category' },
                { type: 'BUDGET' as RecycleBinType, label: 'Ngân sách', icon: 'pie_chart' },
                { type: 'ACCOUNT' as RecycleBinType, label: 'Tài khoản', icon: 'account_balance_wallet' },
              ].map((tab) => {
                const isActive = binFilter === tab.type;
                const count = binCounts[tab.type];
                return (
                  <button
                    key={tab.type}
                    type="button"
                    onClick={() => handleBinFilterChange(tab.type)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selection & Bulk Actions Row */}
            {displayedBinItems.length > 0 && (
              <div className="pt-2 border-t border-outline-variant/15 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-on-surface cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={
                        displayedBinItems.length > 0 &&
                        displayedBinItems.every((i) => selectedBinKeys.has(`${i.type}-${i.id}`))
                      }
                      onChange={handleSelectAllBinItems}
                      className="w-4 h-4 rounded text-primary focus:ring-primary/20 cursor-pointer"
                    />
                    <span>Chọn tất cả ({displayedBinItems.length})</span>
                  </label>
                  {selectedBinKeys.size > 0 && (
                    <span className="text-xs text-primary font-semibold">
                      Đã chọn {selectedBinKeys.size} mục
                    </span>
                  )}
                </div>

                {selectedBinKeys.size > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isBinOperating}
                      onClick={() => {
                        const targets = recycleBinItems
                          .filter((i) => selectedBinKeys.has(`${i.type}-${i.id}`))
                          .map((i) => ({ id: i.id, type: i.type }));
                        handleRestoreBinItems(targets);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-secondary hover:bg-secondary/90 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[17px]">restore_from_trash</span>
                      <span>Khôi phục đã chọn ({selectedBinKeys.size})</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBinOperating}
                      onClick={() => setConfirmDeleteModal({ isOpen: true, mode: 'selected' })}
                      className="px-3.5 py-1.5 rounded-xl bg-error hover:bg-error/90 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[17px]">delete_forever</span>
                      <span>Xóa vĩnh viễn đã chọn ({selectedBinKeys.size})</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recycle Bin Items List */}
          {isBinLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/15 animate-pulse flex items-center gap-4">
                  <div className="w-5 h-5 rounded bg-surface-container-high"></div>
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high"></div>
                  <div className="flex-1 space-y-2">
                    <div className="w-48 h-3.5 rounded bg-surface-container-high"></div>
                    <div className="w-28 h-3 rounded bg-surface-container"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : displayedBinItems.length === 0 ? (
            <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center text-on-surface-variant/70">
                <span className="material-symbols-outlined text-[34px]">recycling</span>
              </div>
              <h4 className="font-bold text-sm text-on-surface">
                {binFilter === 'ALL'
                  ? 'Thùng rác trống'
                  : `Không có ${
                      binFilter === 'TRANSACTION'
                        ? 'giao dịch'
                        : binFilter === 'CATEGORY'
                        ? 'danh mục'
                        : binFilter === 'BUDGET'
                        ? 'ngân sách'
                        : 'tài khoản'
                    } nào trong thùng rác`}
              </h4>
              <p className="text-xs text-on-surface-variant max-w-sm leading-relaxed">
                {binFilter === 'ALL'
                  ? 'Không có mục nào trong thùng rác hoặc dữ liệu đã vượt quá 15 ngày và được tự động giải phóng an toàn.'
                  : 'Không có mục nào thuộc phân loại này trong thùng rác.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayedBinItems.map((item) => {
                const key = `${item.type}-${item.id}`;
                const isChecked = selectedBinKeys.has(key);

                // Type details
                let typeLabel = 'Giao dịch';
                let typeColor = 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20';
                let defaultIcon = 'receipt_long';
                if (item.type === 'CATEGORY') {
                  typeLabel = 'Danh mục';
                  typeColor = 'bg-indigo-500/10 text-indigo-600 ring-indigo-500/20';
                  defaultIcon = 'category';
                } else if (item.type === 'BUDGET') {
                  typeLabel = 'Ngân sách';
                  typeColor = 'bg-amber-500/10 text-amber-600 ring-amber-500/20';
                  defaultIcon = 'pie_chart';
                } else if (item.type === 'ACCOUNT') {
                  typeLabel = 'Tài khoản';
                  typeColor = 'bg-sky-500/10 text-sky-600 ring-sky-500/20';
                  defaultIcon = 'account_balance_wallet';
                }

                // Days remaining badge color
                const isUrgent = item.daysRemaining <= 2;
                const isWarning = item.daysRemaining <= 5 && !isUrgent;

                return (
                  <div
                    key={key}
                    onClick={() => handleToggleBinItem(item)}
                    className={`p-3.5 sm:p-4 rounded-2xl bg-surface-container-lowest border transition-all flex items-center justify-between gap-3 group cursor-pointer ${
                      isChecked
                        ? 'border-primary shadow-xs ring-1 ring-primary/30'
                        : 'border-outline-variant/20 hover:border-outline-variant/50 hover:shadow-2xs'
                    }`}
                  >
                    {/* Left: Checkbox & Icon & Info */}
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Handled by card click
                        className="w-4 h-4 rounded text-primary focus:ring-primary/20 shrink-0 cursor-pointer"
                      />

                      {/* Icon */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ring-1 ${typeColor}`}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {item.icon || defaultIcon}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-on-surface truncate">
                            {item.title}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${typeColor}`}>
                            {typeLabel}
                          </span>
                          {/* Countdown badge */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              isUrgent
                                ? 'bg-error-container text-error ring-1 ring-error/30 animate-pulse'
                                : isWarning
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                                : 'bg-surface-container-high text-on-surface-variant'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                            <span>{item.daysRemaining > 0 ? `Còn ${item.daysRemaining} ngày` : 'Sắp xóa'}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mt-0.5 flex-wrap">
                          {item.subtitle && <span>{item.subtitle}</span>}
                          {item.extraInfo && <span>• {item.extraInfo}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount & Action Buttons */}
                    <div
                      className="flex items-center gap-2 sm:gap-3 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.amount != null && (
                        <div className="text-right hidden sm:block">
                          <div className="text-xs sm:text-sm font-extrabold text-on-surface">
                            {Number(item.amount).toLocaleString('vi-VN')} ₫
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRestoreBinItems([{ id: item.id, type: item.type }])}
                        disabled={isBinOperating}
                        className="px-2.5 py-1.5 rounded-xl bg-secondary/10 hover:bg-secondary hover:text-white text-secondary text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Khôi phục mục này"
                      >
                        <span className="material-symbols-outlined text-[16px]">restore</span>
                        <span className="hidden md:inline">Khôi phục</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setConfirmDeleteModal({
                            isOpen: true,
                            mode: 'single',
                            targetItem: item,
                          })
                        }
                        disabled={isBinOperating}
                        className="w-8 h-8 rounded-xl bg-error/10 hover:bg-error hover:text-white text-error flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                        title="Xóa vĩnh viễn"
                      >
                        <span className="material-symbols-outlined text-[17px]">delete_forever</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Close Right Main Content Area & 2-Column Container */}
      </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: UNIFIED ADD CATEGORY MODAL */}
      {/* ========================================================================= */}
      <AddCategoryModal
        isOpen={isAddCatModalOpen}
        onClose={() => setIsAddCatModalOpen(false)}
        initialType={categoryTypeFilter}
        showTypeSelector={true}
        onSuccess={(created) => {
          setCategories((prev) => [...prev, created]);
        }}
      />

      {/* ========================================================================= */}
      {/* MODAL: XÁC NHẬN XÓA DANH MỤC TÙY BIẾN */}
      {/* ========================================================================= */}
      {categoryToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in select-none"
          onClick={() => {
            if (!isDeletingCategory) {
              setCategoryToDelete(null);
              setCategoryDeleteError(null);
            }
          }}
        >
          <div
            className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-6 shadow-2xl border border-outline-variant/30 space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-error-container/60 text-error flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">delete_forever</span>
              </div>
              <div>
                <h4 className="text-base font-bold text-on-surface">
                  Xác nhận xóa danh mục
                </h4>
                <p className="text-xs text-on-surface-variant">
                  Thao tác này sẽ gỡ bỏ danh mục tùy biến khỏi hệ thống
                </p>
              </div>
            </div>

            {/* Category Card Preview */}
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl shadow-xs"
                style={{
                  backgroundColor: categoryToDelete.bgColor || getCategoryTheme(categoryToDelete).hexBg,
                  color: categoryToDelete.color || getCategoryTheme(categoryToDelete).hexColor,
                }}
              >
                {getCategoryTheme(categoryToDelete).emoji}
              </div>
              <div className="truncate">
                <span className="text-sm font-bold text-on-surface block truncate">
                  {categoryToDelete.name}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    categoryToDelete.type === 'INCOME' ? 'text-secondary' : 'text-primary'
                  }`}
                >
                  {categoryToDelete.type === 'INCOME' ? 'Danh mục Thu nhập' : 'Danh mục Chi tiêu'}
                </span>
              </div>
            </div>        

            {/* Error Message if any */}
            {categoryDeleteError && (
              <div className="p-3 rounded-xl bg-error/10 border border-error/30 text-xs text-error font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{categoryDeleteError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingCategory}
                onClick={() => {
                  setCategoryToDelete(null);
                  setCategoryDeleteError(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isDeletingCategory}
                onClick={handleConfirmDeleteCategory}
                className="px-5 py-2.5 rounded-xl bg-error hover:bg-error/90 active:scale-95 text-white text-xs font-bold shadow-sm shadow-error/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeletingCategory ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Đang chuyển...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    <span>Chuyển vào thùng rác</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: LOGOUT CONFIRMATION DIALOG */}
      {/* ========================================================================= */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-surface-container-lowest rounded-2xl p-6 shadow-2xl border border-outline-variant/30 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-error-container/60 text-error flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">logout</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Xác nhận đăng xuất
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Bạn có chắc chắn muốn kết thúc phiên đăng nhập của tài khoản <strong>{user?.fullName || user?.email}</strong>?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface transition-colors cursor-pointer"
              >
                Ở lại
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="flex-1 py-2.5 rounded-xl bg-error text-white text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PERMANENT DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <ConfirmModal
        isOpen={confirmDeleteModal.isOpen}
        onClose={() => setConfirmDeleteModal({ isOpen: false, mode: 'selected' })}
        onConfirm={handlePermanentDeleteExecute}
        isLoading={isBinOperating}
        title={
          confirmDeleteModal.mode === 'empty_all'
            ? 'Dọn sạch thùng rác vĩnh viễn?'
            : confirmDeleteModal.mode === 'single'
            ? 'Xóa vĩnh viễn mục này?'
            : 'Xóa vĩnh viễn các mục đã chọn?'
        }
        message={
          confirmDeleteModal.mode === 'empty_all' ? (
            <span>
              Bạn có chắc chắn muốn xóa vĩnh viễn toàn bộ mục trong thùng rác?
              <br />
              Dữ liệu giao dịch và ngân sách sẽ bị xóa khỏi cơ sở dữ liệu. Danh mục hoặc tài khoản nếu có giao dịch liên quan sẽ được ẩn khỏi thùng rác nhưng giữ trong database để bảo toàn dữ liệu lịch sử.
            </span>
          ) : confirmDeleteModal.mode === 'single' ? (
            <span>
              Mục <strong>{confirmDeleteModal.targetItem?.title}</strong> sẽ bị xóa vĩnh viễn. Thao tác này không thể hoàn tác!
            </span>
          ) : (
            <span>
              Bạn đang chọn xóa vĩnh viễn <strong>{selectedBinKeys.size}</strong> mục. Dữ liệu sẽ bị xóa hoặc xử lý bảo toàn vĩnh viễn khỏi thùng rác.
            </span>
          )
        }
        confirmText="Xóa vĩnh viễn"
        cancelText="Hủy bỏ"
        type="danger"
        icon="delete_forever"
      />
    </div>
  );
};
