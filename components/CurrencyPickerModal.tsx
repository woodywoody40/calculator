import React from 'react';
import { Currency } from '../types';
import { POPULAR_CURRENCIES } from '../constants';

interface CurrencyPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (currency: Currency) => void;
  title: string;
  selectedCurrencyCode: string;
}

const CurrencyPickerModal: React.FC<CurrencyPickerModalProps> = ({ 
  isOpen, onClose, onSelect, title, selectedCurrencyCode 
}) => {
  return (
    <div className={`absolute inset-0 z-[100] flex items-end justify-center transition-all duration-300 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
       {/* Backdrop */}
       <div 
         className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
         onClick={onClose}
       />
       
       {/* Content - Slide Up */}
       <div className={`relative w-full h-[85%] bg-[#0f0f0f] border-t border-white/10 rounded-t-[2rem] shadow-2xl flex flex-col transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1) ${isOpen ? 'translate-y-0' : 'translate-y-full'} z-10`}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.02]">
            <h3 className="text-white text-lg font-medium tracking-wide pl-1">{title}</h3>
            <button onClick={onClose} className="p-2 -mr-2 text-zinc-500 hover:text-white transition-colors">
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
                 onClick={() => { onSelect(currency); onClose(); }}
                 className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 border border-transparent ${
                   currency.code === selectedCurrencyCode
                     ? 'bg-zinc-800 text-white border-zinc-700'
                     : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                 }`}
               >
                 <span className="text-3xl filter grayscale opacity-80">{currency.flag}</span>
                 <div className="flex flex-col items-start gap-0.5">
                    <span className="font-medium text-lg tracking-wide text-white leading-none">{currency.code}</span>
                    <span className="text-xs opacity-50 tracking-wider">{currency.name}</span>
                 </div>
                 {currency.code === selectedCurrencyCode && (
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
}

export default CurrencyPickerModal;