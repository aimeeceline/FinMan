-- ====================================================================
-- Migration: V4__ai_conversations.sql
-- Description: Khởi tạo bảng lưu trữ lịch sử hội thoại AI và dẫn nguồn bài báo (AI Citations)
-- Author: FinMan Dev Team
-- ====================================================================

-- 1. Bảng lưu trữ phiên trò chuyện của người dùng với FinMan AI
CREATE TABLE IF NOT EXISTS ai_conversations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'Cuộc trò chuyện mới',
    model_version VARCHAR(50) NOT NULL DEFAULT 'gemini-2.5-flash',
    context_metadata TEXT,                              -- JSON lưu thông tin ngữ cảnh nạp sẵn (ví dụ: mục tiêu, tài khoản)
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,           -- Đánh dấu ghim lên đầu danh sách hội thoại
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,         -- Đánh dấu lưu trữ ẩn
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_pinned ON ai_conversations (user_id, is_pinned, updated_at DESC);

-- 2. Bảng lưu từng tin nhắn trong phiên hội thoại (User prompt & AI response)
CREATE TABLE IF NOT EXISTS ai_messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,                          -- 'USER', 'ASSISTANT', 'SYSTEM'
    content TEXT NOT NULL,                              -- Nội dung phản hồi hiển thị cho người dùng
    raw_prompt TEXT,                                    -- Prompt đầy đủ kèm ngữ cảnh gửi đến Gemini (dùng cho audit)
    tokens_used INT DEFAULT 0,                          -- Số lượng token ước tính
    has_citations BOOLEAN NOT NULL DEFAULT FALSE,       -- Có trích dẫn nguồn bài báo hay không
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_ai_messages_role CHECK (role IN ('USER', 'ASSISTANT', 'SYSTEM'))
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages (conversation_id, created_at ASC);

-- 3. Bảng lưu nguồn tin tức trích dẫn cho từng phát biểu của AI (Citations & Sources)
CREATE TABLE IF NOT EXISTS ai_message_sources (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT NOT NULL REFERENCES ai_messages(id) ON DELETE CASCADE,
    article_id BIGINT REFERENCES news_articles(id) ON DELETE SET NULL,
    citation_index INT NOT NULL DEFAULT 1,              -- Chỉ số đánh dấu trong văn bản [1], [2]
    source_title VARCHAR(500) NOT NULL,                 -- Tiêu đề bài báo được trích dẫn
    source_url VARCHAR(1000),                           -- Đường dẫn bài viết gốc
    source_name VARCHAR(100),                           -- Tên báo (VnExpress, CafeF, VnEconomy...)
    snippet TEXT,                                       -- Đoạn trích dẫn hoặc tóm tắt ý chính từ bài báo
    relevance_score NUMERIC(5, 4),                      -- Điểm số mức độ liên quan (0.0000 - 1.0000)
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_message_sources_message ON ai_message_sources (message_id, citation_index);
CREATE INDEX IF NOT EXISTS idx_ai_message_sources_article ON ai_message_sources (article_id);

