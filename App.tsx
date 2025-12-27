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

  const resultVal = rate ? (calculatedValue * rate).toFixed(2) : '---';

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#050505] flex items-center justify-center font-sans text-white select-none">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-15%] left-[-10%] w-[70%] h-[70%] bg-amber-900/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[70%] h-[70%] bg-zinc-800/20 rounded-full blur-[140px] pointer-events-none" />

      <main className="
        relative z-10 
        w-full h-[100dvh] 
        md:w-[400px] md:h-[840px] 
        md:bg-[#0c0c0c] md:backdrop-blur-3xl 
        md:rounded-[3.2rem] md:border-[6px] md:border-[#1a1a1a] md:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)]
        flex flex-col overflow-hidden
        transition-all duration-500 ease-out
      ">
        
        {/* HEADER AREA */}
        <header className="flex-none flex justify-between items-center px-8 pt-10 pb-4 z-20">
          <div className="flex flex-col">
              <h1 className="text-2xl font-bold tracking-tight text-white/90" style={{ fontFamily: "'Bodoni Moda', serif" }}>
                  Woody <span className="text-[#d9a75e] italic">匯率</span>
              </h1>
              {isOfflineMode && <span className="text-[10px] text-amber-500/70 font-semibold tracking-widest uppercase mt-0.5">Offline</span>}
          </div>
          <button 
            onClick={() => setIsHistoryOpen(true)} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/5 transition-all active:scale-90"
          >
              <svg className="w-5 h-5 text-amber-500/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
          </button>
        </header>

        {/* DISPLAY SECTION - THE NEW "WOODY CONSOLE" */}
        <section className="flex-none px-5 z-10">
          <div className="woody-console rounded-[2.5rem] p-8 woody-console-inner shadow-2xl">
              
              {/* Top Meta Info */}
              <div className="flex justify-between items-center mb-5">
                  <span className="text-[11px] font-bold tracking-[0.2em] text-zinc-500 uppercase">{fromCurrency.name}</span>
                  <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase border ${status === FetchStatus.LOADING ? 'border-amber-500/50 text-amber-500 animate-pulse' : 'border-zinc-800 text-zinc-600'}`}>
                    {status === FetchStatus.LOADING ? 'Fetching' : 'Live'}
                  </div>
              </div>

              {/* Input Display */}
              <div className="flex justify-between items-baseline mb-2">
                  <span className="text-lg font-bold text-zinc-600 tracking-tighter">{fromCurrency.code}</span>
                  <div className="text-4xl font-light tracking-tight overflow-x-auto no-scrollbar whitespace-nowrap text-right w-full pl-6 text-zinc-400">
                      {inputExpression}
                  </div>
              </div>

              {/* Minimal Metal Divider */}
              <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-white/10" />
                  <div className="w-1.5 h-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 shadow-[0_0_10px_rgba(217,167,94,0.4)]" />
                  <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-white/10" />
              </div>

              {/* Result Display */}
              <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xl font-black gold-text tracking-tighter">{toCurrency.code}</span>
                  <div className="text-6xl font-semibold tracking-tighter text-white overflow-x-auto no-scrollbar whitespace-nowrap text-right w-full pl-6 number-pop" key={resultVal}>
                      {resultVal}
                  </div>
              </div>

              {/* Footer Display Info */}
              <div className="mt-8 flex justify-between items-center">
                  <div className="bg-black/40 px-4 py-2 rounded-2xl border border-white/[0.03] shadow-inner">
                      <span className="text-[11px] text-amber-200/40 font-medium tracking-wider">
                        1 {fromCurrency.code} ≈ <span className="text-amber-500/80">{rate ? rate.toFixed(4) : '---'}</span> {toCurrency.code}
                      </span>
                  </div>
                  <button onClick={() => getRate(fromCurrency.code, toCurrency.code)} className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] transition-colors border border-white/5 active:rotate-180 duration-500">
                      <svg className={`w-4 h-4 text-amber-500/40 ${status === FetchStatus.LOADING ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                       </svg>
                  </button>
              </div>
          </div>

          {/* Currency Toggles Area */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center px-2 mt-6">
               <CurrencySelect label="持有幣別" selected={fromCurrency} onClick={() => setSelectingField('from')} />
               <button 
                 onClick={handleSwap} 
                 className="mt-6 w-12 h-12 rounded-2xl bg-[#1a1816] border border-amber-500/10 flex items-center justify-center text-amber-500/50 hover:text-amber-500 hover:border-amber-500/30 active:scale-95 active:rotate-180 transition-all duration-300 shadow-xl group"
               >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
               </button>
               <CurrencySelect label="換算目標" selected={toCurrency} onClick={() => setSelectingField('to')} />
          </div>
        </section>

        {/* KEYPAD AREA */}
        <section className="flex-1 min-h-0 z-10 w-full px-5 pb-10 pt-4">
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