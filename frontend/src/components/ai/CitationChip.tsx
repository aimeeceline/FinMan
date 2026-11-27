import React, { useState } from 'react';
import type { AiMessageSource } from '../../services/aiChatService';

interface CitationChipProps {
  source?: AiMessageSource;
  index: number;
  onSelect?: (source: AiMessageSource) => void;
}

export const CitationChip: React.FC<CitationChipProps> = ({ source, index, onSelect }) => {
  const [showPopover, setShowPopover] = useState(false);

  if (!source) {
    return (
      <span className="inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md cursor-default select-none dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
        [{index}]
      </span>
    );
  }

  return (
    <span className="relative inline-block mx-0.5">
      <button
        type="button"
        onClick={() => {
          if (onSelect) {
            onSelect(source);
          } else if (source.sourceUrl) {
            window.open(source.sourceUrl, '_blank', 'noopener,noreferrer');
          }
        }}
        onMouseEnter={() => setShowPopover(true)}
        onMouseLeave={() => setShowPopover(false)}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-bold font-mono tracking-tight text-emerald-800 bg-emerald-100/90 border border-emerald-300/80 rounded hover:bg-emerald-200 hover:border-emerald-400 active:scale-95 transition-all shadow-xs dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700"
        title={source.sourceTitle || `Nguồn tham khảo [${index}]`}
      >
        <span>[{index}]</span>
        {source.sourceName && (
          <span className="text-[10px] font-sans font-medium text-emerald-700/80 dark:text-emerald-400/80 hidden sm:inline max-w-[80px] truncate">
            {source.sourceName}
          </span>
        )}
      </button>

      {showPopover && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl text-left pointer-events-none animate-in fade-in zoom-in-95 duration-150"
          role="tooltip"
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold text-emerald-800 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300 rounded border border-emerald-200 dark:border-emerald-800">
              Nguồn trích dẫn [{source.citationIndex || index}]
            </span>
            {source.sourceName && (
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {source.sourceName}
              </span>
            )}
          </div>
          <h4 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 mb-1">
            {source.sourceTitle}
          </h4>
          {source.snippet && (
            <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
              "{source.snippet}"
            </p>
          )}
          {source.sourceUrl && (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              <span>Bấm vào chip để mở bài báo gốc</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </div>
          )}
        </div>
      )}
    </span>
  );
};
