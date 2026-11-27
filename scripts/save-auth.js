const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const AUTH_FILE = path.resolve(__dirname, '../auth.json');
const TARGET_URL = 'https://fin-man-nine.vercel.app';

async function saveAuth() {
  console.log('========================================================');
  console.log('🔑 FINMAN - LƯU PHIÊN ĐĂNG NHẬP GOOGLE VÀO AUTH.JSON');
  console.log('========================================================');
  console.log('🚀 Đang mở trình duyệt Google Chrome...');
  console.log('👉 Vui lòng click "Tiếp tục với Google" và đăng nhập bằng tài khoản lelananh02.');
  console.log('⏳ Hệ thống sẽ tự động bắt lấy JWT token và lưu vào auth.json ngay khi bạn vào Dashboard...\n');

  let browser;
  try {
    browser = await chromium.launch({
      headless: false,
      channel: 'chrome',
      args: ['--disable-blink-features=AutomationControlled'],
    });
  } catch (err) {
    console.log('⚠️ Không khởi chạy được Chrome trực tiếp, chuyển sang Chromium mặc định...');
    browser = await chromium.launch({
      headless: false,
      args: ['--disable-blink-features=AutomationControlled'],
    });
  }

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();
  await page.goto(TARGET_URL);

  try {
    page.setDefaultTimeout(600000); // Cho phép tối đa 10 phút để người dùng đăng nhập và xác thực 2FA

    // Đợi cho đến khi user đăng nhập thành công và localStorage có finman_token
    await page.waitForFunction(() => {
      const token = localStorage.getItem('finman_token');
      const user = localStorage.getItem('finman_user');
      return !!token && !!user;
    }, null, { timeout: 600000, polling: 1000 });

    console.log('✅ Đã phát hiện phiên đăng nhập thành công!');
    
    // Đợi thêm 1s để app ổn định và các storage khác ghi nhận
    await page.waitForTimeout(1000);

    await context.storageState({ path: AUTH_FILE });

    const raw = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
    const origin = raw.origins?.find(o => o.origin.includes('fin-man-nine.vercel.app')) || raw.origins?.[0];
    const userItem = origin?.localStorage?.find(item => item.name === 'finman_user');
    const userInfo = userItem ? JSON.parse(userItem.value) : null;

    console.log('🎉 LƯU PHIÊN THÀNH CÔNG VÀO FILE: auth.json');
    if (userInfo) {
      console.log(`👤 Tài khoản: ${userInfo.fullName} (${userInfo.email})`);
    }
    console.log('========================================================\n');
  } catch (err) {
    console.error('❌ Hết thời gian chờ hoặc xảy ra lỗi trong quá trình đăng nhập:', err.message);
  } finally {
    await browser.close();
  }
}

saveAuth();
