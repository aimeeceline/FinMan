export interface CategoryTheme {
  emoji: string;
  bgClass: string;
  textClass: string;
  hexBg: string;
  hexColor: string;
}

// Canonical category visual metadata
export const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  // === Chi tiêu (Expense) ===
  'Ăn uống': {
    emoji: '🍜',
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
    hexBg: '#fee2e2',
    hexColor: '#dc2626',
  },
  'Áo quần': {
    emoji: '👕',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-700',
    hexBg: '#dbeafe',
    hexColor: '#2563eb',
  },
  'Mua sắm': {
    emoji: '🛒',
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-700',
    hexBg: '#d1fae5',
    hexColor: '#059669',
  },
  'Giao thông': {
    emoji: '🚕',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-700',
    hexBg: '#fef3c7',
    hexColor: '#d97706',
  },
  'Giải trí': {
    emoji: '🎮',
    bgClass: 'bg-purple-100',
    textClass: 'text-purple-700',
    hexBg: '#f3e8ff',
    hexColor: '#9333ea',
  },
  'Sinh hoạt': {
    emoji: '🏠',
    bgClass: 'bg-rose-100',
    textClass: 'text-rose-700',
    hexBg: '#ffe4e6',
    hexColor: '#e11d48',
  },
  'Sức khỏe': {
    emoji: '💊',
    bgClass: 'bg-pink-100',
    textClass: 'text-pink-700',
    hexBg: '#fce7f3',
    hexColor: '#db2777',
  },
  'Giáo dục': {
    emoji: '📚',
    bgClass: 'bg-teal-100',
    textClass: 'text-teal-700',
    hexBg: '#ccfbf1',
    hexColor: '#0d9488',
  },
  'Chi tiêu khác': {
    emoji: '📦',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    hexBg: '#f1f5f9',
    hexColor: '#475569',
  },

  // === Thu nhập (Income) ===
  'Lương': {
    emoji: '💼',
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-700',
    hexBg: '#d1fae5',
    hexColor: '#059669',
  },
  'Thưởng': {
    emoji: '🎁',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-700',
    hexBg: '#fef3c7',
    hexColor: '#d97706',
  },
  'Đầu tư': {
    emoji: '📈',
    bgClass: 'bg-indigo-100',
    textClass: 'text-indigo-700',
    hexBg: '#e0e7ff',
    hexColor: '#4f46e5',
  },
  'Freelance': {
    emoji: '💻',
    bgClass: 'bg-sky-100',
    textClass: 'text-sky-700',
    hexBg: '#e0f2fe',
    hexColor: '#0284c7',
  },
  'Thu nhập khác': {
    emoji: '🪙',
    bgClass: 'bg-violet-100',
    textClass: 'text-violet-700',
    hexBg: '#ede9fe',
    hexColor: '#7c3aed',
  },
};

// Map legacy Material Symbol icon names to Category theme keys
export const LEGACY_ICON_MAP: Record<string, string> = {
  restaurant: 'Ăn uống',
  apparel: 'Áo quần',
  shopping_bag: 'Mua sắm',
  directions_car: 'Giao thông',
  sports_esports: 'Giải trí',
  home: 'Sinh hoạt',
  favorite: 'Sức khỏe',
  school: 'Giáo dục',
  more_horiz: 'Chi tiêu khác',
  category: 'Chi tiêu khác',
  payments: 'Lương',
  featured_seasonal_and_gifts: 'Thưởng',
  trending_up: 'Đầu tư',
  laptop_mac: 'Freelance',
  savings: 'Thu nhập khác',
  account_balance: 'Thu nhập khác',
};

// Check if string contains an emoji
export const isEmoji = (str?: string | null): boolean => {
  if (!str) return false;
  return /\p{Extended_Pictographic}/u.test(str) || (str.length <= 4 && /[^\x00-\x7F]/.test(str));
};

export interface CategoryLike {
  id?: number | string;
  name?: string;
  icon?: string;
  type?: string;
  color?: string;
  bgColor?: string;
}

/**
 * Resolves full visual theme (emoji, colors) for any category object or name.
 * 1. Checks matching category name in CATEGORY_THEMES.
 * 2. Checks if category.icon is a known legacy Material Symbol and maps it.
 * 3. Checks if category.icon is already an emoji.
 * 4. Fallbacks to sensible defaults by category type.
 */
