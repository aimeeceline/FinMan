-- ====================================================================
-- Migration: V3__news_ai_summaries.sql
-- Description: Khởi tạo bảng lưu trữ cache vĩnh viễn kết quả phân tích AI cho bài báo
-- Author: FinMan Dev Team
-- ====================================================================

CREATE TABLE IF NOT EXISTS news_summaries (
    id BIGSERIAL PRIMARY KEY,
    article_id BIGINT NOT NULL UNIQUE REFERENCES news_articles(id) ON DELETE CASCADE,
    bullet_points TEXT NOT NULL,               -- Chuỗi JSON mảng 3 ý tóm tắt ["Ý 1", "Ý 2", "Ý 3"]
    sentiment VARCHAR(20) NOT NULL,            -- 'POSITIVE', 'NEGATIVE', 'NEUTRAL'
    sentiment_reason TEXT NOT NULL,            -- Giải thích căn cứ phân loại sắc thái của AI
    impact_analysis TEXT,                      -- Phân tích đối tượng hưởng lợi / chịu rủi ro
    related_tickers VARCHAR(255),              -- Mã cổ phiếu liên quan phân tách dấu phẩy: 'VCB,FPT,HPG'
    tags VARCHAR(255),                         -- Nhãn chủ đề: '#laisuat,#nganhang'
    model_version VARCHAR(50) NOT NULL DEFAULT 'gemini-2.5-flash',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_news_summaries_sentiment CHECK (sentiment IN ('POSITIVE', 'NEGATIVE', 'NEUTRAL'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_news_summaries_article_id ON news_summaries (article_id);
CREATE INDEX IF NOT EXISTS idx_news_summaries_sentiment ON news_summaries (sentiment, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_summaries_tickers ON news_summaries (related_tickers);

