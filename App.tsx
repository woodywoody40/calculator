import React, { useState, useEffect, useCallback } from 'react';
import { Currency, FetchStatus, HistoryItem } from './types';
import { DEFAULT_FROM_CURRENCY, DEFAULT_TO_CURRENCY } from './constants';
import { fetchLiveExchangeRate } from './services/rateService';
import CurrencySelect from './components/CurrencySelect';
import HistoryModal from './components/HistoryModal';
import CalculatorKeypad from './components/CalculatorKeypad';
import CurrencyPickerModal from './components/CurrencyPickerModal';

const App: React.FC = () => {
  // State
  const [fromCurrency, setFromCurrency] = useState<Currency>(DEFAULT_FROM_CURRENCY);
  const [toCurrency, setToCurrency] = useState<Currency>(DEFAULT_TO_CURRENCY);
  const [inputExpression, setInputExpression] = useState<string>('0'); 
  const [calculatedValue, setCalculatedValue] = useState<number>(0);   
  const [rate, setRate] = useState<number | null>(null);
  const [status, setStatus] = useState<FetchStatus>(FetchStatus.IDLE);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // New state for currency picker modal
  const [selectingField, setSelectingField] = useState<'from' | 'to' | null>(null);

  // Load History
  useEffect(() => {
    const savedHistory = localStorage.getItem('conversionHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Safe Calculator Logic
  const safeCalculate = (expression: string): number => {
    try {
      const cleanExpr = expression.replace(/[+\-*/]$/, '');
      if (!cleanExpr) return 0;
      if (!/^[\d.+\-*/\s]+$/.test(cleanExpr)) return 0;
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${cleanExpr}`)();
      return isFinite(result) ? result : 0;
    } catch (e) {
      return 0;
    }
  };

  useEffect(() => {
    const newVal = safeCalculate(inputExpression);
    setCalculatedValue(newVal);
  }, [inputExpression]);

  // Keypad Handlers
  const handleKeyPress = (key: string) => {
    setInputExpression(prev => {
      if (key === '.') {
        const segments = prev.split(/[+\-*/]/);
        if (segments[segments.length - 1].includes('.')) return prev;
      }
      if (prev === '0' && !['+', '-', '*', '/'].includes(key) && key !== '.') {
         return key;
      }
      const isOperator = ['+', '-', '*', '/'].includes(key);
      if (isOperator && ['+', '-', '*', '/'].includes(prev.slice(-1))) {
        return prev.slice(0, -1) + key;
      }
      return prev === '0' && key !== '.' ? key : prev + key;
    });
  };

  const handleDelete = () => {
    setInputExpression(prev => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    setInputExpression('0');
  };

  const handleCalculate = () => {
    const result = safeCalculate(inputExpression);
    const resultStr = Number.isInteger(result) ? result.toString() : result.toFixed(2);
    setInputExpression(resultStr);
  };

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };
  
  const handleCurrencySelect = (currency: Currency) => {
    if (selectingField === 'from') {
      setFromCurrency(currency);
    } else if (selectingField === 'to') {
      setToCurrency(currency);
    }
  };

  const getCacheKey = (from: string, to: string) => `rate_${from}_${to}`;

  const getRate = useCallback(async (from: string, to: string) => {
    setStatus(FetchStatus.LOADING);
    setErrorMsg(null);
    setIsOfflineMode(false);
    
    try {
      const data = await fetchLiveExchangeRate(from, to);
      setRate(data.rate);
      const timeStr = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
      setLastUpdated(timeStr);
      setStatus(FetchStatus.SUCCESS);
      localStorage.setItem(getCacheKey(from, to), JSON.stringify({
        rate: data.rate,
        timestamp: timeStr,
        date: new Date().toISOString()
      }));
    } catch (err) {
      const cached = localStorage.getItem(getCacheKey(from, to));
      if (cached) {
        const data = JSON.parse(cached);
        setRate(data.rate);
        setLastUpdated(data.timestamp);
        setStatus(FetchStatus.SUCCESS);
        setIsOfflineMode(true);
      } else {
        setStatus(FetchStatus.ERROR);
        setErrorMsg("請檢查網路");
      }
    }
  }, []);

  const saveToHistory = useCallback(() => {
    if (!rate || calculatedValue === 0) return;
    const resultVal = (calculatedValue * rate).toFixed(2);
    
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      fromCode: fromCurrency.code,
      toCode: toCurrency.code,
      amount: calculatedValue.toString(), 
      result: resultVal,
      rate: rate,
      timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    };
    const newHistory = [newItem, ...history].slice(0, 20); // Keep more history in modal
    setHistory(newHistory);
    localStorage.setItem('conversionHistory', JSON.stringify(newHistory));
  }, [rate, calculatedValue, fromCurrency, toCurrency, history]);

  // Debounced save
  useEffect(() => {
    if (status === FetchStatus.SUCCESS && rate && calculatedValue > 0) {
      const hasOperators = /[+\-*/]/.test(inputExpression);
      if (!hasOperators && inputExpression !== '0') {
        const timer = setTimeout(() => saveToHistory(), 2000); 
        return () => clearTimeout(timer);
      }
    }
  }, [calculatedValue, rate, status, inputExpression]); 

  useEffect(() => {
    getRate(fromCurrency.code, toCurrency.code);
  }, [fromCurrency.code, toCurrency.code, getRate]);

  const result = rate ? (calculatedValue * rate).toFixed(2) : '---';

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('conversionHistory');
  };

  return (
    // Outer Background (Desktop Centering Wrapper)
    <div className="fixed inset-0 overflow-hidden bg-[#050505] flex items-center justify-center font-sans text-white select-none">
      
      {/* Background Ambience - Global */}
      <div className="absolute top-[-30%] left-[-20%] w-[90%] h-[90%] bg-zinc-800/20 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-[-30%] right-[-20%] w-[90%] h-[90%] bg-zinc-800/15 rounded-full blur-[150px] pointer-events-none" />

      {/* App Container - Mobile: Full / Desktop: Phone Frame */}
      <main className="
        relative z-10 
        w-full h-[100dvh] 
        md:w-[420px] md:h-[90vh] md:max-h-[900px] 
        md:bg-black/80 md:backdrop-blur-3xl 
        md:rounded-[3rem] md:border-[6px] md:border-zinc-800 md:shadow-[0_0_60px_-15px_rgba(0,0,0,0.6)]
        flex flex-col overflow-hidden
        transition-all duration-300 ease-out
      ">
        
        {/* HEADER SECTION */}
        <header className="flex-none flex justify-between items-center px-6 pt-5 pb-2 z-20">
          <div>
             <div className="flex items-center gap-2">
              <h1 className="text-xl font-medium tracking-tight text-white drop-shadow-md">
                  旅遊匯率
              </h1>
              {isOfflineMode && (
                  <div className="flex items-center gap-1 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                      <span className="text-[10px] text-orange-400 font-medium">離線</span>
                  </div>
              )}
             </div>
          </div>
          <button 
              onClick={() => setIsHistoryOpen(true)}
              className="p-2.5 -mr-2 rounded-full hover:bg-white/[0.1] transition-colors group"
              aria-label="歷史紀錄"
          >
              <svg className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
          </button>
        </header>

        {/* DISPLAY SECTION */}
        <section className="flex-none px-4 pb-2 z-10 flex flex-col gap-4">
          
          {/* Main Glass Card */}
          <div className="glass-card rounded-[2.2rem] p-6 relative overflow-hidden flex flex-col justify-center min-h-[190px]">
              {/* Top Shine */}
              <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              
              {/* Input Row */}
              <div className="flex justify-between items-baseline mb-2">
                  <span className="text-2xl text-zinc-500 font-light pl-1">{fromCurrency.code}</span>
                  <div className="text-4xl sm:text-5xl font-extralight tracking-tight overflow-x-auto no-scrollbar whitespace-nowrap text-right w-full pl-4 opacity-90">
                      {inputExpression}
                  </div>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-white/[0.08] my-2" />

              {/* Result Row */}
              <div className="flex justify-between items-baseline">
                  <span className="text-2xl text-orange-400/90 font-light pl-1">{toCurrency.code}</span>
                  <div className="text-5xl sm:text-6xl font-medium tracking-tight text-white overflow-x-auto no-scrollbar whitespace-nowrap text-right w-full pl-4 number-pop" key={result}>
                      {result}
                  </div>
              </div>

              {/* Rate info */}
              <div className="mt-5 flex justify-between items-center text-[10px] text-zinc-500 tracking-wider">
                  <span className="bg-black/30 px-2.5 py-1 rounded-lg border border-white/[0.05] backdrop-blur-sm">
                      1 {fromCurrency.code} ≈ {rate ? rate.toFixed(4) : '...'} {toCurrency.code}
                  </span>
                  <button onClick={() => getRate(fromCurrency.code, toCurrency.code)} className={`p-1.5 hover:bg-white/5 rounded-full transition-colors ${status === FetchStatus.LOADING ? 'animate-spin' : ''}`}>
                      <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                       </svg>
                  </button>
              </div>
          </div>

          {/* Currency Controls Row */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
               <CurrencySelect label="持有" selected={fromCurrency} onClick={() => setSelectingField('from')} />
               <button onClick={handleSwap} className="mt-6 w-11 h-11 rounded-full bg-[#161616] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-white/20 active:rotate-180 transition-all shadow-lg z-10">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
               </button>
               <CurrencySelect label="目標" selected={toCurrency} onClick={() => setSelectingField('to')} />
          </div>

        </section>

        {/* KEYPAD SECTION */}
        <section className="flex-1 min-h-0 z-10 w-full px-2 pb-4 pt-1">
           <CalculatorKeypad 
              onKeyPress={handleKeyPress} 
              onDelete={handleDelete} 
              onClear={handleClear} 
              onCalculate={handleCalculate} 
           />
        </section>

        {/* TOP LEVEL MODALS (Ensures z-index > anything in sections) */}
        
        <HistoryModal 
          isOpen={isHistoryOpen} 
          onClose={() => setIsHistoryOpen(false)} 
          history={history} 
          onClear={clearHistory}
        />

        <CurrencyPickerModal
          isOpen={!!selectingField}
          onClose={() => setSelectingField(null)}
          onSelect={handleCurrencySelect}
          title={selectingField === 'from' ? '選擇持有幣別' : '選擇目標幣別'}
          selectedCurrencyCode={selectingField === 'from' ? fromCurrency.code : toCurrency.code}
        />

      </main>
    </div>
  );
};

export default App;