import React from 'react';
import { Currency } from '../types';

interface CurrencySelectProps {
  selected: Currency;
  onClick: () => void;
  label: string;
}

const CurrencySelect: React.FC<CurrencySelectProps> = ({ selected, onClick, label }) => {
  return (
      <div className="relative w-full">
        <label className="block text-[10px] sm:text-[11px] font-medium text-zinc-500 mb-2 tracking-widest pl-1">
          {label}
        </label>
        <button
          onClick={onClick}
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
  );
};

export default CurrencySelect;