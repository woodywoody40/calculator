import React, { useState, useEffect, useCallback } from 'react';
import { Currency, FetchStatus, HistoryItem } from './types';
import { POPULAR_CURRENCIES, DEFAULT_FROM_CURRENCY, DEFAULT_TO_CURRENCY } from './constants';
import { fetchLiveExchangeRate } from './services/rateService';
import CurrencySelect from './components/CurrencySelect';
import HistoryList from './components/HistoryList';
import CalculatorKeypad from './components/CalculatorKeypad';

const App: React.FC = () => {
  // State
  const [fromCurrency, setFromCurrency] = useState<Currency>(DEFAULT_FROM_CURRENCY);
  const [toCurrency, setToCurrency] = useState<Currency>(DEFAULT_TO_CURRENCY);
  const [inputExpression, setInputExpression] = useState<string>('1000'); // Store the math expression
  const [calculatedValue, setCalculatedValue] = useState<number>(1000);   // Store the actual number
  const [rate, setRate] = useState<number | null>(null);
  const [status, setStatus] = useState<FetchStatus>(FetchStatus.IDLE);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

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
      // Remove trailing operators for calculation
      const cleanExpr = expression.replace(/[+\-*/]$/, '');
      if (!cleanExpr) return 0;
      
      // Allow only numbers and basic operators
      if (!/^[\d.+\-*/\s]+$/.test(cleanExpr)) return 0;

      // Use Function constructor as a safer eval replacement for math
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${cleanExpr}`)();
      return isFinite(result) ? result : 0;
    } catch (e) {
      return 0;
    }
  };

  // Update calculated value whenever expression changes
  useEffect(() => {
    const newVal = safeCalculate(inputExpression);
    setCalculatedValue(newVal);
  }, [inputExpression]);

  // Keypad Handlers
  const handleKeyPress = (key: string) => {
    setInputExpression(prev => {
      // Prevent multiple decimals in a number segment
      if (key === '.') {
        const segments = prev.split(/[+\-*/]/);
        const currentSegment = segments[segments.length - 1];
        if (currentSegment.includes('.')) return prev;
      }

      // Prevent starting with operators (except - maybe, but keeping simple)
      if (prev === '0' && !['+', '-', '*', '/'].includes(key) && key !== '.') {
         return key;
      }
      
      // Prevent duplicate operators
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
    // Commit the calculation to the input view
    const result = safeCalculate(inputExpression);
    // Format if it has decimals
    const resultStr = Number.isInteger(result) ? result.toString() : result.toFixed(2);
    setInputExpression(resultStr);
  };

  // Standard App Handlers
  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
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
      console.error(err);
      const cached = localStorage.getItem(getCacheKey(from, to));
      if (cached) {
        const data = JSON.parse(cached);
        setRate(data.rate);
        setLastUpdated(data.timestamp);
        setStatus(FetchStatus.SUCCESS);
        setIsOfflineMode(true);
      } else {
        setStatus(FetchStatus.ERROR);
        setErrorMsg("請檢查網路連接");
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
    const newHistory = [newItem, ...history].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('conversionHistory', JSON.stringify(newHistory));
  }, [rate, calculatedValue, fromCurrency, toCurrency, history]);

  // Debounced save
  useEffect(() => {
    if (status === FetchStatus.SUCCESS && rate && calculatedValue > 0) {
      // Don't save if typing expression
      const hasOperators = /[+\-*/]/.test(inputExpression);
      if (!hasOperators) {
        const timer = setTimeout(() => saveToHistory(), 1500); 
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 pb-20 sm:pb-24 relative overflow-hidden bg-[#050505]">
      
      {/* Refined Background: Less opacity, more spread to reduce "muddy" edges */}
      <div className="fixed top-[-30%] left-[-20%] w-[90%] h-[90%] bg-zinc-800/20 rounded-full blur-[180px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }} />
      <div className="fixed bottom-[-30%] right-[-20%] w-[90%] h-[90%] bg-zinc-800/15 rounded-full blur-[150px] pointer-events-none" />
      {/* Subtle highlight in center */}
      <div className="fixed top-[40%] left-[50%] -translate-x-1/2 w-[40%] h-[40%] bg-white/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <main className="w-full max-w-[340px] sm:max-w-md relative z-10 flex flex-col gap-5 sm:gap-6 mx-auto">
        
        {/* Header */}
        <header className="flex justify-between items-end px-2 mb-1 sm:mb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-thin tracking-tight text-white mb-0.5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
              匯率換算
            </h1>
            <p className="text-[10px] sm:text-[11px] text-zinc-500 tracking-[0.2em] font-light uppercase opacity-80">
              Currency Converter
            </p>
          </div>
          {isOfflineMode && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/90 border border-white/5 backdrop-blur-md shadow-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
              <span className="text-[10px] text-zinc-400 font-medium tracking-wide">離線</span>
            </div>
          )}
        </header>

        {/* High Quality Obsidian Glass Card */}
        <div className="glass-card rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden group transition-all duration-500">
          
          {/* Subtle Inner Glow Gradient */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/[0.03] to-transparent opacity-100" />
          
          {/* Top Edge Highlight - Thinner, sharper */}
          <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Display & Input Section */}
          <div className="relative z-10 mb-6 mt-2">
            <div className="flex flex-col items-end gap-1 relative">
              <span className="absolute left-0 top-3 sm:top-4 text-2xl sm:text-3xl font-thin text-zinc-600 select-none font-sans">
                {fromCurrency.symbol}
              </span>
              
              {/* Display Expression / Input */}
              <div className="w-full bg-transparent border-b border-white/[0.08] py-2 pl-10 sm:pl-12 text-right overflow-hidden relative min-h-[60px] flex items-end justify-end">
                  <div className="text-5xl sm:text-6xl font-extralight text-white tracking-tighter font-sans whitespace-nowrap overflow-x-auto no-scrollbar drop-shadow-md">
                     {inputExpression}
                  </div>
              </div>
            </div>
            
            {/* Calculation Preview */}
            {calculatedValue.toString() !== inputExpression && (
              <div className="text-right text-zinc-500 text-sm mt-1 font-mono tracking-wider h-5 flex justify-end items-center gap-2">
                 <span className="opacity-50">=</span> <span>{calculatedValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="relative z-10 flex flex-col gap-4">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 items-center relative">
              <CurrencySelect 
                label="持有" 
                selected={fromCurrency} 
                onSelect={setFromCurrency} 
              />

              <button
                onClick={handleSwap}
                className="mt-6 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-[#1a1a1a] hover:bg-[#252525] border border-white/[0.08] text-zinc-500 hover:text-white transition-all duration-300 shadow-xl active:scale-95 active:rotate-180 z-10"
                aria-label="交換"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>

              <CurrencySelect 
                label="目標" 
                selected={toCurrency} 
                onSelect={setToCurrency} 
              />
            </div>
          </div>

          {/* Result Area */}
          <div className="relative z-10 mt-8 pt-6 border-t border-white/[0.08] text-center">
             <div className="text-[10px] text-zinc-600 tracking-[0.3em] mb-3 font-semibold uppercase">Estimated Total</div>
             <div className="flex items-baseline justify-center gap-2 flex-wrap break-all">
               <span className="text-xl sm:text-2xl text-zinc-600 font-light">{toCurrency.symbol}</span>
               {/* Added key={result} to trigger re-animation, and number-pop class */}
               <span key={result} className="text-4xl sm:text-5xl font-medium text-white tracking-tight drop-shadow-2xl number-pop">{result}</span>
             </div>
             
             {/* Rate & Refresh */}
             <div className="mt-5 flex justify-center items-center gap-4">
                <p className="text-[10px] sm:text-[11px] text-zinc-500 font-mono tracking-wide whitespace-nowrap bg-black/20 px-3 py-1.5 rounded-full border border-white/[0.03] shadow-inner">
                  1 {fromCurrency.code} ≈ {rate ? rate.toFixed(4) : '...'} {toCurrency.code}
                </p>
                
                {status === FetchStatus.LOADING ? (
                   <div className="w-3 h-3 border border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
                ) : (
                  <button onClick={() => getRate(fromCurrency.code, toCurrency.code)} className="opacity-40 hover:opacity-100 transition-opacity p-1">
                     <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                     </svg>
                  </button>
                )}
             </div>
          </div>

          {/* Keypad Section */}
          <div className="mt-6 border-t border-white/[0.05] pt-4 -mx-2">
             <CalculatorKeypad 
                onKeyPress={handleKeyPress}
                onDelete={handleDelete}
                onClear={handleClear}
                onCalculate={handleCalculate}
             />
          </div>

        </div>

        <HistoryList history={history} onClear={clearHistory} />

      </main>
    </div>
  );
};

export default App;