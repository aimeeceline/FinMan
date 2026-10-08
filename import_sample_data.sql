-- ============================================================================
-- SCRIPT IMPORT DỮ LIỆU MẪU CHO NEON POSTGRESQL / FINMAN DATABASE
-- Hỗ trợ chạy trực tiếp trên:
-- 1. Neon Web Console (SQL Editor)
-- 2. DBeaver / DataGrip / TablePlus / pgAdmin kết nối tới Neon
-- 3. Command Line (psql "postgresql://...neon.tech/neondb" -f import_sample_data.sql)
-- ============================================================================

-- BƯỚC 1: ĐẢM BẢO CÁC BẢNG TỒN TẠI TRÊN NEON (NẾU BACKEND CHƯA TẠO)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL,
    icon VARCHAR(50),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL,
    initial_balance BIGINT NOT NULL DEFAULT 0,
    current_balance BIGINT NOT NULL DEFAULT 0,
    credit_limit BIGINT DEFAULT 0,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    account_number VARCHAR(50),
    note VARCHAR(255),
    statement_day INTEGER DEFAULT 20,
    payment_due_day INTEGER DEFAULT 5,
    payment_account_id BIGINT,
    is_auto_payment BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budgets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL,
    amount BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_budgets_user_category_month UNIQUE (user_id, category_id, month)
);

CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    to_account_id BIGINT REFERENCES accounts(id) ON DELETE SET NULL,
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL,
    amount BIGINT NOT NULL,
    transaction_date DATE NOT NULL,
    note VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Thêm các cột phục vụ tính năng Thùng rác (Recycle Bin - 15 ngày) nếu bảng đã tồn tại
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_purged_from_bin BOOLEAN DEFAULT FALSE;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_purged_from_bin BOOLEAN DEFAULT FALSE;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;



-- ============================================================================
-- BƯỚC 2: IMPORT 5 TÀI KHOẢN, 20 NGÂN SÁCH (5 MỖI THÁNG), 100 GIAO DỊCH
-- ============================================================================

DO $$
DECLARE
    -- TÙY CHỈNH: Điền email tài khoản của bạn trên Neon nếu muốn gán dữ liệu cho user đó.
    -- Để trống '' nếu muốn script tự lấy user đầu tiên hoặc tự tạo mới 'demo@finman.com'.
    v_custom_email VARCHAR(100) := '';

    v_user_id BIGINT;
    v_year VARCHAR(4);
    
    -- Account IDs
    v_acc_cash BIGINT;
    v_acc_vcb BIGINT;
    v_acc_tcb BIGINT;
    v_acc_vpbank BIGINT;
    v_acc_invest BIGINT;

    -- Category IDs
    v_cat_food BIGINT;
    v_cat_shop BIGINT;
    v_cat_living BIGINT;
    v_cat_trans BIGINT;
    v_cat_ent BIGINT;
    v_cat_health BIGINT;
    v_cat_edu BIGINT;
    v_cat_other_exp BIGINT;
    v_cat_salary BIGINT;
    v_cat_bonus BIGINT;
    v_cat_freelance BIGINT;
    v_cat_invest_inc BIGINT;

    -- Month strings
    m7 VARCHAR(7);
    m8 VARCHAR(7);
    m9 VARCHAR(7);
    m10 VARCHAR(7);
