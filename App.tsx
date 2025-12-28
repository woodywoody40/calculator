import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Currency, FetchStatus, HistoryItem } from './types';
import { DEFAULT_FROM_CURRENCY, DEFAULT_TO_CURRENCY } from './constants';
import { fetchLiveExchangeRate } from './services/rateService';
import HistoryList from './components/HistoryList';
import CalculatorKeypad from './components/CalculatorKeypad';
import CurrencyPickerModal from './components/CurrencyPickerModal';

const App: React.FC = () => {
  const [fromCurrency, setFromCurrency] = useState<Currency>(DEFAULT_FROM_CURRENCY);
  const [toCurrency, setToCurrency] = useState<Currency>(DEFAULT_TO_CURRENCY);
  const [inputExpression, setInputExpression] = useState<string>('0'); 
  const [calculatedValue, setCalculatedValue] = useState<number>(0);   
  const [rate, setRate] = useState<number | null>(null);
  const [status, setStatus] = useState<FetchStatus>(FetchStatus.IDLE);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectingField, setSelectingField] = useState<'from' | 'to' | null>(null);
  const [swapRotation, setSwapRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false); 
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const lastSavedRef = useRef<string>('');

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
  const handleClear = () => {
    setInputExpression('0');
    lastSavedRef.current = ''; 
  };
  const handleCalculate = () => {
    const result = safeCalculate(inputExpression);
    setInputExpression(Number.isInteger(result) ? result.toString() : result.toFixed(2));
  };

  const handleSwap = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnimating(true);
    setSwapRotation(prev => prev + 180);
    
    setTimeout(() => {
      setFromCurrency(toCurrency);
      setToCurrency(fromCurrency);
      setIsAnimating(false);
      lastSavedRef.current = ''; 
    }, 150);
  };
  
  const handleCurrencySelect = (currency: Currency) => {
    if (selectingField === 'from') setFromCurrency(currency);
    else if (selectingField === 'to') setToCurrency(currency);
    lastSavedRef.current = ''; 
  };

  const getRate = useCallback(async (from: string, to: string) => {
    setStatus(FetchStatus.LOADING);
    try {
      const data = await fetchLiveExchangeRate(from, to);
      setRate(data.rate);
      setStatus(FetchStatus.SUCCESS);
      
      setShowUpdateSuccess(true);
      setTimeout(() => setShowUpdateSuccess(false), 2000);

      localStorage.setItem(`rate_${from}_${to}`, JSON.stringify({ rate: data.rate, date: new Date().toISOString() }));
    } catch (err) {
      console.error("Fetch failed:", err);
      const cached = localStorage.getItem(`rate_${from}_${to}`);
      if (cached) {
        const data = JSON.parse(cached);
        setRate(data.rate);
        setStatus(FetchStatus.SUCCESS); // 雖然失敗但有快取，我們維持 SUCCESS 顯示快取值
      } else {
        setStatus(FetchStatus.ERROR);
      }
    }
  }, []);

  const saveToHistory = useCallback(() => {
    if (!rate || calculatedValue === 0) return;
    const currentIdentity = `${fromCurrency.code}_${toCurrency.code}_${calculatedValue}`;
    if (lastSavedRef.current === currentIdentity) return;

    const newItem: HistoryItem = {
      id: Date.now().toString(),
      fromCode: fromCurrency.code,
      toCode: toCurrency.code,
      amount: calculatedValue.toString(), 
      result: (calculatedValue * rate).toFixed(2),
      rate: rate,
      timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    };

    setHistory(prev => {
      const newHistory = [newItem, ...prev].slice(0, 20);
      localStorage.setItem('conversionHistory', JSON.stringify(newHistory));
      return newHistory;
    });

    lastSavedRef.current = currentIdentity;
  }, [rate, calculatedValue, fromCurrency.code, toCurrency.code]); 

  useEffect(() => {
    if (status === FetchStatus.SUCCESS && rate && calculatedValue > 0) {
      if (!/[+\-*/]/.test(inputExpression) && inputExpression !== '0') {
        const timer = setTimeout(() => saveToHistory(), 1500); 
        return () => clearTimeout(timer);
      }
    }
  }, [calculatedValue, rate, status, inputExpression, saveToHistory]); 

  useEffect(() => {
    getRate(fromCurrency.code, toCurrency.code);
  }, [fromCurrency.code, toCurrency.code, getRate]);

  const resultVal = rate ? (calculatedValue * rate).toFixed(2) : '0.00';

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center font-sans text-white select-none">
      <main className="
        relative z-10 
        w-full h-full
        md:w-[390px] md:h-[850px] 
        md:bg-black 
        md:rounded-[3rem] md:border-[8px] md:border-[#1a1a1a] md:shadow-2xl
        flex flex-col overflow-hidden
      ">
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar scroll-container snap-y snap-mandatory">
          
          <section className="h-[100dvh] w-full flex flex-col snap-start shrink-0 overflow-hidden">
            <div className="flex-none h-[43dvh] flex flex-col px-4 pt-6 pb-2">
              <div className="flex-1 bg-[#111111] rounded-[2.5rem] relative flex flex-col border border-white/5 shadow-2xl overflow-hidden">
                  <button 
                    onClick={() => setSelectingField('from')}
                    className={`flex-1 flex flex-col justify-center px-7 active:bg-white/[0.02] transition-all duration-300 text-left ${isAnimating ? 'opacity-40 scale-[0.98] blur-[1px]' : 'opacity-100 scale-100 blur-0'}`}
                  >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-zinc-500 font-black tracking-[0.2em] bg-zinc-900 px-2 py-0.5 rounded border border-white/5 uppercase">持有</span>
                        <span className="text-sm text-zinc-400 font-bold">{fromCurrency.flag} {fromCurrency.code}</span>
                        <svg className="w-3 h-3 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      <div className="text-4xl font-light tracking-tight overflow-x-auto no-scrollbar whitespace-nowrap text-zinc-200">
                          {inputExpression}
                      </div>
                  </button>

                  <div className="relative h-[1px] bg-white/5 mx-7">
                      <button 
                        onClick={handleSwap}
                        style={{ transform: `translate(-50%, -50%) rotate(${swapRotation}deg)` }}
                        className="absolute left-1/2 top-1/2 w-10 h-10 rounded-full bg-[#1c1c1c] border border-zinc-800 flex items-center justify-center text-[#d97746] shadow-xl active:scale-90 transition-all duration-500 ease-in-out z-20"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </button>
                  </div>

                  <button 
                    onClick={() => setSelectingField('to')}
                    className={`flex-1 flex flex-col justify-center px-7 active:bg-white/[0.02] transition-all duration-300 text-right ${isAnimating ? 'opacity-40 scale-[0.98] blur-[1px]' : 'opacity-100 scale-100 blur-0'}`}
                  >
                      <div className="flex items-center justify-end gap-2 mb-1">
                        <svg className="w-3 h-3 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                        </svg>
                        <span className="text-sm text-[#d97746] font-bold">{toCurrency.flag} {toCurrency.code}</span>
                        <span className="text-[10px] text-[#d97746] font-black tracking-[0.2em] bg-[#d97746]/10 px-2 py-0.5 rounded border border-[#d97746]/20 uppercase">等於</span>
                      </div>
                      <div className={`text-5xl font-semibold tracking-tighter text-white overflow-x-auto no-scrollbar whitespace-nowrap transition-all duration-700 ${showUpdateSuccess ? 'text-green-400 scale-[1.02]' : 'text-white scale-100'}`}>
                          {resultVal}
                      </div>
                  </button>

                  <div className="bg-zinc-900/40 px-7 py-2.5 flex flex-col border-t border-white/[0.02] gap-1 relative overflow-hidden">
                      {/* 背景成功同步動畫 */}
                      <div className={`absolute inset-0 bg-green-500/10 pointer-events-none transition-opacity duration-1000 ${showUpdateSuccess ? 'opacity-100' : 'opacity-0'}`} />
                      
                      <div className="flex justify-between items-center w-full relative z-10">
                          <div className={`text-[10px] font-bold tracking-widest transition-colors duration-500 ${showUpdateSuccess ? 'text-green-400' : status === FetchStatus.ERROR ? 'text-red-500' : 'text-zinc-500'}`}>
                            {status === FetchStatus.ERROR ? '連線失敗，顯示最後數據' : `1 ${fromCurrency.code} ≈ ${rate ? rate.toFixed(4) : '...'} ${toCurrency.code}`}
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); getRate(fromCurrency.code, toCurrency.code); }} 
                            className={`text-zinc-600 hover:text-white transition-all ${status === FetchStatus.LOADING ? 'animate-spin opacity-40' : 'active:scale-90'}`}
                          >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                          </button>
                      </div>
                      
                      <div className="text-[8px] text-zinc-700 font-medium tracking-tight uppercase flex items-center justify-between relative z-10">
                         <span className="opacity-50">Data by RTER.info (Proxy)</span>
                         <div className="flex items-center gap-1.5">
                            {showUpdateSuccess && (
                              <span className="text-green-400 font-black animate-pulse flex items-center gap-1">
                                <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                UPDATED
                              </span>
                            )}
                            <div className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-full border border-white/5">
                               <span className={`w-1.5 h-1.5 rounded-full ${status === FetchStatus.SUCCESS ? 'bg-green-500 animate-pulse' : status === FetchStatus.ERROR ? 'bg-red-500' : 'bg-zinc-600'}`}></span>
                               <span className={status === FetchStatus.SUCCESS ? 'text-green-500/80' : status === FetchStatus.ERROR ? 'text-red-500/80' : 'text-zinc-600'}>
                                 {status === FetchStatus.ERROR ? 'OFFLINE' : 'LIVE'}
                               </span>
                            </div>
                         </div>
                      </div>
                  </div>
              </div>
            </div>

            <div className="flex-none h-[55dvh] w-full px-4 pb-4 pt-1 overflow-hidden">
               <CalculatorKeypad onKeyPress={handleKeyPress} onDelete={handleDelete} onClear={handleClear} onCalculate={handleCalculate} />
            </div>

            <div className="flex-none h-[2dvh] flex justify-center items-start opacity-10">
               <div className="w-8 h-1 bg-white rounded-full"></div>
            </div>
          </section>

          <section className="min-h-[100dvh] w-full px-6 py-12 bg-black snap-start shrink-0 border-t border-zinc-900">
             <HistoryList history={history} onClear={() => {setHistory([]); localStorage.removeItem('conversionHistory'); lastSavedRef.current = '';}} />
             {history.length === 0 && (
               <div className="py-24 text-center opacity-20 flex flex-col items-center justify-center">
                 <svg className="w-12 h-12 mb-4 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 <span className="text-xs tracking-[0.4em] font-light uppercase">No Records</span>
               </div>
             )}
          </section>
        </div>

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