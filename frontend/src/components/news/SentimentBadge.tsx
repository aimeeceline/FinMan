import React, { useState } from 'react';
import type { NewsSentiment } from '../../types/news';

export interface SentimentBadgeProps {
  sentiment?: NewsSentiment | string;
  sentimentReason?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'pill' | 'subtle' | 'card' | 'dot';
  showIcon?: boolean;
  showLabel?: boolean;
  showTooltip?: boolean;
  className?: string;
}

interface SentimentConfig {
  type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  label: string;
  icon: string;
  pillClasses: string;
  subtleClasses: string;
  cardClasses: string;
  dotColor: string;
}

const SENTIMENT_CONFIGS: Record<string, SentimentConfig> = {
  POSITIVE: {
    type: 'POSITIVE',
    label: 'Tích cực',
    icon: 'trending_up',
    pillClasses: 'bg-emerald-500 text-white border-transparent shadow-xs',
    subtleClasses: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    cardClasses: 'bg-emerald-50/60 border-emerald-200/80 text-emerald-900',
    dotColor: 'bg-emerald-500',
  },
  NEGATIVE: {
    type: 'NEGATIVE',
    label: 'Thận trọng',
    icon: 'trending_down',
    pillClasses: 'bg-rose-500 text-white border-transparent shadow-xs',
    subtleClasses: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    cardClasses: 'bg-rose-50/60 border-rose-200/80 text-rose-900',
    dotColor: 'bg-rose-500',
  },
  NEUTRAL: {
    type: 'NEUTRAL',
    label: 'Trung lập',
    icon: 'horizontal_rule',
    pillClasses: 'bg-amber-500 text-white border-transparent shadow-xs',
    subtleClasses: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    cardClasses: 'bg-amber-50/60 border-amber-200/80 text-amber-900',
    dotColor: 'bg-amber-500',
  },
};

const SIZE_STYLES = {
  xs: {
    badge: 'px-2 py-0.5 text-[10px] rounded-md gap-1',
    icon: 'text-[11px]',
    dot: 'w-1.5 h-1.5',
  },
  sm: {
    badge: 'px-2.5 py-0.5 text-[11px] rounded-lg gap-1.2',
    icon: 'text-[13px]',
    dot: 'w-2 h-2',
  },
  md: {
    badge: 'px-3 py-1 text-xs rounded-xl gap-1.5',
    icon: 'text-[15px]',
    dot: 'w-2.5 h-2.5',
  },
  lg: {
    badge: 'px-3.5 py-1.5 text-sm rounded-2xl gap-2 font-bold',
    icon: 'text-[18px]',
    dot: 'w-3 h-3',
  },
};

export const SentimentBadge: React.FC<SentimentBadgeProps> = ({
  sentiment,
  sentimentReason,
  size = 'sm',
  variant = 'subtle',
  showIcon = true,
  showLabel = true,
  showTooltip = true,
  className = '',
}) => {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  if (!sentiment) return null;

  const key = sentiment.toUpperCase();
  const config = SENTIMENT_CONFIGS[key] || SENTIMENT_CONFIGS.NEUTRAL;
  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.sm;

  if (variant === 'dot') {
    return (
      <span
        className={`relative inline-flex items-center ${className}`}
        onMouseEnter={() => setIsTooltipOpen(true)}
        onMouseLeave={() => setIsTooltipOpen(false)}
        title={sentimentReason || `Sắc thái: ${config.label}`}
      >
        <span
          className={`inline-block rounded-full ${config.dotColor} ${sizeStyle.dot}`}
        />
        {showLabel && (
          <span className="ml-1.5 text-xs font-semibold text-on-surface">
            {config.label}
          </span>
        )}
      </span>
    );
  }

  const variantClass =
    variant === 'pill'
      ? config.pillClasses
      : variant === 'card'
      ? config.cardClasses
      : config.subtleClasses;

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsTooltipOpen(true)}
      onMouseLeave={() => setIsTooltipOpen(false)}
    >
      <span
        data-testid={`sentiment-badge-${config.type.toLowerCase()}`}
        className={`inline-flex items-center font-bold tracking-wide border transition-all select-none ${sizeStyle.badge} ${variantClass} ${className}`}
      >
        {showIcon && (
          <span className={`material-symbols-outlined leading-none ${sizeStyle.icon}`}>
            {config.icon}
          </span>
        )}
        {showLabel && <span>{config.label}</span>}
      </span>

      {/* Floating Sentiment Reason Tooltip */}
      {showTooltip && sentimentReason && isTooltipOpen && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-2xl bg-slate-900/95 backdrop-blur-md text-white text-xs shadow-xl border border-white/10 z-50 animate-fadeIn pointer-events-none"
        >
          <div className="flex items-center gap-1.5 font-bold text-amber-300 text-[11px] mb-1 uppercase tracking-wider">
            <span className="material-symbols-outlined text-[13px]">psychology</span>
            <span>Căn cứ phân tích sắc thái AI</span>
          </div>
          <p className="text-[11px] text-slate-200 leading-relaxed">
            {sentimentReason}
          </p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/95" />
        </div>
      )}
    </div>
  );
};

