import React, { useState, useMemo } from 'react';
import type { MarketIndex } from '../../types/market';
import { formatTradingValueTyd, formatVolume } from '../../types/market';

interface IndexChartProps {
  index: MarketIndex;
}

type TimeFrame = '1D' | '1W' | '1M' | '3M' | '1Y';

interface ChartPoint {
  time: string;
  value: number;
}

export const IndexChart: React.FC<IndexChartProps> = ({ index }) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('1D');
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);

  // Sinh dữ liệu biểu đồ mượt mà theo khung thời gian
  const chartData = useMemo(() => {
    const current = index.currentValue;
    const ref = index.currentValue - index.changeValue;

    if (timeFrame === '1D') {
      // 1D: Giả lập 24 mốc thời gian từ 09:00 -> 15:00 phiên Việt Nam
      const times = [
        '09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45', '11:00', '11:15', '11:30',
        '13:00', '13:15', '13:30', '13:45', '14:00', '14:15', '14:30', '14:45', '15:00',
      ];
      let val = ref;
      const stepChange = (current - ref) / times.length;
      return times.map((t, idx) => {
        // Biến động tự nhiên quanh xu hướng
        const jitter = (Math.sin(idx * 0.9) + (idx / times.length) * 0.4) * Math.abs(index.changeValue * 0.35);
        val = idx === times.length - 1 ? current : ref + stepChange * idx + jitter;
        return { time: t, value: Number(val.toFixed(2)) };
      });
    }

    if (timeFrame === '1W') {
      const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Hôm nay'];
      return days.map((d, i) => {
        const val = current - (4 - i) * (index.changeValue * 0.45) + (Math.sin(i) * 3);
        return { time: d, value: Number(val.toFixed(2)) };
      });
    }

    // 1M: 20 phiên giao dịch
    const count = timeFrame === '1M' ? 20 : timeFrame === '3M' ? 30 : 40;
    const points: ChartPoint[] = [];
    let rolling = current - index.changeValue * 3;
    for (let i = 0; i < count; i++) {
      rolling += (Math.sin(i * 0.6) * 4) + ((current - rolling) / (count - i));
      points.push({
        time: `Phiên ${i + 1}`,
        value: Number(rolling.toFixed(2)),
      });
    }
    points[points.length - 1].value = current;
    return points;
  }, [index, timeFrame]);

  // Tính toán High, Low, Baseline
  const values = chartData.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const refValue = index.currentValue - index.changeValue;
  const paddingY = (maxVal - minVal) * 0.15 || 5;
  const domainMin = Math.min(minVal, refValue) - paddingY;
  const domainMax = Math.max(maxVal, refValue) + paddingY;
  const domainRange = domainMax - domainMin || 1;

  // Tọa độ SVG
  const width = 800;
  const height = 280;
  const padLeft = 15;
  const padRight = 15;
  const padTop = 20;
  const padBottom = 40;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const pointsSvg = chartData.map((pt, i) => {
    const x = padLeft + (i / Math.max(1, chartData.length - 1)) * chartW;
    const y = padTop + chartH - ((pt.value - domainMin) / domainRange) * chartH;
    return { ...pt, x, y };
  });

  // Smooth bezier curve path
  const linePath = useMemo(() => {
    if (pointsSvg.length === 0) return '';
    let d = `M ${pointsSvg[0].x} ${pointsSvg[0].y}`;
    for (let i = 0; i < pointsSvg.length - 1; i++) {
      const p0 = pointsSvg[i];
      const p1 = pointsSvg[i + 1];
      const cx1 = p0.x + (p1.x - p0.x) * 0.45;
      const cy1 = p0.y;
      const cx2 = p0.x + (p1.x - p0.x) * 0.55;
      const cy2 = p1.y;
      d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [pointsSvg]);

  const areaPath = useMemo(() => {
    if (pointsSvg.length === 0) return '';
    const last = pointsSvg[pointsSvg.length - 1];
    const first = pointsSvg[0];
    const baselineY = padTop + chartH;
    return `${linePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
  }, [linePath, pointsSvg, padTop, chartH]);

  const refY = padTop + chartH - ((refValue - domainMin) / domainRange) * chartH;

  const isBullish = index.changeValue >= 0;
  const strokeColor = isBullish ? '#10b981' : '#f43f5e';

  return (
    <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-5 sm:p-6 shadow-sm flex flex-col gap-4">
      {/* 1. Header: Chỉ số đang xem & Bộ chọn Timeframe */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/15 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-headline-sm text-lg sm:text-xl font-extrabold text-on-surface">
              Diễn biến điểm số {index.name}
            </h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                isBullish
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
              }`}
            >
              {index.changeValue >= 0 ? '+' : ''}
              {index.changeValue.toFixed(2)} ({index.percentChange >= 0 ? '+' : ''}
              {index.percentChange.toFixed(2)}%)
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Tham chiếu: <span className="font-semibold text-amber-600 dark:text-amber-400 font-mono">{refValue.toFixed(2)}</span> • Cao nhất:{' '}
            <span className="font-semibold font-mono text-emerald-600">{maxVal.toFixed(2)}</span> • Thấp nhất:{' '}
            <span className="font-semibold font-mono text-rose-600">{minVal.toFixed(2)}</span>
          </p>
        </div>

        {/* Timeframe Buttons */}
        <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1 self-start sm:self-auto">
          {(['1D', '1W', '1M', '3M', '1Y'] as TimeFrame[]).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeFrame(tf)}
              data-testid={`timeframe-btn-${tf}`}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeFrame === tf
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Interactive SVG Line Chart */}
      <div className="relative w-full h-[260px] sm:h-[280px]">
        {/* Hover Point Callout Box */}
        {hoveredPoint && (
          <div className="absolute top-2 right-4 z-20 px-3 py-1.5 rounded-xl bg-slate-900/90 text-white shadow-lg backdrop-blur-md text-xs font-mono flex items-center gap-3">
            <span>Thời gian: {hoveredPoint.time}</span>
            <span className="font-bold text-emerald-400">
              Điểm số: {hoveredPoint.value.toFixed(2)}
            </span>
          </div>
        )}

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="indexChartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.28" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Đường tham chiếu (Reference Line) nét đứt màu vàng hổ phách */}
          <line
            x1={padLeft}
            y1={refY}
            x2={width - padRight}
            y2={refY}
            stroke="#f59e0b"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            opacity="0.65"
          />

          {/* Area Gradient */}
          <path d={areaPath} fill="url(#indexChartGrad)" />

          {/* Main Line */}
          <path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Data Points & Ticks */}
          {pointsSvg.map((pt, i) => {
            const isHovered = hoveredPoint?.time === pt.time;
            return (
              <g key={i}>
                {/* Hit area for mouse hover */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="12"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                {/* Visible dot on hover or endpoints */}
                {(isHovered || i === pointsSvg.length - 1) && (
                  <>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4.5"
                      fill={strokeColor}
                      className="transition-transform duration-150"
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="8"
                      fill={strokeColor}
                      opacity="0.3"
                    />
                  </>
                )}
              </g>
            );
          })}

          {/* X Axis Time Labels */}
          {pointsSvg.map((pt, i) => {
            // Hiển thị mốc thời gian cách đều
            const shouldShowLabel =
              i === 0 ||
              i === Math.floor(pointsSvg.length / 2) ||
              i === pointsSvg.length - 1;
            if (!shouldShowLabel) return null;

            return (
              <text
                key={`label-${i}`}
                x={pt.x}
                y={height - 12}
                textAnchor={i === 0 ? 'start' : i === pointsSvg.length - 1 ? 'end' : 'middle'}
                className="text-[11px] fill-slate-400 dark:fill-slate-500 font-mono font-medium"
              >
                {pt.time}
              </text>
            );
          })}
        </svg>
      </div>

      {/* 3. Bottom Summary Info Bar */}
      <div className="pt-3 border-t border-outline-variant/15 flex items-center justify-between flex-wrap gap-3 text-xs text-on-surface-variant">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Biến động phiên</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-amber-500" />
            <span>Đường tham chiếu ({refValue.toFixed(2)})</span>
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono font-semibold">
          <span>KLGD: {formatVolume(index.tradingVolume)}</span>
          <span>•</span>
          <span>GTGD: {formatTradingValueTyd(index.tradingValue)}</span>
        </div>
      </div>
    </div>
  );
};

