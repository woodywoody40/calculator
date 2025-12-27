import React from 'react';
import { Currency } from '../types';

interface CurrencySelectProps {
  selected: Currency;
  onClick: () => void;
  label?: string;
}

const CurrencySelect: React.FC<CurrencySelectProps> = ({ selected, onClick }) => {
  return (
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between bg-[#111111] border border-white/5 hover:border-zinc-700 rounded-xl px-2.5 py-2 transition-all duration-200 active:bg-zinc-900 shadow-sm overflow-hidden"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-black text-white leading-none shrink-0 opacity-80">
            {selected.code.slice(0, 2)}
          </span>
          <span className="font-black text-white text-[13px] leading-tight tracking-wider truncate">
            {selected.code}
          </span>
        </div>
        <svg
          className="w-3 h-3 text-zinc-600 shrink-0 ml-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
  );
};

export default CurrencySelect;