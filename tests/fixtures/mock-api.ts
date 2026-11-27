import { Page } from '@playwright/test';

export const BACKEND_URL = 'http://localhost:8080/api/v1';

export const TEST_USER = {
  email: 'testuser_e2e@finman.com',
  password: 'password123',
  fullName: 'Test E2E User',
};

// Alias for compatibility
export const MOCK_USER = TEST_USER;

let cachedRealAuth: { token: string; user: any } | null = null;

/**
 * Lấy hoặc tạo tài khoản test thực tế trên Backend Spring Boot + PostgreSQL.
 * Hoàn toàn không dùng Mock.
 */
export async function getRealAuth() {
  if (cachedRealAuth) return cachedRealAuth;

  // 1. Thử đăng nhập với tài khoản test trên backend thật
  try {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_USER.email, password: TEST_USER.password }),
    });
    const json = (await res.json()) as any;
    if (json.success && json.data?.token) {
      cachedRealAuth = {
        token: json.data.token,
        user: json.data.user,
      };
      return cachedRealAuth;
    }
  } catch (e) {
    console.warn('Lỗi kết nối Backend login:', e);
  }

  // 2. Nếu tài khoản chưa có trong database, tự động tạo mới trên database thật
  try {
    const res = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
        fullName: TEST_USER.fullName,
      }),
    });
    const json = (await res.json()) as any;
    if (json.success && json.data?.token) {
      cachedRealAuth = {
        token: json.data.token,
        user: json.data.user,
      };
      return cachedRealAuth;
    }
  } catch (e) {
    console.error('Lỗi kết nối Backend register:', e);
  }

  throw new Error(`Không thể kết nối đến Backend thật tại ${BACKEND_URL}. Hãy đảm bảo server Spring Boot đang chạy ở cổng 8080!`);
}

/**
 * 100% Real - Không chặn hay mock bất kỳ API nào.
 * Tất cả các request HTTP đi thẳng qua Vite proxy tới Spring Boot backend.
 */
export async function setupMockApi(_page: Page) {
  // KHÔNG CÓ BẤT KỲ MOCK NÀO.
  // Mọi request đều gọi trực tiếp tới Backend Spring Boot và Database PostgreSQL.
}

/**
 * Đăng nhập thật bằng cách nạp token thật vào localStorage trước khi load trang
 */
export async function authenticateSession(page: Page, initialRoute = 'giao-dich') {
  const realAuth = await getRealAuth();

  await page.addInitScript(
    ({ user, token, route }) => {
      localStorage.setItem('finman_token', token);
      localStorage.setItem('finman_user', JSON.stringify(user));
      localStorage.setItem('finman_current_route', route);
    },
    { user: realAuth.user, token: realAuth.token, route: initialRoute }
  );
}
