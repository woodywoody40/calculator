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
        className="w-full flex items-center justify-between bg-[#111111] border border-transparent hover:border-zinc-700 rounded-2xl px-4 py-3 transition-all duration-200 active:bg-zinc-900"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-white leading-none">
            {selected.code.slice(0, 2)}
          </span>
          <div className="flex flex-col items-start">
            <span className="font-medium text-white text-base leading-tight">
              {selected.code}
            </span>
            <span className="text-[10px] text-zinc-500 font-normal truncate max-w-[60px]">
              {selected.name}
            </span>
          </div>
        </div>
        <svg
          className="w-4 h-4 text-zinc-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
  );
};

export default CurrencySelect;