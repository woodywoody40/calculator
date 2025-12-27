import React from 'react';
import { HistoryItem } from '../types';

interface HistoryListProps {
  history: HistoryItem[];
  onClear: () => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ history, onClear }) => {
  if (history.length === 0) return null;

  return (
    <div className="w-full mt-8 fade-in px-1">
      <div className="flex justify-between items-end mb-4 px-1 border-b border-white/[0.05] pb-2">
        <h3 className="text-[11px] tracking-widest text-zinc-500 font-medium">歷史紀錄</h3>
        <button 
          onClick={onClear}
          className="text-[11px] tracking-wide text-zinc-600 hover:text-white transition-colors"
        >
          清除全部
        </button>
      </div>
      <div className="space-y-2.5">
        {history.map((item) => (
          <div key={item.id} className="group relative bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1] rounded-lg p-3.5 transition-all duration-300">
            <div className="flex justify-between items-center relative z-10">
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-zinc-400 font-light tracking-wide">{item.amount} {item.fromCode}</span>
                  <span className="text-zinc-700 text-[10px]">➜</span>
                  <span className="text-white font-medium tracking-wide">{item.result} {item.toCode}</span>
                </div>
                <span className="text-[10px] text-zinc-600 font-mono tracking-wider">
                  {item.timestamp}
                </span>
              </div>
              <div className="text-[10px] text-zinc-700 bg-white/[0.03] px-2 py-1 rounded border border-white/[0.02]">
                匯率 {item.rate.toFixed(4)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;