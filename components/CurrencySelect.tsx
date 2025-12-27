import React, { useState } from 'react';
// Removed createPortal and useEffect lock to confine modal to App container
import { Currency } from '../types';
import { POPULAR_CURRENCIES } from '../constants';

interface CurrencySelectProps {
  selected: Currency;
  onSelect: (currency: Currency) => void;
  label: string;
}

const CurrencySelect: React.FC<CurrencySelectProps> = ({ selected, onSelect, label }) => {
  const [isOpen, setIsOpen] = useState(false);

  // The Modal content - now absolute positioned relative to App container
  const modalContent = (
    <div className="absolute inset-0 z-[100] flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal Content - Slide Up */}
      <div className="relative w-full h-[85%] bg-[#0f0f0f] border-t border-white/10 rounded-t-[2rem] shadow-2xl flex flex-col animate-in slide-in-from-bottom-full duration-300 ease-out z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-white text-lg font-medium tracking-wide pl-1">選擇{label}幣別</h3>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 -mr-2 text-zinc-500 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar pb-10 bg-[#0f0f0f]">
          {POPULAR_CURRENCIES.map((currency) => (
            <button
              key={currency.code}
              onClick={() => {
                onSelect(currency);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 border border-transparent ${
                currency.code === selected.code
                  ? 'bg-zinc-800 text-white border-zinc-700'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
              }`}
            >
              <span className="text-3xl filter grayscale opacity-80">{currency.flag}</span>
              <div className="flex flex-col items-start gap-0.5">
                <span className="font-medium text-lg tracking-wide text-white leading-none">{currency.code}</span>
                <span className="text-xs opacity-50 tracking-wider">{currency.name}</span>
              </div>
              {currency.code === selected.code && (
                <div className="ml-auto text-white">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="relative w-full">
        <label className="block text-[10px] sm:text-[11px] font-medium text-zinc-500 mb-2 tracking-widest pl-1">
          {label}
        </label>
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/20 rounded-2xl px-4 py-3.5 transition-all duration-300 group backdrop-blur-md active:scale-[0.98]"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="text-2xl filter grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300 flex-shrink-0 leading-none" role="img" aria-label={selected.name}>
              {selected.flag}
            </span>
            <div className="text-left flex flex-col min-w-0">
              <span className="font-medium text-white text-lg leading-tight tracking-wider truncate">
                {selected.code}
              </span>
              <span className="text-[10px] text-zinc-500 font-normal hidden sm:block truncate">
                {selected.name}
              </span>
            </div>
          </div>
          <svg
            className="w-4 h-4 text-zinc-600 group-hover:text-white transition-all duration-300 flex-shrink-0 ml-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Render Modal conditionally inline (absolute) instead of Portal */}
      {isOpen && modalContent}
    </>
  );
};

export default CurrencySelect;