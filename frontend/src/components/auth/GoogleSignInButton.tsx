import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with';
              shape?: 'rectangular' | 'pill' | 'circle';
              logo_alignment?: 'left' | 'center';
              width?: number | string;
              locale?: string;
            }
          ) => void;
          prompt: (momentListener?: (moment: any) => void) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '985373734063-qnaa9b0gh7hotm83ir996kqutav885t5.apps.googleusercontent.com';

interface GoogleSignInButtonProps {
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  onError?: (msg: string) => void;
  className?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  text = 'continue_with',
  onError,
  className = '',
}) => {
  const { loginWithGoogle } = useAuth();
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    let checkInterval: ReturnType<typeof setInterval> | null = null;

    const initGoogleIdentity = () => {
      if (!window.google?.accounts?.id || !buttonContainerRef.current) {
        return false;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: { credential: string }) => {
            if (!response.credential) {
              if (onError) onError('Không nhận được mã xác thực bảo mật từ Google.');
              return;
            }

            setIsAuthenticating(true);
            try {
              const res = await loginWithGoogle({ idToken: response.credential });
              if (!res.success && onError) {
                onError(res.message || 'Xác thực tài khoản Google không thành công.');
              }
            } catch {
              if (onError) onError('Đã có lỗi kết nối tới máy chủ FinMan.');
            } finally {
              setIsAuthenticating(false);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Clear previous button elements if any
        buttonContainerRef.current.innerHTML = '';

        // Render official Google button
        window.google.accounts.id.renderButton(buttonContainerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text,
          shape: 'rectangular',
          logo_alignment: 'left',
          width: buttonContainerRef.current.offsetWidth || 380,
          locale: 'vi',
        });

        // Trigger Google One Tap if available
        window.google.accounts.id.prompt();

        setIsReady(true);
        return true;
      } catch (err) {
        console.error('Lỗi khởi tạo Google Identity Services:', err);
        return false;
      }
    };

    // Try initializing immediately
    if (!initGoogleIdentity()) {
      // Poll every 200ms up to 5 seconds
      let attempts = 0;
      checkInterval = setInterval(() => {
        attempts++;
        if (initGoogleIdentity() || attempts > 25) {
          if (checkInterval) clearInterval(checkInterval);
        }
      }, 200);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [text, loginWithGoogle, onError]);

  return (
    <div className={`w-full flex flex-col items-center justify-center relative ${className}`}>
      {/* Target container rendered by Google GIS */}
      <div
        ref={buttonContainerRef}
        className="w-full flex justify-center min-h-[44px]"
        style={{ minHeight: '44px' }}
      />

      {/* Loading Skeleton if Google script is still initializing */}
      {!isReady && (
        <div className="w-full h-12 rounded-xl bg-surface-container-low animate-pulse flex items-center justify-center gap-3 border border-outline-variant/30 text-xs text-on-surface-variant">
          <div className="w-5 h-5 rounded-full bg-surface-container-high"></div>
          <span>Đang kết nối Google Identity...</span>
        </div>
      )}

      {/* Authenticating overlay */}
      {isAuthenticating && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center gap-2 z-10">
          <span className="material-symbols-outlined animate-spin text-primary text-[20px]">
            progress_activity
          </span>
          <span className="text-xs font-bold text-on-surface">Đang xác thực với Google...</span>
        </div>
      )}
    </div>
  );
};
