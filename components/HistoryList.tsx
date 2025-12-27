import React from 'react';
import { HistoryItem } from '../types';

interface HistoryListProps {
  history: HistoryItem[];
  onClear: () => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ history, onClear }) => {
  if (history.length === 0) return null;

  return (
    <div className="w-full fade-in">
      <div className="flex justify-between items-center mb-8 sticky top-0 bg-black/80 backdrop-blur-xl py-4 z-20">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-white/5">
                <svg className="w-4 h-4 text-[#d97746]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h3 className="text-base tracking-[0.2em] text-zinc-200 font-black uppercase">歷史紀錄</h3>
        </div>
        <button 
          onClick={onClear}
          className="text-[10px] tracking-widest text-[#d97746] font-black hover:text-white transition-all py-1.5 px-3 rounded-full border border-[#d97746]/30 hover:bg-[#d97746]/10 active:scale-95 uppercase"
        >
          清除全部
        </button>
      </div>
      
      <div className="space-y-3">
        {history.map((item) => (
          <div key={item.id} className="bg-[#111111] border border-white/5 rounded-[1.8rem] p-5 hover:border-zinc-700/50 transition-all duration-300 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] text-zinc-600 font-bold tracking-widest uppercase">{item.timestamp}</span>
                <span className="text-[9px] text-zinc-500 bg-black px-2 py-0.5 rounded border border-white/5 font-mono">
                  1 {item.fromCode} = {item.rate.toFixed(4)} {item.toCode}
                </span>
            </div>
            
            <div className="flex items-center gap-4">
                {/* 左側幣別 */}
                <div className="flex-1 flex flex-col gap-1">
                   <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-zinc-600 uppercase tracking-tighter">{item.fromCode}</span>
                   </div>
                   <div className="text-xl text-zinc-200 font-medium tabular-nums truncate">
                      {item.amount}
                   </div>
                </div>

                {/* 中間箭頭 */}
                <div className="flex-none">
                   <svg className="w-4 h-4 text-zinc-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                   </svg>
                </div>

                {/* 右側結果 */}
                <div className="flex-1 flex flex-col gap-1 text-right">
                   <div className="flex items-center justify-end gap-1.5">
                      <span className="text-[10px] font-black text-[#d97746] uppercase tracking-tighter">{item.toCode}</span>
                   </div>
                   <div className="text-2xl text-white font-bold tabular-nums truncate">
                      {item.result}
                   </div>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;