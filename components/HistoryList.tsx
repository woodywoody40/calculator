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
      <div className="flex justify-between items-center mb-8 sticky top-0 bg-black/80 backdrop-blur py-4 z-20">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                <svg className="w-4 h-4 text-[#d97746]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h3 className="text-lg tracking-widest text-zinc-200 font-bold uppercase">歷史紀錄</h3>
        </div>
        <button 
          onClick={onClear}
          className="text-xs tracking-widest text-[#d97746] font-bold hover:text-white transition-all py-2 px-4 rounded-full border border-[#d97746]/30 hover:bg-[#d97746]/10 active:scale-95"
        >
          清除全部
        </button>
      </div>
      
      <div className="space-y-4">
        {history.map((item) => (
          <div key={item.id} className="bg-[#0a0a0a] border border-white/5 rounded-[1.5rem] p-5 hover:border-zinc-700 transition-all duration-300">
            <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] text-zinc-600 font-bold tracking-widest uppercase">{item.timestamp}</span>
                <span className="text-[10px] text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded-md border border-white/5 font-mono">
                  RATE: {item.rate.toFixed(4)}
                </span>
            </div>
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-bold text-xs tracking-wider uppercase">{item.fromCode}</span>
                    <span className="text-xl text-zinc-300 font-light tabular-nums">{item.amount}</span>
                </div>
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent my-1"></div>
                <div className="flex items-center justify-between">
                    <span className="text-[#d97746] font-bold text-xs tracking-wider uppercase">{item.toCode}</span>
                    <span className="text-2xl text-white font-semibold tabular-nums">{item.result}</span>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;