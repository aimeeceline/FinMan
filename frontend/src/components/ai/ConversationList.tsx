import React, { useState } from 'react';
import type { AiConversation } from '../../services/aiChatService';

interface ConversationListProps {
  conversations: AiConversation[];
  activeConversationId: number | null;
  onSelectConversation: (id: number) => void;
  onNewConversation: () => void;
  onTogglePin: (id: number) => void;
  onDeleteConversation: (id: number) => void;
  isLoading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onTogglePin,
  onDeleteConversation,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pinnedConversations = filtered.filter((c) => c.isPinned);
  const otherConversations = filtered.filter((c) => !c.isPinned);

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffHours < 1) return 'Vừa xong';
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffHours < 48) return 'Hôm qua';
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } catch {
      return '';
    }
  };

  const renderItem = (c: AiConversation) => {
    const isActive = activeConversationId === c.id;

    return (
      <div
        key={c.id}
        onClick={() => onSelectConversation(c.id)}
        className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 text-left ${
          isActive
            ? 'bg-emerald-500/10 text-emerald-950 dark:text-emerald-300 border border-emerald-500/30 shadow-xs'
            : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-transparent'
        }`}
      >
        <div className="flex items-start gap-2.5 min-w-0 pr-14">
          <span
            className={`material-symbols-outlined text-[18px] shrink-0 mt-0.5 ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
            }`}
          >
            {c.isPinned ? 'push_pin' : 'chat_bubble'}
          </span>
          <div className="min-w-0">
            <h4
              className={`text-xs font-semibold truncate ${
                isActive ? 'text-emerald-950 dark:text-white' : 'text-slate-800 dark:text-slate-200'
              }`}
            >
              {c.title}
            </h4>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
              {formatTime(c.updatedAt || c.createdAt)}
            </span>
          </div>
        </div>

        {/* Hover action buttons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-900/90 py-1 px-1.5 rounded-lg shadow-xs">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(c.id);
            }}
            className={`p-1 rounded-md text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              c.isPinned ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'
            }`}
            title={c.isPinned ? 'Bỏ ghim' : 'Ghim hội thoại'}
          >
            <span className="material-symbols-outlined text-[14px]">
              {c.isPinned ? 'keep_off' : 'push_pin'}
            </span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Bạn có chắc muốn xóa cuộc trò chuyện này?')) {
                onDeleteConversation(c.id);
              }
            }}
            className="p-1 rounded-md text-xs text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            title="Xóa cuộc trò chuyện"
          >
            <span className="material-symbols-outlined text-[14px]">delete</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50/70 dark:bg-slate-900/40 border-r border-slate-200 dark:border-slate-800/80">
      {/* Top action bar */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
        <button
          type="button"
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-xs shadow-sm hover:shadow active:scale-[0.99] transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add_comment</span>
          <span>Cuộc trò chuyện mới</span>
        </button>

        {/* Search filter */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-slate-400">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm phiên trò chuyện..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Conversation list area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {isLoading ? (
          <div className="p-4 text-center text-xs text-slate-400 space-y-2">
            <span className="material-symbols-outlined text-xl animate-spin text-emerald-500">
              progress_activity
            </span>
            <p>Đang tải danh sách...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs space-y-1">
            <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-700 block mx-auto">
              forum
            </span>
            <p className="font-medium text-slate-500 dark:text-slate-400 mt-2">
              {searchTerm ? 'Không tìm thấy phiên trò chuyện' : 'Chưa có cuộc trò chuyện nào'}
            </p>
            <p className="text-[11px] text-slate-400">
              {searchTerm ? 'Thử tìm với từ khóa khác' : 'Bắt đầu đặt câu hỏi để lưu lịch sử hội thoại'}
            </p>
          </div>
        ) : (
          <>
            {/* Pinned conversations */}
            {pinnedConversations.length > 0 && (
              <div className="space-y-1">
                <div className="px-2 py-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <span className="material-symbols-outlined text-[13px] text-amber-500">push_pin</span>
                  <span>Đã ghim</span>
                </div>
                <div className="space-y-0.5">{pinnedConversations.map(renderItem)}</div>
              </div>
            )}

            {/* Other recent conversations */}
            {otherConversations.length > 0 && (
              <div className="space-y-1">
                {pinnedConversations.length > 0 && (
                  <div className="px-2 py-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <span className="material-symbols-outlined text-[13px]">history</span>
                    <span>Gần đây</span>
                  </div>
                )}
                <div className="space-y-0.5">{otherConversations.map(renderItem)}</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
