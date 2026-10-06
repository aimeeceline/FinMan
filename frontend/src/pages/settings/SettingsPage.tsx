import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { categoryService } from '../../services/categoryService';
import type { Category } from '../../types';
import { AddCategoryModal } from '../../components/modals/AddCategoryModal';
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

type SettingsTab = 'profile' | 'security' | 'categories';

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

  // Load categories
  useEffect(() => {
    categoryService.getCategories()
      .then(setCategories)
      .catch((err) => console.error('Error loading categories:', err));
  }, []);

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
      
      {/* Modern Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-3 mb-space-lg overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'profile'
              ? 'bg-primary text-white shadow-sm shadow-primary/20'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
        >
          <span className="material-symbols-outlined text-[18px]">person</span>
          <span>Hồ sơ cá nhân</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'security'
              ? 'bg-primary text-white shadow-sm shadow-primary/20'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
        >
          <span className="material-symbols-outlined text-[18px]">lock</span>
          <span>Bảo mật &amp; Mật khẩu</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'categories'
              ? 'bg-primary text-white shadow-sm shadow-primary/20'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          <span>Danh mục thu chi</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-surface-container-high text-on-surface font-semibold">
            {categories.length}
          </span>
        </button>
      </div>

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
                      <span className="text-xs font-bold text-on-surface block truncate">
                        {c.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          c.type === 'INCOME' ? 'text-secondary' : 'text-primary'
                        }`}
                      >
                        {c.type === 'INCOME' ? 'Thu nhập' : 'Chi tiêu'}
                      </span>
                    </div>
                  </div>

                  <span className="text-base opacity-25 group-hover:opacity-70 transition-opacity select-none">
                    {theme.emoji}
                  </span>
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
      {/* DANGER ZONE / LOGOUT SECTION */}
      {/* ========================================================================= */}
      <div className="mt-space-lg p-6 rounded-2xl bg-surface-container-lowest border border-error/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">logout</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-on-surface">Đăng xuất khỏi hệ thống</h4>
            <p className="text-[11px] text-on-surface-variant">
              Kết thúc phiên làm việc an toàn trên thiết bị này. Dữ liệu của bạn luôn được đồng bộ.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowLogoutConfirm(true)}
          type="button"
          className="px-4 py-2 rounded-xl bg-error-container/60 hover:bg-error-container text-error text-xs font-bold transition-all self-start sm:self-auto cursor-pointer"
        >
          Đăng xuất tài khoản
        </button>
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
    </div>
  );
};
