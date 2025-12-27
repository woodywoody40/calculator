import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Currency, FetchStatus, HistoryItem } from './types';
import { DEFAULT_FROM_CURRENCY, DEFAULT_TO_CURRENCY } from './constants';
import { fetchLiveExchangeRate } from './services/rateService';
import CurrencySelect from './components/CurrencySelect';
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
  const scrollRef = useRef<HTMLDivElement>(null);

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
    <div className="fixed inset-0 bg-black flex items-center justify-center font-sans text-white select-none">
      <main className="
        relative z-10 
        w-full h-full
        md:w-[390px] md:h-[850px] 
        md:bg-black 
        md:rounded-[3rem] md:border-[8px] md:border-[#1a1a1a] md:shadow-2xl
        flex flex-col overflow-hidden
      ">
        
        {/* 全域捲動容器 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar scroll-container snap-y snap-mandatory">
          
          {/* 第一屏：計算機主介面 (100dvh) */}
          <section className="h-[100dvh] w-full flex flex-col snap-start shrink-0 overflow-hidden">
            
            {/* 上半部：顯示區 (43dvh - 稍微增加一點空間給更清晰的 UI) */}
            <div className="flex-none h-[43dvh] flex flex-col px-4 pt-4 pb-2">
              
              {/* 匯率顯示卡片 - 極致清晰設計 */}
              <div className="flex-1 bg-[#111111] rounded-[2.2rem] px-6 py-5 relative flex flex-col justify-between border border-white/5 shadow-2xl min-h-0">
                  
                  {/* From Section */}
                  <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] bg-zinc-900 px-2 py-0.5 rounded border border-white/5">持有</span>
                          <span className="text-sm text-zinc-400 font-bold uppercase">{fromCurrency.code}</span>
                        </div>
                        {/* 匯率浮動指示 */}
                        <div className="text-[10px] text-zinc-600 font-medium">
                          1 {fromCurrency.code} = {rate ? rate.toFixed(4) : '...'} {toCurrency.code}
                        </div>
                      </div>
                      <div className="text-4xl font-light tracking-tight overflow-x-auto no-scrollbar whitespace-nowrap text-left text-zinc-300">
                          {inputExpression}
                      </div>
                  </div>

                  {/* 視覺引導線 */}
                  <div className="flex items-center gap-4">
                      <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-zinc-800"></div>
                      <div className="p-1 rounded-full bg-zinc-900 border border-zinc-800">
                        <svg className="w-4 h-4 text-[#d97746]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </div>
                      <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-zinc-800"></div>
                  </div>

                  {/* To Section */}
                  <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <button onClick={() => getRate(fromCurrency.code, toCurrency.code)} className={`p-1 text-zinc-600 active:text-[#d97746] ${status === FetchStatus.LOADING ? 'animate-spin' : ''}`}>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[#d97746] font-bold uppercase">{toCurrency.code}</span>
                          <span className="text-[10px] text-[#d97746] font-black uppercase tracking-[0.2em] bg-[#d97746]/10 px-2 py-0.5 rounded border border-[#d97746]/20">換算</span>
                        </div>
                      </div>
                      <div className="text-5xl font-semibold tracking-tighter text-white overflow-x-auto no-scrollbar whitespace-nowrap text-right">
                          {resultVal}
                      </div>
                  </div>
              </div>

              {/* 幣別切換列 */}
              <div className="mt-3 flex-none grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
                   <CurrencySelect selected={fromCurrency} onClick={() => setSelectingField('from')} />
                   <button onClick={handleSwap} className="w-10 h-10 rounded-full bg-[#1c1c1c] flex items-center justify-center text-[#d97746] active:scale-90 transition-all border border-zinc-800/50 shadow-lg">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                   </button>
                   <CurrencySelect selected={toCurrency} onClick={() => setSelectingField('to')} />
              </div>
            </div>

            {/* 下半部：鍵盤區 (改為嚴格 55dvh) */}
            <div className="flex-none h-[55dvh] w-full px-4 pb-4 pt-1 overflow-hidden">
               <CalculatorKeypad onKeyPress={handleKeyPress} onDelete={handleDelete} onClear={handleClear} onCalculate={handleCalculate} />
            </div>

            {/* 滑動指示器 (2dvh) */}
            <div className="flex-none h-[2dvh] flex justify-center items-start opacity-10">
               <div className="w-8 h-1 bg-white rounded-full"></div>
            </div>
          </section>

          {/* 第二屏：歷史紀錄 */}
          <section className="min-h-[100dvh] w-full px-6 py-12 bg-black snap-start shrink-0 border-t border-zinc-900">
             <HistoryList history={history} onClear={() => {setHistory([]); localStorage.removeItem('conversionHistory');}} />
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

        {/* 幣別選擇彈窗 */}
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