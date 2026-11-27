-- ====================================================================
-- Migration: V6__daily_intelligence.sql
-- Description: Khởi tạo bảng lưu trữ Bản tin tài chính sáng (Daily Intelligence Digests)
-- Author: FinMan Dev Team
-- ====================================================================

CREATE TABLE IF NOT EXISTS daily_digests (
    id BIGSERIAL PRIMARY KEY,
    digest_date DATE NOT NULL UNIQUE,
    ai_macro_summary TEXT NOT NULL,
    market_pulse_json TEXT NOT NULL,
    top_headlines_json TEXT NOT NULL,
    key_takeaways_json TEXT,
    suggested_prompts_json TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'READY',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_digests_date ON daily_digests(digest_date);
