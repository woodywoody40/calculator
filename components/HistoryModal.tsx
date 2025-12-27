import React from 'react';
// Removed createPortal to allow containment in parent 'relative' container
import { HistoryItem } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onClear: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, history, onClear }) => {
  // We no longer lock body scroll because on desktop we are inside a container.
  // On mobile, the app is 100dvh overflow-hidden anyway.

  return (
    <div className={`absolute inset-0 z-[100] flex justify-end transition-all duration-300 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      {/* Slide-over Content */}
      <div className={`relative w-3/4 max-w-[300px] h-full bg-[#090909] border-l border-white/10 shadow-2xl transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1) ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col z-10`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-white text-base font-medium tracking-wide pl-1">歷史紀錄</h3>
          <div className="flex gap-4 items-center">
            {history.length > 0 && (
                <button 
                onClick={onClear}
                className="text-xs text-zinc-500 hover:text-orange-500 transition-colors tracking-wider uppercase"
                >
                清除
                </button>
            )}
            <button 
                onClick={onClose}
                className="p-1 text-zinc-400 hover:text-white transition-colors"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain">
          {history.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-2">
                <svg className="w-8 h-8 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs tracking-wider opacity-50">暫無紀錄</span>
             </div>
          ) : (
            history.map((item) => (
                <div key={item.id} className="relative bg-white/[0.03] border border-white/[0.05] rounded-xl p-3.5 active:bg-white/[0.05] transition-colors">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] text-zinc-500 font-mono">{item.timestamp}</span>
                        <div className="text-[10px] text-zinc-500 bg-white/[0.02] px-1.5 py-0.5 rounded border border-white/[0.02]">
                            @{item.rate.toFixed(3)}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                        <div className="flex items-center justify-between">
                             <span className="text-zinc-400 font-light text-sm">{item.fromCode}</span>
                             <span className="text-base text-zinc-200 font-normal">{item.amount}</span>
                        </div>
                        <div className="h-[1px] w-full bg-white/[0.04] my-0.5"></div>
                        <div className="flex items-center justify-between">
                             <span className="text-orange-400/80 font-light text-sm">{item.toCode}</span>
                             <span className="text-lg text-white font-medium">{item.result}</span>
                        </div>
                    </div>
                </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;