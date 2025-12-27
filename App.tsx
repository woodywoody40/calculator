import React, { useState, useEffect, useCallback } from 'react';
import { Currency, FetchStatus, HistoryItem } from './types';
import { DEFAULT_FROM_CURRENCY, DEFAULT_TO_CURRENCY } from './constants';
import { fetchLiveExchangeRate } from './services/rateService';
import CurrencySelect from './components/CurrencySelect';
import HistoryModal from './components/HistoryModal';
import CalculatorKeypad from './components/CalculatorKeypad';
import CurrencyPickerModal from './components/CurrencyPickerModal';

const App: React.FC = () => {
  const [fromCurrency, setFromCurrency] = useState<Currency>(DEFAULT_FROM_CURRENCY);
  const [toCurrency, setToCurrency] = useState<Currency>(DEFAULT_TO_CURRENCY);
  const [inputExpression, setInputExpression] = useState<string>('0'); 
  const [calculatedValue, setCalculatedValue] = useState<number>(0);   
  const [rate, setRate] = useState<number | null>(null);
  const [status, setStatus] = useState<FetchStatus>(FetchStatus.IDLE);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectingField, setSelectingField] = useState<'from' | 'to' | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('conversionHistory');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const safeCalculate = (expression: string): number => {
    try {
      const cleanExpr = expression.replace(/[+\-*/]$/, '');
      if (!cleanExpr) return 0;
      const result = new Function(`return ${cleanExpr}`)();
      return isFinite(result) ? result : 0;
    } catch (e) { return 0; }
  };

  useEffect(() => {
    setCalculatedValue(safeCalculate(inputExpression));
  }, [inputExpression]);

  const handleKeyPress = (key: string) => {
    setInputExpression(prev => {
      if (key === '.') {
        const segments = prev.split(/[+\-*/]/);
        if (segments[segments.length - 1].includes('.')) return prev;
      }
      if (prev === '0' && !['+', '-', '*', '/'].includes(key) && key !== '.') return key;
      const isOperator = ['+', '-', '*', '/'].includes(key);
      if (isOperator && ['+', '-', '*', '/'].includes(prev.slice(-1))) return prev.slice(0, -1) + key;
      return prev === '0' && key !== '.' ? key : prev + key;
    });
  };

  const handleDelete = () => setInputExpression(prev => prev.length <= 1 ? '0' : prev.slice(0, -1));
  const handleClear = () => setInputExpression('0');
  const handleCalculate = () => {
    const result = safeCalculate(inputExpression);
    setInputExpression(Number.isInteger(result) ? result.toString() : result.toFixed(2));
  };

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };
  
  const handleCurrencySelect = (currency: Currency) => {
    if (selectingField === 'from') setFromCurrency(currency);
    else if (selectingField === 'to') setToCurrency(currency);
  };

  const getRate = useCallback(async (from: string, to: string) => {
    setStatus(FetchStatus.LOADING);
    setIsOfflineMode(false);
    try {
      const data = await fetchLiveExchangeRate(from, to);
      setRate(data.rate);
      setStatus(FetchStatus.SUCCESS);
      localStorage.setItem(`rate_${from}_${to}`, JSON.stringify({ rate: data.rate, date: new Date().toISOString() }));
    } catch (err) {
      const cached = localStorage.getItem(`rate_${from}_${to}`);
      if (cached) {
        const data = JSON.parse(cached);
        setRate(data.rate);
        setStatus(FetchStatus.SUCCESS);
        setIsOfflineMode(true);
      } else {
        setStatus(FetchStatus.ERROR);
      }
    }
  }, []);

  const saveToHistory = useCallback(() => {
    if (!rate || calculatedValue === 0) return;
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      fromCode: fromCurrency.code,
      toCode: toCurrency.code,
      amount: calculatedValue.toString(), 
      result: (calculatedValue * rate).toFixed(2),
      rate: rate,
      timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    };
    const newHistory = [newItem, ...history].slice(0, 20);
    setHistory(newHistory);
    localStorage.setItem('conversionHistory', JSON.stringify(newHistory));
  }, [rate, calculatedValue, fromCurrency, toCurrency, history]);

  useEffect(() => {
    if (status === FetchStatus.SUCCESS && rate && calculatedValue > 0) {
      if (!/[+\-*/]/.test(inputExpression) && inputExpression !== '0') {
        const timer = setTimeout(() => saveToHistory(), 2000); 
        return () => clearTimeout(timer);
      }
    }
  }, [calculatedValue, rate, status, inputExpression, saveToHistory]); 

  useEffect(() => {
    getRate(fromCurrency.code, toCurrency.code);
  }, [fromCurrency.code, toCurrency.code, getRate]);

  const resultVal = rate ? (calculatedValue * rate).toFixed(2) : '0.00';

  return (
    <div className="fixed inset-0 overflow-hidden bg-black flex items-center justify-center font-sans text-white select-none">
      <main className="
        relative z-10 
        w-full h-full
        md:w-[390px] md:h-[850px] 
        md:bg-black 
        md:rounded-[3rem] md:border-[8px] md:border-[#1a1a1a] md:shadow-2xl
        flex flex-col overflow-hidden
      ">
        
        {/* HEADER: Removed Title, kept History button aligned right */}
        <header className="flex-none flex justify-end items-center px-6 pt-6 pb-2">
          <button onClick={() => setIsHistoryOpen(true)} className="p-2 text-zinc-400 hover:text-white transition-colors">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
          </button>
        </header>

        {/* CARD DISPLAY: Reduced vertical padding to save space */}
        <section className="flex-none px-4 pb-2">
          <div className="bg-[#111111] rounded-[2rem] p-5 relative flex flex-col justify-center min-h-[160px]">
              {/* From Currency Row */}
              <div className="flex justify-between items-end mb-4">
                  <span className="text-xl text-zinc-500 font-normal">{fromCurrency.code}</span>
                  <div className="text-5xl font-light tracking-tight overflow-x-auto no-scrollbar whitespace-nowrap text-right pl-4 text-white">
                      {inputExpression}
                  </div>
              </div>

              {/* Divider */}
              <div className="w-full h-[1px] bg-zinc-800 mb-4"></div>

              {/* To Currency Row */}
              <div className="flex justify-between items-end">
                  <span className="text-xl text-[#d97746] font-normal">{toCurrency.code}</span>
                  <div className="text-6xl font-normal tracking-tight text-white overflow-x-auto no-scrollbar whitespace-nowrap text-right pl-4">
                      {resultVal}
                  </div>
              </div>

              {/* Footer Info */}
              <div className="mt-4 flex justify-between items-center">
                  <div className="bg-[#1c1c1c] px-3 py-1.5 rounded-lg">
                      <span className="text-[10px] text-zinc-500 font-medium tracking-wide">
                          1 {fromCurrency.code} ≈ {rate ? rate.toFixed(4) : '...'} {toCurrency.code}
                      </span>
                  </div>
                  <button onClick={() => getRate(fromCurrency.code, toCurrency.code)} className={`p-1.5 text-zinc-500 hover:text-white transition-colors ${status === FetchStatus.LOADING ? 'animate-spin' : ''}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                       </svg>
                  </button>
              </div>
          </div>
        </section>

        {/* CONTROLS: Reduced bottom margin */}
        <section className="flex-none px-4 mb-2">
            <div className="flex justify-between items-end text-[10px] text-zinc-500 px-1 mb-1 font-medium tracking-wider">
                <span>持有</span>
                <span>目標</span>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
               <CurrencySelect selected={fromCurrency} onClick={() => setSelectingField('from')} />
               
               <button onClick={handleSwap} className="w-12 h-12 rounded-full bg-[#1c1c1c] flex items-center justify-center text-zinc-400 hover:text-white active:scale-95 transition-all border border-zinc-800">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
               </button>

               <CurrencySelect selected={toCurrency} onClick={() => setSelectingField('to')} />
            </div>
        </section>

        {/* KEYPAD: Maintained flex-1 to take up all remaining space (approx 50%+) */}
        <section className="flex-1 min-h-0 z-10 w-full px-4 pb-8 pt-2">
           <CalculatorKeypad onKeyPress={handleKeyPress} onDelete={handleDelete} onClear={handleClear} onCalculate={handleCalculate} />
        </section>

        {/* MODALS */}
        <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={history} onClear={() => {setHistory([]); localStorage.removeItem('conversionHistory');}} />
        <CurrencyPickerModal isOpen={!!selectingField} onClose={() => setSelectingField(null)} onSelect={handleCurrencySelect} title={selectingField === 'from' ? '選擇持有幣別' : '選擇目標幣別'} selectedCurrencyCode={selectingField === 'from' ? fromCurrency.code : toCurrency.code} />
      </main>
    </div>
  );
};

export default App;