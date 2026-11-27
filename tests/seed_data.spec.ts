import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('Seed Data: 5 Tài Khoản & 50 Giao Dịch (7/2026 - Nay)', () => {
  // Test này yêu cầu đã có phiên đăng nhập auth.json
  test.beforeAll(() => {
    if (!fs.existsSync('auth.json')) {
      throw new Error(
        '⚠️ Chưa tìm thấy file auth.json! Hãy chạy lệnh "npm run auth:save" để đăng nhập Google lelananh02 một lần trước khi chạy test này.'
      );
    }
  });

  test('Tạo 5 tài khoản và 50 giao dịch từ tháng 07/2026 đến nay', async ({ page }) => {
    test.setTimeout(180000); // 3 phút để tạo toàn bộ 50 giao dịch

    // 1. Mở ứng dụng và kiểm tra đăng nhập
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Kiểm tra xem đã đăng nhập chưa
    const token = await page.evaluate(() => localStorage.getItem('finman_token'));
    expect(token).toBeTruthy();

    const userInfo = await page.evaluate(() => {
      try {
        return JSON.parse(localStorage.getItem('finman_user') || '{}');
      } catch {
        return {};
      }
    });
    console.log(`👤 Đang thực hiện cho tài khoản: ${userInfo.fullName || userInfo.email || 'Người dùng Google'}`);

    // Lấy API base URL mà app đang dùng
    const apiBase = await page.evaluate(() => {
      // @ts-ignore
      return (window as any).__FINMAN_API_URL__ || 'https://finman-backend-8oac.onrender.com/api/v1';
    });

    console.log('📡 Đang đồng bộ 5 tài khoản và 50 giao dịch qua API...');

    // 2. Thực thi tạo 5 tài khoản và 50 giao dịch ngay trong Browser Context
    const result = await page.evaluate(async (apiBaseUrl) => {
      const jwtToken = localStorage.getItem('finman_token');
      const authHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
      };

      // Helper gọi API
      const request = async (url: string, options: any = {}) => {
        const res = await fetch(`${apiBaseUrl}${url}`, {
          ...options,
          headers: { ...authHeaders, ...(options.headers || {}) },
        });
        const json = await res.json();
        return json;
      };

      // -------------------------------------------------------------
      // BƯỚC A: ĐẢM BẢO 5 TÀI KHOẢN
      // -------------------------------------------------------------
      const accountsRes = await request('/accounts?includeArchived=false');
      let existingAccounts: any[] = accountsRes?.data?.accounts || accountsRes?.data || [];

      const targetAccounts = [
        { name: 'Ví Tiền Mặt', type: 'CASH', initialBalance: 5000000, note: 'Tiền mặt chi tiêu hàng ngày' },
        { name: 'Vietcombank Digibank', type: 'BANK', initialBalance: 35000000, accountNumber: '1012345678', note: 'Tài khoản nhận lương chính' },
        { name: 'Techcombank', type: 'BANK', initialBalance: 20000000, accountNumber: '1903456789', note: 'Tài khoản thanh toán sinh hoạt & freelance' },
        { name: 'Sổ tiết kiệm MB', type: 'SAVINGS', initialBalance: 100000000, accountNumber: 'STK-MB-8899', note: 'Khoản tích lũy tương lai' },
        { name: 'Thẻ VPBank StepUp', type: 'CREDIT_CARD', initialBalance: 0, creditLimit: 30000000, note: 'Thẻ tín dụng mua sắm & hoàn tiền' },
      ];

      const accountMap: Record<string, number> = {};

      for (const target of targetAccounts) {
        let matched = existingAccounts.find((a: any) => a.name?.trim().toLowerCase() === target.name.toLowerCase());
        if (!matched) {
          const createRes = await request('/accounts', {
            method: 'POST',
            body: JSON.stringify(target),
          });
          matched = createRes?.data;
        }
        if (matched) {
          accountMap[target.name] = matched.id;
        }
      }

      // -------------------------------------------------------------
      // BƯỚC B: LẤY DANH MỤC THU / CHI
      // -------------------------------------------------------------
      const catRes = await request('/categories');
      const categories: any[] = catRes?.data || [];
      const getCatId = (name: string, type: 'INCOME' | 'EXPENSE') => {
        const found = categories.find(
          (c) => c.type === type && c.name?.toLowerCase().includes(name.toLowerCase())
        );
        return found ? found.id : categories.find((c) => c.type === type)?.id;
      };

      // -------------------------------------------------------------
      // BƯỚC C: DANH SÁCH 50 GIAO DỊCH TỪ 07/2026 ĐẾN NAY (10/2026)
      // -------------------------------------------------------------
      const rawTransactions = [
        // Tháng 07/2026 (13 giao dịch)
        { date: '2026-07-02', type: 'EXPENSE', cat: 'Sinh hoạt', acc: 'Techcombank', amount: 4500000, note: 'Tiền thuê căn hộ tháng 7' },
        { date: '2026-07-04', type: 'EXPENSE', cat: 'Ăn uống', acc: 'Ví Tiền Mặt', amount: 150000, note: 'Cà phê Highland & ăn sáng' },
        { date: '2026-07-05', type: 'TRANSFER', acc: 'Vietcombank Digibank', toAcc: 'Ví Tiền Mặt', amount: 3000000, note: 'Rút tiền ATM chi tiêu tháng 7' },
        { date: '2026-07-07', type: 'EXPENSE', cat: 'Mua sắm', acc: 'Thẻ VPBank StepUp', amount: 950000, note: 'Siêu thị WinMart cuối tuần' },
        { date: '2026-07-10', type: 'INCOME', cat: 'Lương', acc: 'Vietcombank Digibank', amount: 25000000, note: 'Lương nhận tháng 7' },
        { date: '2026-07-11', type: 'TRANSFER', acc: 'Vietcombank Digibank', toAcc: 'Sổ tiết kiệm MB', amount: 5000000, note: 'Gửi tích lũy tháng 7' },
        { date: '2026-07-13', type: 'EXPENSE', cat: 'Giao thông', acc: 'Ví Tiền Mặt', amount: 90000, note: 'Đổ xăng xe máy' },
        { date: '2026-07-16', type: 'EXPENSE', cat: 'Sinh hoạt', acc: 'Techcombank', amount: 1100000, note: 'Hóa đơn tiền điện & Internet' },
        { date: '2026-07-18', type: 'INCOME', cat: 'Freelance', acc: 'Techcombank', amount: 4500000, note: 'Thiết kế bộ UI Landing Page' },
        { date: '2026-07-21', type: 'EXPENSE', cat: 'Ăn uống', acc: 'Ví Tiền Mặt', amount: 650000, note: 'Ăn tối liên hoan với bạn bè' },
        { date: '2026-07-24', type: 'EXPENSE', cat: 'Giải trí', acc: 'Thẻ VPBank StepUp', amount: 280000, note: 'Vé xem phim CGV cuối tuần' },
        { date: '2026-07-27', type: 'EXPENSE', cat: 'Sức khỏe', acc: 'Vietcombank Digibank', amount: 800000, note: 'Khám nha khoa định kỳ' },
        { date: '2026-07-30', type: 'EXPENSE', cat: 'Mua sắm', acc: 'Thẻ VPBank StepUp', amount: 1250000, note: 'Mua sắm áo quần Uniqlo' },

        // Tháng 08/2026 (13 giao dịch)
        { date: '2026-08-02', type: 'EXPENSE', cat: 'Sinh hoạt', acc: 'Techcombank', amount: 4500000, note: 'Tiền thuê căn hộ tháng 8' },
        { date: '2026-08-04', type: 'EXPENSE', cat: 'Ăn uống', acc: 'Ví Tiền Mặt', amount: 85000, note: 'Bún bò & cà phê sáng' },
        { date: '2026-08-05', type: 'TRANSFER', acc: 'Vietcombank Digibank', toAcc: 'Ví Tiền Mặt', amount: 2500000, note: 'Rút tiền ATM chi tiêu tháng 8' },
        { date: '2026-08-08', type: 'EXPENSE', cat: 'Mua sắm', acc: 'Thẻ VPBank StepUp', amount: 1850000, note: 'Siêu thị Aeon Mall cuối tuần' },
        { date: '2026-08-10', type: 'INCOME', cat: 'Lương', acc: 'Vietcombank Digibank', amount: 25000000, note: 'Lương nhận tháng 8' },
        { date: '2026-08-11', type: 'TRANSFER', acc: 'Vietcombank Digibank', toAcc: 'Sổ tiết kiệm MB', amount: 5000000, note: 'Gửi tích lũy tháng 8' },
        { date: '2026-08-14', type: 'EXPENSE', cat: 'Giao thông', acc: 'Ví Tiền Mặt', amount: 95000, note: 'Đổ xăng xe máy' },
        { date: '2026-08-16', type: 'EXPENSE', cat: 'Sinh hoạt', acc: 'Techcombank', amount: 1250000, note: 'Tiền điện & nước tháng 8' },
        { date: '2026-08-19', type: 'INCOME', cat: 'Freelance', acc: 'Techcombank', amount: 5000000, note: 'Tư vấn giải pháp tài chính' },
        { date: '2026-08-22', type: 'TRANSFER', acc: 'Vietcombank Digibank', toAcc: 'Thẻ VPBank StepUp', amount: 3500000, note: 'Thanh toán dư nợ thẻ VPBank' },
        { date: '2026-08-25', type: 'EXPENSE', cat: 'Giáo dục', acc: 'Vietcombank Digibank', amount: 2200000, note: 'Khóa học tiếng Anh trực tuyến' },
        { date: '2026-08-28', type: 'EXPENSE', cat: 'Ăn uống', acc: 'Thẻ VPBank StepUp', amount: 980000, note: 'Ăn tối lẩu Haidilao' },
        { date: '2026-08-31', type: 'INCOME', cat: 'Thưởng', acc: 'Vietcombank Digibank', amount: 3000000, note: 'Thưởng hoàn thành xuất sắc dự án' },

        // Tháng 09/2026 (13 giao dịch)
        { date: '2026-09-02', type: 'EXPENSE', cat: 'Sinh hoạt', acc: 'Techcombank', amount: 4500000, note: 'Tiền thuê căn hộ tháng 9' },
        { date: '2026-09-04', type: 'EXPENSE', cat: 'Ăn uống', acc: 'Ví Tiền Mặt', amount: 95000, note: 'Ăn sáng & cà phê đối tác' },
        { date: '2026-09-06', type: 'TRANSFER', acc: 'Vietcombank Digibank', toAcc: 'Ví Tiền Mặt', amount: 2000000, note: 'Rút tiền ATM tháng 9' },
        { date: '2026-09-08', type: 'EXPENSE', cat: 'Mua sắm', acc: 'Thẻ VPBank StepUp', amount: 1420000, note: 'Mua thực phẩm tại Mega Market' },
        { date: '2026-09-10', type: 'INCOME', cat: 'Lương', acc: 'Vietcombank Digibank', amount: 25000000, note: 'Lương nhận tháng 9' },
        { date: '2026-09-11', type: 'TRANSFER', acc: 'Vietcombank Digibank', toAcc: 'Sổ tiết kiệm MB', amount: 5000000, note: 'Gửi tích lũy tháng 9' },
        { date: '2026-09-14', type: 'EXPENSE', cat: 'Giao thông', acc: 'Ví Tiền Mặt', amount: 320000, note: 'Bảo dưỡng định kỳ & thay nhớt' },
        { date: '2026-09-16', type: 'EXPENSE', cat: 'Sinh hoạt', acc: 'Techcombank', amount: 1050000, note: 'Hóa đơn điện sinh hoạt' },
        { date: '2026-09-18', type: 'INCOME', cat: 'Thưởng', acc: 'Vietcombank Digibank', amount: 3000000, note: 'Thưởng Tết Trung Thu' },
        { date: '2026-09-20', type: 'EXPENSE', cat: 'Mua sắm', acc: 'Thẻ VPBank StepUp', amount: 680000, note: 'Mua đồ gia dụng nhà bếp Shopee' },
        { date: '2026-09-22', type: 'TRANSFER', acc: 'Vietcombank Digibank', toAcc: 'Thẻ VPBank StepUp', amount: 4200000, note: 'Thanh toán thẻ tín dụng tháng 9' },
        { date: '2026-09-25', type: 'INCOME', cat: 'Freelance', acc: 'Techcombank', amount: 7500000, note: 'Phí tư vấn kiến trúc hệ thống' },
        { date: '2026-09-28', type: 'EXPENSE', cat: 'Ăn uống', acc: 'Thẻ VPBank StepUp', amount: 720000, note: 'Tiệc nướng BBQ cuối tuần' },

        // Tháng 10/2026 (11 giao dịch - Đến hôm nay)
        { date: '2026-10-02', type: 'EXPENSE', cat: 'Sinh hoạt', acc: 'Techcombank', amount: 4500000, note: 'Tiền thuê căn hộ tháng 10' },
        { date: '2026-10-04', type: 'EXPENSE', cat: 'Ăn uống', acc: 'Ví Tiền Mặt', amount: 65000, note: 'Cà phê sáng văn phòng' },
        { date: '2026-10-06', type: 'TRANSFER', acc: 'Vietcombank Digibank', toAcc: 'Ví Tiền Mặt', amount: 2500000, note: 'Rút tiền ATM đầu tháng 10' },
        { date: '2026-10-08', type: 'EXPENSE', cat: 'Mua sắm', acc: 'Thẻ VPBank StepUp', amount: 920000, note: 'Siêu thị Big C cuối tuần' },
        { date: '2026-10-10', type: 'INCOME', cat: 'Lương', acc: 'Vietcombank Digibank', amount: 25000000, note: 'Lương nhận tháng 10' },
        { date: '2026-10-11', type: 'TRANSFER', acc: 'Vietcombank Digibank', toAcc: 'Sổ tiết kiệm MB', amount: 5000000, note: 'Gửi tích lũy tháng 10' },
        { date: '2026-10-14', type: 'EXPENSE', cat: 'Giao thông', acc: 'Ví Tiền Mặt', amount: 90000, note: 'Đổ xăng xe máy' },
        { date: '2026-10-16', type: 'EXPENSE', cat: 'Sinh hoạt', acc: 'Techcombank', amount: 1150000, note: 'Hóa đơn điện nước & Internet' },
        { date: '2026-10-18', type: 'EXPENSE', cat: 'Mua sắm', acc: 'Thẻ VPBank StepUp', amount: 1450000, note: 'Mua giày thể thao chạy bộ mới' },
        { date: '2026-10-20', type: 'INCOME', cat: 'Thưởng', acc: 'Vietcombank Digibank', amount: 2000000, note: 'Thưởng kỷ niệm ngày 20/10' },
        { date: '2026-10-22', type: 'EXPENSE', cat: 'Ăn uống', acc: 'Ví Tiền Mặt', amount: 120000, note: 'Cơm trưa văn phòng & trà thảo mộc' },
      ];

      let createdCount = 0;
      let errorCount = 0;

      for (const item of rawTransactions) {
        const payload: any = {
          type: item.type,
          amount: item.amount,
          transactionDate: item.date,
          note: item.note,
          accountId: accountMap[item.acc] || Object.values(accountMap)[0],
        };

        if (item.type === 'TRANSFER') {
          payload.toAccountId = accountMap[item.toAcc || 'Ví Tiền Mặt'] || Object.values(accountMap)[1];
        } else {
          payload.categoryId = getCatId(item.cat || 'Khác', item.type as any);
        }

        try {
          const res = await request('/transactions', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
          if (res?.success || res?.data?.id) {
            createdCount++;
          } else {
            errorCount++;
          }
        } catch {
          errorCount++;
        }
      }

      return {
        accountsCount: Object.keys(accountMap).length,
        accounts: accountMap,
        transactionsTotal: rawTransactions.length,
        createdCount,
        errorCount,
      };
    }, apiBase);

    console.log('📊 KẾT QUẢ TẠO DỮ LIỆU:');
    console.log(`- Tài khoản đã chuẩn bị: ${result.accountsCount}/5`);
    console.log(`- Giao dịch đã tạo thành công: ${result.createdCount}/${result.transactionsTotal}`);

    // 3. Tải lại Dashboard và kiểm tra giao diện hiển thị đầy đủ
    await page.goto('/giao-dich');
    await page.waitForLoadState('networkidle');

    // Kiểm tra main layout và thanh bên (aside)
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.getByRole('button', { name: /Thêm giao dịch/i })).toBeVisible();

    // 4. Kiểm tra trang Quản lý Tài khoản
    await page.goto('/tai-khoan-va-tai-san');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/Ví Tiền Mặt|Vietcombank|Techcombank/i).first()).toBeVisible();
  });
});
