import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '985373734063-qnaa9b0gh7hotm83ir996kqutav885t5.apps.googleusercontent.com';

interface GoogleSignInButtonProps {
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  onError?: (msg: string) => void;
  className?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = React.memo(({
  text = 'continue_with',
  onError,
  className = '',
}) => {
  const { loginWithGoogle } = useAuth();
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Keep latest callbacks in refs so changes don't re-trigger initialization
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const loginWithGoogleRef = useRef(loginWithGoogle);
  loginWithGoogleRef.current = loginWithGoogle;

  const isRenderedRef = useRef(false);

  useEffect(() => {
    isRenderedRef.current = false;
    let checkInterval: ReturnType<typeof setInterval> | null = null;
    let isCancelled = false;

    const initGoogleIdentity = () => {
      if (!window.google?.accounts?.id || !buttonContainerRef.current) {
        return false;
      }

      // If already rendered into this container, do not wipe innerHTML or re-create iframe
      if (isRenderedRef.current) {
        return true;
      }

      const savedEmail = localStorage.getItem('finman_last_google_email') || '';

      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          login_hint: savedEmail || undefined,
          callback: async (response: { credential: string }) => {
            if (!response.credential) {
              if (onErrorRef.current) onErrorRef.current('Không nhận được mã xác thực bảo mật từ Google.');
              return;
            }

            setIsAuthenticating(true);
            try {
              const res = await loginWithGoogleRef.current({ idToken: response.credential });
              if (!res.success && onErrorRef.current) {
                onErrorRef.current(res.message || 'Xác thực tài khoản Google không thành công.');
              }
            } catch {
              if (onErrorRef.current) onErrorRef.current('Đã có lỗi kết nối tới máy chủ FinMan.');
            } finally {
              setIsAuthenticating(false);
            }
          },
          auto_select: true,
          cancel_on_tap_outside: true,
          context: 'signin',
          itp_support: true,
          use_fedcm_for_prompt: true,
        });

        if (buttonContainerRef.current) {
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

          isRenderedRef.current = true;
        }

        // Trigger Google One Tap if available
        window.google.accounts.id.prompt();

        if (!isCancelled) {
          setIsReady(true);
        }
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
      isCancelled = true;
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [text]);

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
});
