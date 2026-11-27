import React, { useState } from 'react';
import { aiChatService } from '../../services/aiChatService';
import type { MacroImpactEvaluationResponse } from '../../services/aiChatService';

interface MacroScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_SCENARIOS = [
  { topic: 'Lãi suất tiền gửi ngân hàng', change: 1.0, icon: 'trending_up', label: '+1.0% Lãi suất tiền gửi' },
  { topic: 'Lãi suất tiền gửi ngân hàng', change: 1.5, icon: 'percent', label: '+1.5% Lãi suất tiền gửi' },
  { topic: 'Giá xăng dầu & nhiên liệu', change: 8.0, icon: 'local_gas_station', label: '+8.0% Giá xăng dầu' },
  { topic: 'Lạm phát & giá cả tiêu dùng', change: 4.5, icon: 'shopping_cart', label: '+4.5% Lạm phát chung' },
  { topic: 'Lãi suất tiền gửi ngân hàng', change: -0.5, icon: 'trending_down', label: '-0.5% Lãi suất giảm' },
];

export const MacroScenarioModal: React.FC<MacroScenarioModalProps> = ({ isOpen, onClose }) => {
  const [topic, setTopic] = useState('Lãi suất tiền gửi ngân hàng');
  const [changePct, setChangePct] = useState(1.0);
  const [result, setResult] = useState<MacroImpactEvaluationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulate = async (customTopic?: string, customChange?: number) => {
    const selectedTopic = customTopic || topic;
    const selectedChange = customChange !== undefined ? customChange : changePct;

    setIsLoading(true);
    setError(null);
    try {
      const data = await aiChatService.evaluateMacroImpact(selectedTopic, selectedChange);
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra khi tính toán kịch bản.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatVnd = (val?: number) => {
    if (val === undefined || val === null) return '0 ₫';
    return val.toLocaleString('vi-VN') + ' ₫';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <span className="material-symbols-outlined text-2xl">calculate</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Mô Phỏng Kịch Bản Vĩ Mô (What-If Analysis)
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Quick preset chips */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
            Chọn kịch bản nhanh hoặc nhập tùy chỉnh:
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_SCENARIOS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTopic(p.topic);
                  setChangePct(p.change);
                  handleSimulate(p.topic, p.change);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                  topic === p.topic && changePct === p.change
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom form */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
              Chủ đề vĩ mô:
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="VD: Lãi suất tiền gửi, Giá xăng, Lạm phát..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
              Biến động (%):
            </label>
            <input
              type="number"
              step="0.1"
              value={changePct}
              onChange={(e) => setChangePct(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleSimulate()}
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
              <span>Đang tính toán số học...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[16px]">play_arrow</span>
              <span>Chạy mô phỏng định lượng</span>
            </>
          )}
        </button>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Results display */}
        {result && (
          <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl space-y-3 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-emerald-100 dark:border-emerald-900/50">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Tác động hàng tháng:</span>
                <span className="text-sm font-bold font-mono text-emerald-800 dark:text-emerald-300">
                  {result.monthlyImpactVnd !== undefined
                    ? (result.monthlyImpactVnd >= 0 ? '+' : '') + formatVnd(result.monthlyImpactVnd) + '/tháng'
                    : '—'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Tác động cả năm:</span>
                <span className="text-sm font-bold font-mono text-emerald-800 dark:text-emerald-300">
                  {result.annualImpactVnd !== undefined
                    ? (result.annualImpactVnd >= 0 ? '+' : '') + formatVnd(result.annualImpactVnd) + '/năm'
                    : '—'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                Công thức & Nhận định:
              </span>
              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                {result.impactDescription}
              </p>
              {result.recommendation && (
                <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium pt-1">
                  💡 <strong>Gợi ý:</strong> {result.recommendation}
                </p>
              )}
            </div>

            {result.disclaimer && (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 italic pt-1 border-t border-emerald-100 dark:border-emerald-900/40">
                *{result.disclaimer}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
