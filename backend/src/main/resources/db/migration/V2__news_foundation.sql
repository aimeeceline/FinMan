-- ====================================================================
-- Migration: V2__news_foundation.sql
-- Description: Khởi tạo 4 bảng cho phân hệ Tin Tức Tài Chính (News Module)
-- Author: FinMan Dev Team
-- ====================================================================

-- 1. Bảng danh mục nguồn tin tức
CREATE TABLE IF NOT EXISTS news_sources (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    base_url VARCHAR(255) NOT NULL,
    rss_url VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng danh mục phân loại tin tức tài chính
CREATE TABLE IF NOT EXISTS news_categories (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name_vi VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng lưu trữ bài viết tin tức
CREATE TABLE IF NOT EXISTS news_articles (
    id BIGSERIAL PRIMARY KEY,
    source_id BIGINT NOT NULL REFERENCES news_sources(id),
    category_id BIGINT NOT NULL REFERENCES news_categories(id),
    title VARCHAR(500) NOT NULL,
    title_hash VARCHAR(64) NOT NULL UNIQUE,
    description TEXT,
    content_snippet TEXT,
    original_url VARCHAR(1000) NOT NULL,
    thumbnail_url VARCHAR(1000),
    author VARCHAR(100),
    published_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    fetched_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_ai_processed BOOLEAN NOT NULL DEFAULT FALSE
);

-- Các Index tối ưu hiệu năng truy vấn cho news_articles
CREATE INDEX IF NOT EXISTS idx_news_articles_published ON news_articles (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON news_articles (category_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_source ON news_articles (source_id, published_at DESC);

-- GIN Index phục vụ Full-Text Search trên Tiêu đề và Mô tả bài viết (cho PostgreSQL)
-- Lưu ý: Sử dụng block DO để kiểm tra an toàn hoặc tạo index nếu là PostgreSQL
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_news_articles_fts'
    ) THEN
        CREATE INDEX idx_news_articles_fts ON news_articles 
        USING gin(to_tsvector('simple', title || ' ' || COALESCE(description, '')));
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Bỏ qua nếu chạy trên dialect không hỗ trợ to_tsvector trực tiếp
        NULL;
END $$;

-- 4. Bảng lưu bài viết của người dùng (User Saved Articles)
CREATE TABLE IF NOT EXISTS user_saved_articles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id BIGINT NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
    saved_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_saved_article UNIQUE (user_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_user_saved_articles_user ON user_saved_articles (user_id, saved_at DESC);

-- 5. Seed dữ liệu mặc định ban đầu cho news_sources
INSERT INTO news_sources (code, name, base_url, rss_url, is_active)
VALUES 
    ('VNEXPRESS', 'VnExpress Kinh Doanh', 'https://vnexpress.net/kinh-doanh', 'https://vnexpress.net/rss/kinh-doanh.rss', true),
    ('CAFEF', 'CafeF', 'https://cafef.vn', 'https://cafef.vn/tai-chinh-ngan-hang.rss', true),
    ('VIETSTOCK', 'Vietstock', 'https://vietstock.vn', 'https://vietstock.vn/rss/tai-chinh.rss', true),
    ('NEWSAPI', 'NewsAPI Global', 'https://newsapi.org', NULL, true)
ON CONFLICT (code) DO NOTHING;

-- 6. Seed dữ liệu mặc định ban đầu cho news_categories
INSERT INTO news_categories (code, name_vi, description, display_order)
VALUES 
    ('STOCK', 'Chứng khoán', 'Tin tức thị trường chứng khoán, doanh nghiệp niêm yết, báo cáo tài chính', 1),
    ('MACRO', 'Kinh tế vĩ mô', 'Tin tức kinh tế vĩ mô, GDP, CPI, lạm phát, chính sách tiền tệ', 2),
    ('BANKING', 'Ngân hàng & Lãi suất', 'Thông tin hệ thống ngân hàng, lãi suất tiền gửi, lãi suất vay', 3),
    ('INVESTMENT', 'Đầu tư', 'Thị trường bất động sản, vàng, ngoại hối, kênh đầu tư tài sản', 4),
    ('PERSONAL_FINANCE', 'Tài chính cá nhân', 'Kiến thức chi tiêu, tiết kiệm, thuế, quản lý tài chính gia đình', 5)
ON CONFLICT (code) DO NOTHING;

