import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ZoomMode = 'auto' | 'manual';

export interface ScreenZoomContextType {
  zoomScale: number;
  zoomMode: ZoomMode;
  screenDimensions: { width: number; height: number; dpr: number };
  setZoomMode: (mode: ZoomMode) => void;
  setZoomScale: (scale: number) => void;
  increaseZoom: () => void;
  decreaseZoom: () => void;
  resetZoom: () => void;
  formattedPercent: string;
}

const ScreenZoomContext = createContext<ScreenZoomContextType | undefined>(undefined);

/**
 * Tính toán tỷ lệ scale lý tưởng dựa trên chiều rộng hiển thị thực tế của màn hình (viewport width).
 * Thiết kế FinMan chuẩn mực ở 1500-1700px.
 * - Khi sang màn hình laptop nhỏ hoặc scaling cao (125-150%): tự thu nhỏ 82% - 90% để không bị tràn.
 * - Khi sang màn hình lớn 2K/4K: tự phóng to 108% - 118% để mắt nhìn thoải mái, chữ không bị bé tí.
 */
export const calculateOptimalScale = (width: number, height?: number): number => {
  // Nếu chiều cao màn hình bị giới hạn (màn laptop 1366x768 hoặc 1080p @ 150% scaling, viewport height ~ 500-680px)
  if (height && height < 680) {
    if (width < 1200) return 0.80;
    return 0.85;
  }
  if (height && height < 780) {
    if (width < 1366) return 0.88;
    return 0.92;
  }

  // Màn hình 4K hoặc Ultrawide cực lớn (> 2500px)
  if (width >= 2500) {
    return 1.15;
  }
  // Màn hình 2K (2560x1440)
  if (width >= 2100) {
    return 1.08;
  }
  // Màn hình Full HD (1920x1080) hoặc laptop 15.6": chuẩn 1.0
  if (width >= 1500) {
    return 1.0;
  }
  if (width >= 1350) {
    return 0.92; // Laptop 14-15"
  }
  if (width >= 1180) {
    return 0.86; // Laptop 13"
  }
  if (width >= 900) {
    return 0.80; // Cửa sổ thu nhỏ
  }
  return 0.75;
};

export const ScreenZoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [zoomMode, setZoomModeState] = useState<ZoomMode>(() => {
    const saved = localStorage.getItem('finman_zoom_mode');
    return saved === 'manual' ? 'manual' : 'auto';
  });

  const [screenDimensions, setScreenDimensions] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1600,
    height: typeof window !== 'undefined' ? window.innerHeight : 900,
    dpr: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
  }));

  const [manualScale, setManualScale] = useState<number>(() => {
    const saved = localStorage.getItem('finman_zoom_scale');
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0.65 && parsed <= 1.4) {
        return parsed;
      }
    }
    return 1.0;
  });

  const [activeScale, setActiveScale] = useState<number>(1.0);

  // Áp dụng CSS zoom trực tiếp lên documentElement
  const applyZoom = useCallback((scale: number) => {
    try {
      const docEl = document.documentElement;
      (docEl.style as any).zoom = String(scale);
    } catch (e) {
      console.warn('Could not apply CSS zoom:', e);
    }
  }, []);

  // Cập nhật scale khi mode, kích thước màn hình hoặc manualScale thay đổi
  useEffect(() => {
    let target = 1.0;
    if (zoomMode === 'auto') {
      target = calculateOptimalScale(screenDimensions.width, screenDimensions.height);
    } else {
      target = manualScale;
    }
    setActiveScale(target);
    applyZoom(target);
  }, [zoomMode, screenDimensions, manualScale, applyZoom]);

  // Lắng nghe sự kiện di chuyển qua lại giữa 2 màn hình hoặc resize cửa sổ
  useEffect(() => {
    let timeoutId: any = null;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setScreenDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
          dpr: window.devicePixelRatio || 1,
        });
      }, 60);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const setZoomMode = (mode: ZoomMode) => {
    setZoomModeState(mode);
    localStorage.setItem('finman_zoom_mode', mode);
  };

  const setZoomScale = (scale: number) => {
    const clamped = Math.round(Math.min(Math.max(scale, 0.65), 1.4) * 100) / 100;
    setManualScale(clamped);
    setZoomModeState('manual');
    localStorage.setItem('finman_zoom_mode', 'manual');
    localStorage.setItem('finman_zoom_scale', String(clamped));
  };

  const increaseZoom = () => {
    setZoomScale(Math.min(activeScale + 0.05, 1.4));
  };

  const decreaseZoom = () => {
    setZoomScale(Math.max(activeScale - 0.05, 0.65));
  };

  const resetZoom = () => {
    setZoomMode('auto');
    setManualScale(1.0);
    localStorage.removeItem('finman_zoom_scale');
  };

  const formattedPercent = `${Math.round(activeScale * 100)}%`;

  return (
    <ScreenZoomContext.Provider
      value={{
        zoomScale: activeScale,
        zoomMode,
        screenDimensions,
        setZoomMode,
        setZoomScale,
        increaseZoom,
        decreaseZoom,
        resetZoom,
        formattedPercent,
      }}
    >
      {children}
    </ScreenZoomContext.Provider>
  );
};

export const useScreenZoom = (): ScreenZoomContextType => {
  const context = useContext(ScreenZoomContext);
  if (!context) {
    throw new Error('useScreenZoom must be used within a ScreenZoomProvider');
  }
  return context;
};