BEGIN
    -- Lấy năm hiện tại (ví dụ 2026)
    v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    m7 := v_year || '-07';
    m8 := v_year || '-08';
    m9 := v_year || '-09';
    m10 := v_year || '-10';

    RAISE NOTICE '>>> Bắt đầu import dữ liệu trên Neon cho năm %...', v_year;

    -- ------------------------------------------------------------------------
    -- 1. XÁC ĐỊNH NGƯỜI DÙNG (USER)
    -- ------------------------------------------------------------------------
    IF v_custom_email <> '' THEN
        SELECT id INTO v_user_id FROM users WHERE email = v_custom_email LIMIT 1;
    END IF;

    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM users ORDER BY id ASC LIMIT 1;
    END IF;
    
    IF v_user_id IS NULL THEN
        INSERT INTO users (email, password_hash, full_name, avatar_url, created_at, updated_at)
        VALUES (
            'demo@finman.com',
            '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', -- Password: 'password' hoặc '123456'
            'Demo User Neon',
            NULL,
            NOW(),
            NOW()
        ) RETURNING id INTO v_user_id;
        RAISE NOTICE 'Đã tạo User mới trên Neon với ID: % (demo@finman.com)', v_user_id;
    ELSE
        RAISE NOTICE 'Sử dụng User trên Neon với ID: %', v_user_id;
    END IF;

    -- ------------------------------------------------------------------------
    -- 2. ĐẢM BẢO CÁC DANH MỤC HỆ THỐNG TỒN TẠI
    -- ------------------------------------------------------------------------
    INSERT INTO categories (name, type, icon, is_default, user_id, created_at, updated_at)
    VALUES 
        ('Ăn uống', 'EXPENSE', '🍜', true, NULL, NOW(), NOW()),
        ('Áo quần', 'EXPENSE', '👕', true, NULL, NOW(), NOW()),
        ('Mua sắm', 'EXPENSE', '🛒', true, NULL, NOW(), NOW()),
        ('Giao thông', 'EXPENSE', '🚕', true, NULL, NOW(), NOW()),
        ('Giải trí', 'EXPENSE', '🎮', true, NULL, NOW(), NOW()),
        ('Sinh hoạt', 'EXPENSE', '🏠', true, NULL, NOW(), NOW()),
        ('Sức khỏe', 'EXPENSE', '💊', true, NULL, NOW(), NOW()),
        ('Giáo dục', 'EXPENSE', '📚', true, NULL, NOW(), NOW()),
        ('Chi tiêu khác', 'EXPENSE', '📦', true, NULL, NOW(), NOW()),
        ('Lương', 'INCOME', '💼', true, NULL, NOW(), NOW()),
        ('Thưởng', 'INCOME', '🎁', true, NULL, NOW(), NOW()),
        ('Đầu tư', 'INCOME', '📈', true, NULL, NOW(), NOW()),
        ('Freelance', 'INCOME', '💻', true, NULL, NOW(), NOW()),
        ('Thu nhập khác', 'INCOME', '🪙', true, NULL, NOW(), NOW())
    ON CONFLICT DO NOTHING;

    -- Lấy Category IDs cần dùng
    SELECT id INTO v_cat_food FROM categories WHERE name = 'Ăn uống' AND (user_id = v_user_id OR is_default = true) LIMIT 1;
    SELECT id INTO v_cat_shop FROM categories WHERE name = 'Mua sắm' AND (user_id = v_user_id OR is_default = true) LIMIT 1;
    SELECT id INTO v_cat_living FROM categories WHERE name = 'Sinh hoạt' AND (user_id = v_user_id OR is_default = true) LIMIT 1;
    SELECT id INTO v_cat_trans FROM categories WHERE name = 'Giao thông' AND (user_id = v_user_id OR is_default = true) LIMIT 1;
    SELECT id INTO v_cat_ent FROM categories WHERE name = 'Giải trí' AND (user_id = v_user_id OR is_default = true) LIMIT 1;
    SELECT id INTO v_cat_health FROM categories WHERE name = 'Sức khỏe' AND (user_id = v_user_id OR is_default = true) LIMIT 1;
    SELECT id INTO v_cat_edu FROM categories WHERE name = 'Giáo dục' AND (user_id = v_user_id OR is_default = true) LIMIT 1;
    SELECT id INTO v_cat_other_exp FROM categories WHERE name = 'Chi tiêu khác' AND (user_id = v_user_id OR is_default = true) LIMIT 1;

    SELECT id INTO v_cat_salary FROM categories WHERE name = 'Lương' AND (user_id = v_user_id OR is_default = true) LIMIT 1;
    SELECT id INTO v_cat_bonus FROM categories WHERE name = 'Thưởng' AND (user_id = v_user_id OR is_default = true) LIMIT 1;
    SELECT id INTO v_cat_freelance FROM categories WHERE name = 'Freelance' AND (user_id = v_user_id OR is_default = true) LIMIT 1;
    SELECT id INTO v_cat_invest_inc FROM categories WHERE name = 'Đầu tư' AND (user_id = v_user_id OR is_default = true) LIMIT 1;

    -- ------------------------------------------------------------------------
    -- 3. IMPORT 5 TÀI KHOẢN (ACCOUNTS)
    -- ------------------------------------------------------------------------
    -- Tài khoản 1: Ví Tiền Mặt
    SELECT id INTO v_acc_cash FROM accounts WHERE user_id = v_user_id AND name = 'Ví Tiền Mặt' LIMIT 1;
    IF v_acc_cash IS NULL THEN
        INSERT INTO accounts (user_id, name, type, initial_balance, current_balance, credit_limit, is_archived, account_number, note, created_at, updated_at)
        VALUES (v_user_id, 'Ví Tiền Mặt', 'CASH', 5000000, 5000000, 0, false, NULL, 'Tiền mặt chi tiêu hàng ngày', NOW(), NOW())
        RETURNING id INTO v_acc_cash;
    END IF;

    -- Tài khoản 2: Vietcombank
    SELECT id INTO v_acc_vcb FROM accounts WHERE user_id = v_user_id AND name = 'Vietcombank Digibank' LIMIT 1;
    IF v_acc_vcb IS NULL THEN
        INSERT INTO accounts (user_id, name, type, initial_balance, current_balance, credit_limit, is_archived, account_number, note, created_at, updated_at)
        VALUES (v_user_id, 'Nuôi bé Cún', 'BANK', 30000000, 30000000, 0, false, '1012345678', 'Tài khoản nhận lương chính', NOW(), NOW())
        RETURNING id INTO v_acc_vcb;
    END IF;

    -- Tài khoản 3: Techcombank
    SELECT id INTO v_acc_tcb FROM accounts WHERE user_id = v_user_id AND name = 'Techcombank' LIMIT 1;
    IF v_acc_tcb IS NULL THEN
        INSERT INTO accounts (user_id, name, type, initial_balance, current_balance, credit_limit, is_archived, account_number, note, created_at, updated_at)
        VALUES (v_user_id, 'Techcombank', 'BANK', 15000000, 15000000, 0, false, '1903456789', 'Tài khoản thanh toán phụ & freelance', NOW(), NOW())
        RETURNING id INTO v_acc_tcb;
    END IF;

    -- Tài khoản 4: Thẻ tín dụng VPBank StepUp
    SELECT id INTO v_acc_vpbank FROM accounts WHERE user_id = v_user_id AND name = 'Thẻ VPBank StepUp' LIMIT 1;
    IF v_acc_vpbank IS NULL THEN
        INSERT INTO accounts (user_id, name, type, initial_balance, current_balance, credit_limit, is_archived, account_number, note, statement_day, payment_due_day, is_auto_payment, payment_account_id, created_at, updated_at)
        VALUES (v_user_id, 'Thẻ VPBank StepUp', 'CREDIT_CARD', 0, 0, 30000000, false, '4392****8888', 'Thẻ tín dụng mua sắm & hoàn tiền', 20, 5, false, v_acc_vcb, NOW(), NOW())
        RETURNING id INTO v_acc_vpbank;
    END IF;

    -- Tài khoản 5: Quỹ đầu tư VFM
    SELECT id INTO v_acc_invest FROM accounts WHERE user_id = v_user_id AND name = 'Quỹ Đầu Tư VFM' LIMIT 1;
    IF v_acc_invest IS NULL THEN
        INSERT INTO accounts (user_id, name, type, initial_balance, current_balance, credit_limit, is_archived, account_number, note, created_at, updated_at)
        VALUES (v_user_id, 'Quỹ Đầu Tư VFM', 'INVESTMENT', 50000000, 50000000, 0, false, 'VFM-892110', 'Tích lũy tài sản dài hạn', NOW(), NOW())
        RETURNING id INTO v_acc_invest;
    END IF;

    RAISE NOTICE 'Đã tạo/kiểm tra xong 5 tài khoản.';

    -- ------------------------------------------------------------------------
    -- 4. IMPORT 5 NGÂN SÁCH TRONG MỖI THÁNG (TỪ THÁNG 07 ĐẾN THÁNG 10)
    -- ------------------------------------------------------------------------
    INSERT INTO budgets (user_id, category_id, month, amount, created_at, updated_at)
    VALUES
        -- Tháng 07
        (v_user_id, v_cat_food,   m7, 6000000, NOW(), NOW()),
        (v_user_id, v_cat_shop,   m7, 3000000, NOW(), NOW()),
        (v_user_id, v_cat_living, m7, 4500000, NOW(), NOW()),
        (v_user_id, v_cat_trans,  m7, 1500000, NOW(), NOW()),
        (v_user_id, v_cat_ent,    m7, 2000000, NOW(), NOW()),

        -- Tháng 08
        (v_user_id, v_cat_food,   m8, 6000000, NOW(), NOW()),
        (v_user_id, v_cat_shop,   m8, 3000000, NOW(), NOW()),
        (v_user_id, v_cat_living, m8, 4500000, NOW(), NOW()),
        (v_user_id, v_cat_trans,  m8, 1500000, NOW(), NOW()),
        (v_user_id, v_cat_ent,    m8, 2000000, NOW(), NOW()),

        -- Tháng 09
        (v_user_id, v_cat_food,   m9, 6500000, NOW(), NOW()),
        (v_user_id, v_cat_shop,   m9, 3500000, NOW(), NOW()),
        (v_user_id, v_cat_living, m9, 4500000, NOW(), NOW()),
        (v_user_id, v_cat_trans,  m9, 1500000, NOW(), NOW()),
        (v_user_id, v_cat_ent,    m9, 2000000, NOW(), NOW()),

        -- Tháng 10
        (v_user_id, v_cat_food,   m10, 6500000, NOW(), NOW()),
        (v_user_id, v_cat_shop,   m10, 3500000, NOW(), NOW()),
        (v_user_id, v_cat_living, m10, 4500000, NOW(), NOW()),
        (v_user_id, v_cat_trans,  m10, 1500000, NOW(), NOW()),
        (v_user_id, v_cat_ent,    m10, 2000000, NOW(), NOW())
    ON CONFLICT (user_id, category_id, month) 
    DO UPDATE SET amount = EXCLUDED.amount, updated_at = NOW();

    RAISE NOTICE 'Đã tạo xong 5 ngân sách x 4 tháng = 20 ngân sách.';

    -- ------------------------------------------------------------------------
    -- 5. IMPORT 100 GIAO DỊCH TỪ THÁNG 07 ĐẾN HIỆN TẠI (THÁNG 10)
    -- ------------------------------------------------------------------------
    INSERT INTO transactions (user_id, account_id, to_account_id, category_id, type, amount, transaction_date, note, created_at, updated_at)
    VALUES
        -- ==================== THÁNG 07 (25 GIAO DỊCH) ====================
        (v_user_id, v_acc_vcb, NULL, v_cat_salary, 'INCOME', 25000000, (v_year || '-07-01')::date, 'Lương công ty tháng 7', NOW(), NOW()),
        (v_user_id, v_acc_vcb, v_acc_cash, NULL, 'TRANSFER', 2000000, (v_year || '-07-02')::date, 'Rút tiền mặt chi tiêu tuần', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_food, 'EXPENSE', 45000, (v_year || '-07-02')::date, 'Ăn sáng phở bò tái nạm', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_food, 'EXPENSE', 65000, (v_year || '-07-03')::date, 'Cà phê Highlands cùng đồng nghiệp', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_trans, 'EXPENSE', 80000, (v_year || '-07-04')::date, 'Đổ xăng xe máy Petrolimex', NOW(), NOW()),
        (v_user_id, v_acc_vcb, NULL, v_cat_living, 'EXPENSE', 450000, (v_year || '-07-05')::date, 'Mua thực phẩm tuần WinMart', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_food, 'EXPENSE', 120000, (v_year || '-07-06')::date, 'Cơm trưa văn phòng và nước ép', NOW(), NOW()),
        (v_user_id, v_acc_tcb, NULL, v_cat_ent, 'EXPENSE', 220000, (v_year || '-07-07')::date, 'Vé xem phim CGV cuối tuần', NOW(), NOW()),
        (v_user_id, v_acc_vpbank, NULL, v_cat_shop, 'EXPENSE', 350000, (v_year || '-07-08')::date, 'Mua áo thun Uniqlo mùa hè', NOW(), NOW()),
        (v_user_id, v_acc_tcb, NULL, v_cat_freelance, 'INCOME', 3500000, (v_year || '-07-10')::date, 'Thù lao thiết kế giao diện web', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_food, 'EXPENSE', 55000, (v_year || '-07-11')::date, 'Trà sữa Koi Thé chiều muộn', NOW(), NOW()),
        (v_user_id, v_acc_vcb, NULL, v_cat_living, 'EXPENSE', 850000, (v_year || '-07-12')::date, 'Tiền điện EVN tháng 6', NOW(), NOW()),
        (v_user_id, v_acc_vcb, NULL, v_cat_living, 'EXPENSE', 140000, (v_year || '-07-13')::date, 'Tiền nước sinh hoạt căn hộ', NOW(), NOW()),
        (v_user_id, v_acc_vcb, NULL, v_cat_living, 'EXPENSE', 250000, (v_year || '-07-14')::date, 'Cước Internet cáp quang VNPT', NOW(), NOW()),
        (v_user_id, v_acc_vcb, v_acc_invest, NULL, 'TRANSFER', 5000000, (v_year || '-07-15')::date, 'Đầu tư định kỳ chứng chỉ quỹ VFM', NOW(), NOW()),
        (v_user_id, v_acc_tcb, NULL, v_cat_edu, 'EXPENSE', 180000, (v_year || '-07-16')::date, 'Sách Clean Code trên Tiki', NOW(), NOW()),
        (v_user_id, v_acc_tcb, NULL, v_cat_trans, 'EXPENSE', 50000, (v_year || '-07-17')::date, 'Grab Bike đi gặp khách hàng', NOW(), NOW()),
        (v_user_id, v_acc_vpbank, NULL, v_cat_food, 'EXPENSE', 650000, (v_year || '-07-19')::date, 'Ăn tối liên hoan nhóm bạn', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_health, 'EXPENSE', 120000, (v_year || '-07-21')::date, 'Mua thuốc cảm & vitamin C', NOW(), NOW()),
        (v_user_id, v_acc_vpbank, NULL, v_cat_shop, 'EXPENSE', 420000, (v_year || '-07-23')::date, 'Tai nghe không dây Shopee', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_food, 'EXPENSE', 70000, (v_year || '-07-25')::date, 'Bún chả phố cổ ăn trưa', NOW(), NOW()),
        (v_user_id, v_acc_tcb, NULL, v_cat_ent, 'EXPENSE', 300000, (v_year || '-07-26')::date, 'Gia hạn thẻ tập gym 1 tháng', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_trans, 'EXPENSE', 90000, (v_year || '-07-28')::date, 'Đổ xăng xe máy Petrolimex', NOW(), NOW()),
        (v_user_id, v_acc_vcb, NULL, v_cat_food, 'EXPENSE', 350000, (v_year || '-07-29')::date, 'Ăn lẩu riêu cua gia đình', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_other_exp, 'EXPENSE', 200000, (v_year || '-07-31')::date, 'Cắt tóc và gội đầu thư giãn', NOW(), NOW()),

        -- ==================== THÁNG 08 (25 GIAO DỊCH) ====================
        (v_user_id, v_acc_vcb, NULL, v_cat_salary, 'INCOME', 25000000, (v_year || '-08-01')::date, 'Lương công ty tháng 8', NOW(), NOW()),
        (v_user_id, v_acc_vcb, v_acc_cash, NULL, 'TRANSFER', 3000000, (v_year || '-08-02')::date, 'Rút tiền mặt sinh hoạt', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_food, 'EXPENSE', 50000, (v_year || '-08-02')::date, 'Ăn sáng bánh mì chảo', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_food, 'EXPENSE', 60000, (v_year || '-08-03')::date, 'Cà phê sáng The Coffee House', NOW(), NOW()),
        (v_user_id, v_acc_vcb, v_acc_vpbank, NULL, 'TRANSFER', 1420000, (v_year || '-08-04')::date, 'Thanh toán dư nợ thẻ VPBank kỳ 07', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_trans, 'EXPENSE', 95000, (v_year || '-08-05')::date, 'Đổ xăng đầy bình xe máy', NOW(), NOW()),
        (v_user_id, v_acc_vcb, NULL, v_cat_living, 'EXPENSE', 650000, (v_year || '-08-06')::date, 'Mua thực phẩm tươi sống WinMart', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_food, 'EXPENSE', 85000, (v_year || '-08-07')::date, 'Ăn trưa cơm tấm sườn trứng', NOW(), NOW()),
        (v_user_id, v_acc_tcb, NULL, v_cat_ent, 'EXPENSE', 260000, (v_year || '-08-08')::date, 'Vé xem phim IMAX CGV', NOW(), NOW()),
        (v_user_id, v_acc_vcb, NULL, v_cat_bonus, 'INCOME', 5000000, (v_year || '-08-10')::date, 'Thưởng hoàn thành xuất sắc KPI quý', NOW(), NOW()),
        (v_user_id, v_acc_vpbank, NULL, v_cat_shop, 'EXPENSE', 580000, (v_year || '-08-11')::date, 'Mua giày thể thao Biti''s Hunter', NOW(), NOW()),
        (v_user_id, v_acc_vcb, NULL, v_cat_living, 'EXPENSE', 920000, (v_year || '-08-12')::date, 'Tiền điện EVN tháng 7', NOW(), NOW()),
        (v_user_id, v_acc_vcb, NULL, v_cat_living, 'EXPENSE', 130000, (v_year || '-08-13')::date, 'Tiền nước sinh hoạt căn hộ', NOW(), NOW()),
        (v_user_id, v_acc_vcb, NULL, v_cat_living, 'EXPENSE', 250000, (v_year || '-08-14')::date, 'Cước Internet cáp quang VNPT', NOW(), NOW()),
        (v_user_id, v_acc_vcb, v_acc_invest, NULL, 'TRANSFER', 6000000, (v_year || '-08-15')::date, 'Đầu tư tích lũy định kỳ quỹ VFM', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_food, 'EXPENSE', 45000, (v_year || '-08-16')::date, 'Bánh mì pate kẹp thịt sáng', NOW(), NOW()),
        (v_user_id, v_acc_tcb, NULL, v_cat_trans, 'EXPENSE', 75000, (v_year || '-08-17')::date, 'Grab Car trời mưa to đi làm', NOW(), NOW()),
        (v_user_id, v_acc_vpbank, NULL, v_cat_food, 'EXPENSE', 780000, (v_year || '-08-19')::date, 'Ăn buffet lẩu Manwah', NOW(), NOW()),
        (v_user_id, v_acc_tcb, NULL, v_cat_health, 'EXPENSE', 150000, (v_year || '-08-20')::date, 'Khám mắt và mua nước mắt nhân tạo', NOW(), NOW()),
        (v_user_id, v_acc_tcb, NULL, v_cat_shop, 'EXPENSE', 310000, (v_year || '-08-22')::date, 'Bàn phím không dây văn phòng', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_food, 'EXPENSE', 65000, (v_year || '-08-24')::date, 'Ăn trưa bún đậu mắm tôm thập cẩm', NOW(), NOW()),
        (v_user_id, v_acc_tcb, NULL, v_cat_ent, 'EXPENSE', 260000, (v_year || '-08-25')::date, 'Gói bóng đá Ngoại Hạng Anh K+', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_trans, 'EXPENSE', 85000, (v_year || '-08-27')::date, 'Đổ xăng xe máy Petrolimex', NOW(), NOW()),
        (v_user_id, v_acc_vpbank, NULL, v_cat_other_exp, 'EXPENSE', 520000, (v_year || '-08-29')::date, 'Mua quà sinh nhật bạn thân', NOW(), NOW()),
        (v_user_id, v_acc_tcb, NULL, v_cat_freelance, 'INCOME', 2800000, (v_year || '-08-30')::date, 'Thu nhập Freelance viết content', NOW(), NOW()),

        -- ==================== THÁNG 09 (25 GIAO DỊCH) ====================
        (v_user_id, v_acc_vcb, NULL, v_cat_salary, 'INCOME', 25000000, (v_year || '-09-01')::date, 'Lương công ty tháng 9', NOW(), NOW()),
        (v_user_id, v_acc_tcb, NULL, v_cat_food, 'EXPENSE', 1200000, (v_year || '-09-02')::date, 'Liên hoan ăn uống nghỉ lễ Quốc khánh 2/9', NOW(), NOW()),
        (v_user_id, v_acc_vcb, v_acc_cash, NULL, 'TRANSFER', 3000000, (v_year || '-09-03')::date, 'Rút tiền mặt chi tiêu tuần', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_food, 'EXPENSE', 50000, (v_year || '-09-04')::date, 'Ăn sáng xôi xéo gà', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_trans, 'EXPENSE', 90000, (v_year || '-09-05')::date, 'Đổ xăng xe máy Petrolimex', NOW(), NOW()),
        (v_user_id, v_acc_vcb, NULL, v_cat_living, 'EXPENSE', 720000, (v_year || '-09-06')::date, 'Thực phẩm tuần siêu thị Co.opmart', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_food, 'EXPENSE', 70000, (v_year || '-09-07')::date, 'Cà phê muối sáng cùng bạn', NOW(), NOW()),
        (v_user_id, v_acc_vcb, v_acc_vpbank, NULL, 'TRANSFER', 1880000, (v_year || '-09-08')::date, 'Thanh toán dư nợ thẻ VPBank kỳ 08', NOW(), NOW()),
        (v_user_id, v_acc_vpbank, NULL, v_cat_shop, 'EXPENSE', 490000, (v_year || '-09-09')::date, 'Săn sale 9/9 Shopee sắm quần áo', NOW(), NOW()),
        (v_user_id, v_acc_tcb, NULL, v_cat_freelance, 'INCOME', 4200000, (v_year || '-09-10')::date, 'Thù lao Freelance phát triển API', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_food, 'EXPENSE', 75000, (v_year || '-09-11')::date, 'Ăn trưa bún chả Hà Nội', NOW(), NOW()),
        (v_user_id, v_acc_vcb, NULL, v_cat_living, 'EXPENSE', 780000, (v_year || '-09-12')::date, 'Tiền điện EVN tháng 8', NOW(), NOW()),
        (v_user_id, v_acc_vcb, NULL, v_cat_living, 'EXPENSE', 125000, (v_year || '-09-13')::date, 'Tiền nước sinh hoạt gia đình', NOW(), NOW()),
        (v_user_id, v_acc_vcb, NULL, v_cat_living, 'EXPENSE', 250000, (v_year || '-09-14')::date, 'Cước mạng Internet cáp quang VNPT', NOW(), NOW()),
        (v_user_id, v_acc_vcb, v_acc_invest, NULL, 'TRANSFER', 5000000, (v_year || '-09-15')::date, 'Gửi tích lũy quỹ đầu tư VFM', NOW(), NOW()),
        (v_user_id, v_acc_tcb, NULL, v_cat_edu, 'EXPENSE', 240000, (v_year || '-09-16')::date, 'Khóa học Spring Boot trên Udemy', NOW(), NOW()),
        (v_user_id, v_acc_tcb, NULL, v_cat_trans, 'EXPENSE', 85000, (v_year || '-09-18')::date, 'Grab Bike đi công việc ngoại thành', NOW(), NOW()),
        (v_user_id, v_acc_vpbank, NULL, v_cat_food, 'EXPENSE', 620000, (v_year || '-09-20')::date, 'Ăn tối Pizza 4P''s cùng gia đình', NOW(), NOW()),
        (v_user_id, v_acc_tcb, NULL, v_cat_health, 'EXPENSE', 180000, (v_year || '-09-21')::date, 'Chăm sóc nha khoa định kỳ', NOW(), NOW()),
        (v_user_id, v_acc_vpbank, NULL, v_cat_shop, 'EXPENSE', 320000, (v_year || '-09-22')::date, 'Hộp cơm giữ nhiệt Lock&Lock', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_food, 'EXPENSE', 55000, (v_year || '-09-24')::date, 'Trà sữa Phúc Long chiều thứ 6', NOW(), NOW()),
        (v_user_id, v_acc_tcb, NULL, v_cat_ent, 'EXPENSE', 180000, (v_year || '-09-25')::date, 'Vé xem kịch sân khấu cuối tuần', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_trans, 'EXPENSE', 90000, (v_year || '-09-27')::date, 'Đổ xăng xe máy Petrolimex', NOW(), NOW()),
        (v_user_id, v_acc_vcb, NULL, v_cat_living, 'EXPENSE', 450000, (v_year || '-09-28')::date, 'Mua thực phẩm rau củ quả tuần', NOW(), NOW()),
        (v_user_id, v_acc_tcb, NULL, v_cat_invest_inc, 'INCOME', 1200000, (v_year || '-09-30')::date, 'Cổ tức tiền mặt nhận về tài khoản', NOW(), NOW()),

        -- ==================== THÁNG 10 (25 GIAO DỊCH - ĐẾN HIỆN TẠI) ====================
        (v_user_id, v_acc_vcb, NULL, v_cat_salary, 'INCOME', 25000000, (v_year || '-10-01')::date, 'Lương công ty tháng 10', NOW(), NOW()),
        (v_user_id, v_acc_vcb, v_acc_cash, NULL, 'TRANSFER', 3000000, (v_year || '-10-01')::date, 'Rút tiền mặt chi tiêu đầu tháng 10', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_food, 'EXPENSE', 50000, (v_year || '-10-01')::date, 'Ăn sáng hủ tiếu Nam Vang', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_food, 'EXPENSE', 65000, (v_year || '-10-02')::date, 'Cà phê sáng bắt đầu tháng mới', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_trans, 'EXPENSE', 90000, (v_year || '-10-02')::date, 'Đổ xăng xe máy đầu tháng', NOW(), NOW()),
        (v_user_id, v_acc_vcb, NULL, v_cat_living, 'EXPENSE', 800000, (v_year || '-10-02')::date, 'Mua nhu yếu phẩm tháng 10 tại siêu thị', NOW(), NOW()),
        (v_user_id, v_acc_vcb, v_acc_vpbank, NULL, 'TRANSFER', 1430000, (v_year || '-10-03')::date, 'Thanh toán dư nợ thẻ VPBank kỳ 09', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_food, 'EXPENSE', 80000, (v_year || '-10-03')::date, 'Ăn trưa bún bò Huế bắp bò', NOW(), NOW()),
        (v_user_id, v_acc_tcb, NULL, v_cat_ent, 'EXPENSE', 220000, (v_year || '-10-03')::date, 'Vé xem phim CGV cuối tuần', NOW(), NOW()),
        (v_user_id, v_acc_vpbank, NULL, v_cat_shop, 'EXPENSE', 690000, (v_year || '-10-04')::date, 'Mua áo khoác mỏng thu đông Uniqlo', NOW(), NOW()),
        (v_user_id, v_acc_vcb, NULL, v_cat_bonus, 'INCOME', 3000000, (v_year || '-10-04')::date, 'Tiền thưởng dự án xuất sắc', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_food, 'EXPENSE', 55000, (v_year || '-10-04')::date, 'Cà phê trà chiều Highlands', NOW(), NOW()),
        (v_user_id, v_acc_vcb, NULL, v_cat_living, 'EXPENSE', 710000, (v_year || '-10-05')::date, 'Tiền điện EVN tháng 9', NOW(), NOW()),
        (v_user_id, v_acc_vcb, NULL, v_cat_living, 'EXPENSE', 115000, (v_year || '-10-05')::date, 'Tiền nước sinh hoạt gia đình', NOW(), NOW()),
        (v_user_id, v_acc_vcb, NULL, v_cat_living, 'EXPENSE', 250000, (v_year || '-10-05')::date, 'Cước mạng Internet VNPT tháng 10', NOW(), NOW()),
        (v_user_id, v_acc_vcb, v_acc_invest, NULL, 'TRANSFER', 5000000, (v_year || '-10-05')::date, 'Gửi tích lũy quỹ đầu tư VFM tháng 10', NOW(), NOW()),
        (v_user_id, v_acc_tcb, NULL, v_cat_edu, 'EXPENSE', 210000, (v_year || '-10-05')::date, 'Mua sách thiết kế hệ thống trên Tiki', NOW(), NOW()),
        (v_user_id, v_acc_tcb, NULL, v_cat_trans, 'EXPENSE', 60000, (v_year || '-10-06')::date, 'Grab Bike đi gặp khách hàng', NOW(), NOW()),
        (v_user_id, v_acc_vpbank, NULL, v_cat_food, 'EXPENSE', 550000, (v_year || '-10-06')::date, 'Ăn tối liên hoan đồ nướng Hàn Quốc', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_health, 'EXPENSE', 130000, (v_year || '-10-06')::date, 'Mua vitamin C tăng sức đề kháng', NOW(), NOW()),
        (v_user_id, v_acc_vpbank, NULL, v_cat_shop, 'EXPENSE', 350000, (v_year || '-10-06')::date, 'Mua kệ gia vị nhà bếp Shopee', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_food, 'EXPENSE', 45000, (v_year || '-10-07')::date, 'Ăn sáng bánh cuốn nóng chả quế', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_food, 'EXPENSE', 55000, (v_year || '-10-07')::date, 'Cà phê sữa đá sáng nay', NOW(), NOW()),
        (v_user_id, v_acc_cash, NULL, v_cat_trans, 'EXPENSE', 85000, (v_year || '-10-07')::date, 'Đổ xăng xe máy sáng nay', NOW(), NOW()),
        (v_user_id, v_acc_tcb, NULL, v_cat_freelance, 'INCOME', 1500000, (v_year || '-10-07')::date, 'Thù lao tư vấn kỹ thuật freelance', NOW(), NOW());

    RAISE NOTICE 'Đã insert thành công 100 giao dịch thực tế trên Neon!';

    -- ------------------------------------------------------------------------
    -- 6. TỰ ĐỘNG ĐỒNG BỘ LẠI SỐ DƯ HIỆN TẠI (current_balance) CHO CÁC TÀI KHOẢN
    -- ------------------------------------------------------------------------
    UPDATE accounts a
    SET current_balance = CASE
        -- Thẻ tín dụng (CREDIT_CARD): Dư nợ = Tổng chi tiêu - Tổng thanh toán
        WHEN a.type = 'CREDIT_CARD' THEN GREATEST(0, (
            COALESCE((SELECT SUM(amount) FROM transactions WHERE account_id = a.id AND type = 'EXPENSE'), 0)
            - COALESCE((SELECT SUM(amount) FROM transactions WHERE to_account_id = a.id AND type = 'TRANSFER'), 0)
        ))
        -- Tài khoản thường: Số dư = Số dư ban đầu + Thu nhập + Chuyển đến - Chi tiêu - Chuyển đi
        ELSE (
            a.initial_balance
            + COALESCE((SELECT SUM(amount) FROM transactions WHERE account_id = a.id AND type = 'INCOME'), 0)
            + COALESCE((SELECT SUM(amount) FROM transactions WHERE to_account_id = a.id AND type = 'TRANSFER'), 0)
            - COALESCE((SELECT SUM(amount) FROM transactions WHERE account_id = a.id AND type = 'EXPENSE'), 0)
            - COALESCE((SELECT SUM(amount) FROM transactions WHERE account_id = a.id AND type = 'TRANSFER'), 0)
        )
    END,
    updated_at = NOW()
    WHERE a.user_id = v_user_id;

    RAISE NOTICE '>>> HOÀN TẤT! Đã đồng bộ số dư cho 5 tài khoản trên Neon của User ID %!', v_user_id;
END $$;
