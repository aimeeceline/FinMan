-- ====================================================================
-- Migration: V5__market_intelligence.sql
-- Description: Khởi tạo bảng dữ liệu thị trường chứng khoán (Market Indices, Stocks, Price History, User Watchlists)
-- Author: FinMan Dev Team
-- ====================================================================

-- 1. Bảng lưu trữ chỉ số thị trường (VN-Index, HNX-Index, VN30, UPCoM)
CREATE TABLE IF NOT EXISTS market_indices (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,                  -- 'VNINDEX', 'HNX', 'VN30', 'UPCOM'
    name VARCHAR(100) NOT NULL,                        -- 'VN-Index', 'HNX-Index', 'VN30-Index'
    description VARCHAR(255),                          -- Mô tả ngắn về chỉ số
    current_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,-- Điểm số hiện tại (VD: 1285.50)
    change_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00, -- Biến động điểm (+8.45 hoặc -4.20)
    percent_change NUMERIC(6, 2) NOT NULL DEFAULT 0.00,-- Biến động % (+0.66%)
    trading_volume BIGINT DEFAULT 0,                   -- Tổng khối lượng giao dịch (cổ phiếu)
    trading_value BIGINT DEFAULT 0,                    -- Tổng giá trị giao dịch (VND)
    session_status VARCHAR(20) DEFAULT 'CLOSED',       -- 'OPEN', 'CLOSED', 'INTERMISSION'
    last_updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_market_indices_code ON market_indices(code);

-- 2. Bảng lưu trữ thông tin mã cổ phiếu niêm yết (Master Stock Symbols)
-- Giá được lưu dưới dạng BIGINT VND nguyên vẹn (VD: 138,500 VND lưu là 138500)
CREATE TABLE IF NOT EXISTS stock_symbols (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL UNIQUE,                -- 'FPT', 'VCB', 'HPG', 'SSI', 'MWG'
    company_name VARCHAR(255) NOT NULL,                -- 'Công ty Cổ phần FPT'
    exchange VARCHAR(20) NOT NULL,                     -- 'HOSE', 'HNX', 'UPCOM'
    sector VARCHAR(100),                               -- 'Công nghệ', 'Ngân hàng', 'Thép'
    current_price BIGINT NOT NULL DEFAULT 0,           -- Giá khớp hiện tại (VND nguyên vẹn)
    change_price BIGINT NOT NULL DEFAULT 0,            -- Biến động giá (VND)
    percent_change NUMERIC(6, 2) NOT NULL DEFAULT 0.00,-- Biến động % (+3.20%)
    reference_price BIGINT DEFAULT 0,                  -- Giá tham chiếu (VND)
    ceiling_price BIGINT DEFAULT 0,                    -- Giá trần (VND)
    floor_price BIGINT DEFAULT 0,                      -- Giá sàn (VND)
    open_price BIGINT DEFAULT 0,                       -- Giá mở cửa (VND)
    high_price BIGINT DEFAULT 0,                       -- Giá cao nhất phiên (VND)
    low_price BIGINT DEFAULT 0,                        -- Giá thấp nhất phiên (VND)
    total_volume BIGINT DEFAULT 0,                     -- Khối lượng khớp lệnh trong ngày
    total_value BIGINT DEFAULT 0,                      -- Giá trị giao dịch trong ngày (VND)
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_symbols_symbol ON stock_symbols(symbol);
CREATE INDEX IF NOT EXISTS idx_stock_symbols_exchange ON stock_symbols(exchange);
CREATE INDEX IF NOT EXISTS idx_stock_symbols_sector ON stock_symbols(sector);

-- 3. Bảng lưu lịch sử giá chốt phiên cuối ngày (End-Of-Day Stock Price History)
CREATE TABLE IF NOT EXISTS stock_price_history (
    id BIGSERIAL PRIMARY KEY,
    symbol_id BIGINT NOT NULL REFERENCES stock_symbols(id) ON DELETE CASCADE,
    trade_date DATE NOT NULL,                          -- Ngày giao dịch (YYYY-MM-DD)
    open_price BIGINT NOT NULL,                        -- Giá mở cửa (VND)
    high_price BIGINT NOT NULL,                        -- Giá cao nhất (VND)
    low_price BIGINT NOT NULL,                         -- Giá thấp nhất (VND)
    close_price BIGINT NOT NULL,                       -- Giá đóng cửa (VND)
    change_price BIGINT DEFAULT 0,                     -- Biến động giá (VND)
    percent_change NUMERIC(6, 2) DEFAULT 0.00,         -- Biến động %
    volume BIGINT DEFAULT 0,                           -- Khối lượng khớp lệnh
    total_value BIGINT DEFAULT 0,                      -- Giá trị giao dịch (VND)
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_stock_history_symbol_date UNIQUE (symbol_id, trade_date)
);

CREATE INDEX IF NOT EXISTS idx_stock_price_history_symbol_date ON stock_price_history(symbol_id, trade_date DESC);

-- 4. Bảng danh sách cổ phiếu theo dõi cá nhân (User Stock Watchlists)
CREATE TABLE IF NOT EXISTS user_watchlists (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol_id BIGINT NOT NULL REFERENCES stock_symbols(id) ON DELETE CASCADE,
    note VARCHAR(255),                                 -- Ghi chú của user (VD: "Chờ chỉnh mua thêm")
    target_price BIGINT,                               -- Giá mục tiêu kỳ vọng (VND)
    alert_enabled BOOLEAN NOT NULL DEFAULT FALSE,      -- Bật thông báo biến động giá
    display_order INT NOT NULL DEFAULT 0,              -- Thứ tự hiển thị ưu tiên
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_watchlists_user_symbol UNIQUE (user_id, symbol_id)
);

CREATE INDEX IF NOT EXISTS idx_user_watchlists_user ON user_watchlists(user_id, display_order ASC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_watchlists_symbol ON user_watchlists(symbol_id);

-- 5. Seed dữ liệu ban đầu cho các chỉ số thị trường chính
INSERT INTO market_indices (code, name, description, current_value, change_value, percent_change, trading_volume, trading_value, session_status)
VALUES
    ('VNINDEX', 'VN-Index', 'Chỉ số chứng khoán sàn HOSE', 1285.50, 8.45, 0.66, 680500000, 17520000000000, 'CLOSED'),
    ('HNX', 'HNX-Index', 'Chỉ số chứng khoán sàn HNX', 234.20, 1.15, 0.49, 82400000, 1650000000000, 'CLOSED'),
    ('VN30', 'VN30-Index', 'Chỉ số 30 cổ phiếu vốn hóa lớn HOSE', 1342.80, 11.20, 0.84, 285400000, 9420000000000, 'CLOSED'),
    ('UPCOM', 'UPCoM-Index', 'Chỉ số thị trường đăng ký giao dịch UPCoM', 92.40, -0.15, -0.16, 45200000, 680000000000, 'CLOSED')
ON CONFLICT (code) DO NOTHING;

-- 6. Seed dữ liệu ban đầu cho các mã cổ phiếu đầu ngành tiêu biểu
INSERT INTO stock_symbols (symbol, company_name, exchange, sector, current_price, change_price, percent_change, reference_price, ceiling_price, floor_price, open_price, high_price, low_price, total_volume, total_value)
VALUES
    ('FPT', 'Công ty Cổ phần FPT', 'HOSE', 'Công nghệ', 138500, 4300, 3.20, 134200, 143500, 124900, 135000, 139000, 134800, 4520000, 622450000000),
    ('VCB', 'Ngân hàng TMCP Ngoại thương Việt Nam', 'HOSE', 'Ngân hàng', 94200, 1100, 1.18, 93100, 99600, 86600, 93500, 94500, 93200, 1850000, 174080000000),
    ('HPG', 'Công ty Cổ phần Tập đoàn Hòa Phát', 'HOSE', 'Thép & Vật liệu', 28400, 650, 2.34, 27750, 29650, 25850, 27900, 28600, 27800, 24500000, 693350000000),
    ('SSI', 'Công ty Cổ phần Chứng khoán SSI', 'HOSE', 'Tài chính - Chứng khoán', 32800, 600, 1.86, 32200, 34450, 29950, 32400, 33100, 32300, 15400000, 505120000000),
    ('MWG', 'Công ty Cổ phần Đầu tư Thế Giới Di Động', 'HOSE', 'Bán lẻ', 66200, -500, -0.75, 66700, 71300, 62100, 66800, 67200, 65900, 6800000, 451520000000),
    ('TCB', 'Ngân hàng TMCP Kỹ Thương Việt Nam', 'HOSE', 'Ngân hàng', 24800, 400, 1.64, 24400, 26100, 22700, 24500, 25000, 24450, 18900000, 468720000000),
    ('MBB', 'Ngân hàng TMCP Quân Đội', 'HOSE', 'Ngân hàng', 25600, 350, 1.39, 25250, 27000, 23500, 25300, 25800, 25200, 16200000, 413100000000),
    ('VHM', 'Công ty Cổ phần Vinhomes', 'HOSE', 'Bất động sản', 42500, -300, -0.70, 42800, 45750, 39850, 43000, 43200, 42300, 8900000, 378250000000)
ON CONFLICT (symbol) DO NOTHING;

