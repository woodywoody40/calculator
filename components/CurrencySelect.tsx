import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Currency } from '../types';
import { POPULAR_CURRENCIES } from '../constants';

interface CurrencySelectProps {
  selected: Currency;
  onSelect: (currency: Currency) => void;
  label: string;
}

const CurrencySelect: React.FC<CurrencySelectProps> = ({ selected, onSelect, label }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // The Modal content
  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-sm bg-[#121212] border-t sm:border border-white/10 rounded-t-[2rem] sm:rounded-3xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-5 sm:zoom-in-95 duration-300 z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-white text-lg font-light tracking-wide pl-1">選擇{label}</h3>
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
        <div className="overflow-y-auto p-2 space-y-1 no-scrollbar pb-10 sm:pb-2 bg-[#121212]">
          {POPULAR_CURRENCIES.map((currency) => (
            <button
              key={currency.code}
              onClick={() => {
                onSelect(currency);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 border border-transparent ${
                currency.code === selected.code
                  ? 'bg-zinc-800 text-white border-zinc-700'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
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
        <label className="block text-[10px] sm:text-[11px] font-medium text-zinc-500 mb-1.5 sm:mb-2 tracking-widest pl-1">
          {label}
        </label>
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/20 rounded-xl sm:rounded-2xl px-3 py-3 sm:px-4 sm:py-4 transition-all duration-300 group backdrop-blur-md active:scale-[0.98]"
        >
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
            {/* Flag */}
            <span className="text-xl sm:text-2xl filter grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300 flex-shrink-0 leading-none" role="img" aria-label={selected.name}>
              {selected.flag}
            </span>
            <div className="text-left flex flex-col min-w-0">
              {/* Code */}
              <span className="font-medium text-white text-base sm:text-lg leading-tight tracking-wider truncate">
                {selected.code}
              </span>
              {/* Name - HIDDEN on mobile to save space, visible on tablet+ */}
              <span className="text-[10px] text-zinc-500 font-normal hidden sm:block truncate">
                {selected.name}
              </span>
            </div>
          </div>
          {/* Arrow Icon */}
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4 text-zinc-600 group-hover:text-white transition-all duration-300 flex-shrink-0 ml-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Render Modal via Portal to break out of parent overflow/z-index constraints */}
      {isOpen && createPortal(modalContent, document.body)}
    </>
  );
};

export default CurrencySelect;