export const getCategoryTheme = (
  category?: CategoryLike | string | null,
  textHint?: string
): CategoryTheme => {
  if (!category && !textHint) {
    return {
      emoji: '🏷️',
      bgClass: 'bg-slate-100',
      textClass: 'text-slate-700',
      hexBg: '#f1f5f9',
      hexColor: '#475569',
    };
  }

  const name = typeof category === 'string' ? category.trim() : (category?.name || '').trim();
  const icon = typeof category === 'string' ? '' : (category?.icon || '').trim();
  const type = typeof category === 'string' ? undefined : category?.type;

  // 1. By exact or normalized name
  if (name && CATEGORY_THEMES[name]) {
    return CATEGORY_THEMES[name];
  }

  // 2. By legacy icon name mapping
  if (icon && LEGACY_ICON_MAP[icon] && CATEGORY_THEMES[LEGACY_ICON_MAP[icon]]) {
    return CATEGORY_THEMES[LEGACY_ICON_MAP[icon]];
  }

  // 3. Icon is already an emoji
  if (icon && isEmoji(icon)) {
    const isIncome = type === 'INCOME';
    return {
      emoji: icon,
      bgClass: isIncome ? 'bg-emerald-100' : 'bg-red-100',
      textClass: isIncome ? 'text-emerald-700' : 'text-red-700',
      hexBg: typeof category !== 'string' && category?.bgColor ? category.bgColor : (isIncome ? '#d1fae5' : '#fee2e2'),
      hexColor: typeof category !== 'string' && category?.color ? category.color : (isIncome ? '#059669' : '#dc2626'),
    };
  }

  // 4. By keyword hint from note or title
  const searchStr = `${name} ${textHint || ''}`.toLowerCase();
  if (/bệnh|thuốc|khám|bác sĩ|y tế|sức khỏe|dược|viện/i.test(searchStr)) {
    return CATEGORY_THEMES['Sức khỏe'];
  }
  if (/sách|giáo trình|học|khóa học|học phí|vở|bút|đại học|trường/i.test(searchStr)) {
    return CATEGORY_THEMES['Giáo dục'];
  }
  if (/ăn|uống|cơm|phở|bún|cafe|cà phê|trà|nước ngọt|bánh|nhà hàng|quán/i.test(searchStr)) {
    return CATEGORY_THEMES['Ăn uống'];
  }
  if (/xe|xăng|grab|be|gojek|taxi|bãi đỗ|gửi xe|vé tàu|vé xe|vé máy bay/i.test(searchStr)) {
    return CATEGORY_THEMES['Giao thông'];
  }
  if (/quần|áo|giày|dép|váy|túi|thời trang/i.test(searchStr)) {
    return CATEGORY_THEMES['Áo quần'];
  }
  if (/điện|nước|internet|wifi|nhà|tiền phòng|chung cư|gas/i.test(searchStr)) {
    return CATEGORY_THEMES['Sinh hoạt'];
  }
  if (/game|phim|du lịch|rạp|vé xem|karaoke/i.test(searchStr)) {
    return CATEGORY_THEMES['Giải trí'];
  }
  if (/mua|shopee|lazada|tiki|siêu thị|mart/i.test(searchStr)) {
    return CATEGORY_THEMES['Mua sắm'];
  }
  if (/lương|salary/i.test(searchStr)) {
    return CATEGORY_THEMES['Lương'];
  }
  if (/thưởng|bonus/i.test(searchStr)) {
    return CATEGORY_THEMES['Thưởng'];
  }
  if (/đầu tư|lãi|cổ phiếu|chứng khoán|tiết kiệm/i.test(searchStr)) {
    return CATEGORY_THEMES['Đầu tư'];
  }

  // 5. Default fallbacks
  if (type === 'INCOME') {
    return {
      emoji: '🪙',
      bgClass: 'bg-emerald-100',
      textClass: 'text-emerald-700',
      hexBg: '#d1fae5',
      hexColor: '#059669',
    };
  }

  return {
    emoji: '📦',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    hexBg: '#f1f5f9',
    hexColor: '#475569',
  };
};

/**
 * Returns just the display emoji string for a category.
 */
export const getCategoryEmoji = (category?: CategoryLike | string | null): string => {
  return getCategoryTheme(category).emoji;
};
