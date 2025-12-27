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
            
            {/* 上半部：顯示區 (38dvh) - 使用絕對定位或固定高度確保不與鍵盤重疊 */}
            <div className="flex-none h-[38dvh] flex flex-col px-4 pt-4 pb-2">
              
              {/* 匯率顯示卡片 - 進一步精簡以容納切換按鈕 */}
              <div className="flex-1 bg-[#111111] rounded-[1.8rem] px-5 py-4 relative flex flex-col justify-center border border-white/5 shadow-inner min-h-0 overflow-hidden">
                  {/* From */}
                  <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-zinc-500 font-black uppercase tracking-widest">{fromCurrency.code}</span>
                      <div className="text-3xl font-light tracking-tight overflow-x-auto no-scrollbar whitespace-nowrap text-right pl-4 text-white">
                          {inputExpression}
                      </div>
                  </div>

                  {/* Divider */}
                  <div className="w-full h-[1px] bg-zinc-800/40 my-2"></div>

                  {/* To */}
                  <div className="flex justify-between items-center">
                      <span className="text-xs text-[#d97746] font-black uppercase tracking-widest">{toCurrency.code}</span>
                      <div className="text-4xl font-normal tracking-tight text-white overflow-x-auto no-scrollbar whitespace-nowrap text-right pl-4">
                          {resultVal}
                      </div>
                  </div>

                  {/* 匯率浮標 */}
                  <div className="mt-3 flex justify-between items-center">
                      <div className="bg-zinc-900/60 px-2 py-0.5 rounded border border-white/5">
                          <span className="text-[9px] text-zinc-500 font-bold tracking-widest">
                              1 {fromCurrency.code} ≈ {rate ? rate.toFixed(4) : '...'} {toCurrency.code}
                          </span>
                      </div>
                      <button onClick={() => getRate(fromCurrency.code, toCurrency.code)} className={`p-1 text-zinc-600 active:text-white transition-all ${status === FetchStatus.LOADING ? 'animate-spin' : ''}`}>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                      </button>
                  </div>
              </div>

              {/* 幣別選擇與切換 - 緊湊排列 */}
              <div className="mt-3 flex-none grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
                   <CurrencySelect selected={fromCurrency} onClick={() => setSelectingField('from')} />
                   <button onClick={handleSwap} className="w-9 h-9 rounded-full bg-[#1c1c1c] flex items-center justify-center text-[#d97746] active:scale-90 transition-all border border-zinc-800/50">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                   </button>
                   <CurrencySelect selected={toCurrency} onClick={() => setSelectingField('to')} />
              </div>
            </div>

            {/* 下半部：鍵盤區 (嚴格佔據 60dvh) */}
            <div className="flex-none h-[60dvh] w-full px-4 pb-4 pt-1 overflow-hidden">
               <CalculatorKeypad onKeyPress={handleKeyPress} onDelete={handleDelete} onClear={handleClear} onCalculate={handleCalculate} />
            </div>

            {/* 極簡滾動指示器 (2dvh) */}
            <div className="flex-none h-[2dvh] flex justify-center items-start opacity-20">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
               </svg>
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