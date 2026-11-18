import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Currency, HistoryItem } from './types';
import { DEFAULT_FROM_CURRENCY, DEFAULT_TO_CURRENCY, POPULAR_CURRENCIES } from './constants';
import { calculate } from './calculate';
import { readStored, store } from './storage';
import { Decimal } from 'decimal.js';
import { cachedSnapshot, refreshRates } from './services/rateService';
import HistoryList from './components/HistoryList';
import CalculatorKeypad from './components/CalculatorKeypad';
import CurrencyPickerModal from './components/CurrencyPickerModal';

const App: React.FC = () => {
  const [{ fromCurrency, toCurrency }, setPair] = useState(() => {
    const saved = readStored('currencyPair');
    return {
      fromCurrency: POPULAR_CURRENCIES.find(currency => currency.code === saved?.from) ?? DEFAULT_FROM_CURRENCY,
      toCurrency: POPULAR_CURRENCIES.find(currency => currency.code === saved?.to) ?? DEFAULT_TO_CURRENCY,
    };
  });

  function selectPair(fromCurrency: Currency, toCurrency: Currency) {
    store('currencyPair', { from: fromCurrency.code, to: toCurrency.code });
    setPair({ fromCurrency, toCurrency });
    lastSavedRef.current = '';
  }
  const [inputExpression, setInputExpression] = useState<string>('0'); 
  const calculatedValue = calculate(inputExpression);
  const [snapshot, setSnapshot] = useState(cachedSnapshot);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const same = fromCurrency.code === toCurrency.code;
  const legacy = useMemo(() => {
    if (snapshot || same) return null;
    const entry = readStored(`rate_${fromCurrency.code}_${toCurrency.code}`);
    return Number.isFinite(entry?.rate) && entry.rate > 0 ? entry : null;
  }, [snapshot, same, fromCurrency.code, toCurrency.code]);
  const rate = same ? new Decimal(1) : snapshot
    ? new Decimal(snapshot.rates[toCurrency.code]).div(snapshot.rates[fromCurrency.code]) : legacy ? new Decimal(legacy.rate) : null;
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = readStored('conversionHistory');
    return Array.isArray(saved) ? saved.filter(item => item && Number.isFinite(item.rate) &&
      ['id', 'fromCode', 'toCode', 'amount', 'result', 'timestamp'].every(key => typeof item[key] === 'string')).slice(0, 20) : [];
  });
  const [selectingField, setSelectingField] = useState<'from' | 'to' | null>(null);
  const [swapRotation, setSwapRotation] = useState(0);
  const lastSavedRef = useRef('');
  const reload = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try { setSnapshot(await refreshRates()); }
    catch { setFailed(true); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    if (same) return;
    if (!snapshot || snapshot.expires <= Date.now()) { void reload(); return; }
    const timer = setTimeout(reload, snapshot.expires - Date.now());
    return () => clearTimeout(timer);
  }, [snapshot?.expires, same, reload]);

  const handleKeyPress = (key: string) => {
    setInputExpression(prev => {
      if (prev.length >= 128) return prev;
      if (key === '.') {
        const segments = prev.split(/[+\-*/]/);
        if (segments[segments.length - 1].includes('.')) return prev;
      }
      if (prev === '0' && !['+', '-', '*', '/'].includes(key) && key !== '.') return key;
      const isOperator = ['+', '-', '*', '/'].includes(key);
      if (isOperator && ['+', '-', '*', '/'].includes(prev.slice(-1))) return prev.slice(0, -1) + key;
      return prev + key;
    });
  };

  const handleDelete = () => setInputExpression(prev => prev.length <= 1 ? '0' : prev.slice(0, -1));
  const handleClear = () => {
    setInputExpression('0');
    lastSavedRef.current = ''; 
  };
  const handleCalculate = () => {
    if (calculatedValue) setInputExpression(calculatedValue.toFixed());
  };

  const handleSwap = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSwapRotation(prev => prev + 180);
    selectPair(toCurrency, fromCurrency);
  };
  
  const handleCurrencySelect = (currency: Currency) => {
    if (selectingField === 'from') selectPair(currency, toCurrency);
    else if (selectingField === 'to') selectPair(fromCurrency, currency); 
  };

  const resultVal = calculatedValue && rate ? calculatedValue.mul(rate).toFixed(2) : '—';
  const numericRate = rate?.toNumber();
  useEffect(() => {
    if (resultVal === '—' || !numericRate || !/^-?[0-9]*[.]?[0-9]+$/.test(inputExpression) || Number(inputExpression) === 0) return;
    const identity = [fromCurrency.code, toCurrency.code, inputExpression, resultVal].join('_');
    const timer = setTimeout(() => {
      if (lastSavedRef.current === identity) return;
      lastSavedRef.current = identity;
      const item = { id: Date.now().toString(), fromCode: fromCurrency.code, toCode: toCurrency.code,
        amount: inputExpression, result: resultVal, rate: numericRate, timestamp: new Date().toLocaleTimeString('zh-TW') };
      setHistory(previous => [item, ...previous].slice(0, 20));
    }, 1500);
    return () => clearTimeout(timer);
  }, [numericRate, inputExpression, resultVal, fromCurrency.code, toCurrency.code]);
  useEffect(() => { store('conversionHistory', history); }, [history]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center font-sans text-white select-none">
      <main className="
        relative z-10 
        w-full h-full
        md:w-[390px] md:h-[min(850px,100dvh)]
        md:bg-black 
        md:rounded-[3rem] md:border-[8px] md:border-[#1a1a1a] md:shadow-2xl
        flex flex-col overflow-hidden
      ">
        
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-container snap-y snap-mandatory">
          
          <section className="h-full w-full flex flex-col snap-start shrink-0 overflow-hidden">
            <div className="flex-none h-[43%] flex flex-col px-4 pt-6 pb-2">
              <div className="flex-1 bg-[#111111] rounded-[2.5rem] relative flex flex-col border border-white/5 shadow-2xl overflow-hidden">
                  <button 
                    onClick={() => setSelectingField('from')}
                    className={`flex-1 flex flex-col justify-center px-7 active:bg-white/[0.02] transition-all duration-300 text-left `}
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
                        aria-label="交換幣別" onClick={handleSwap}
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
                    className={`flex-1 flex flex-col justify-center px-7 active:bg-white/[0.02] transition-all duration-300 text-right `}
                  >
                      <div className="flex items-center justify-end gap-2 mb-1">
                        <svg className="w-3 h-3 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                        </svg>
                        <span className="text-sm text-[#d97746] font-bold">{toCurrency.flag} {toCurrency.code}</span>
                        <span className="text-[10px] text-[#d97746] font-black tracking-[0.2em] bg-[#d97746]/10 px-2 py-0.5 rounded border border-[#d97746]/20 uppercase">等於</span>
                      </div>
                      <div className={`text-5xl font-semibold tracking-tighter text-white overflow-x-auto no-scrollbar whitespace-nowrap transition-all duration-700 `}>
                          {resultVal}
                      </div>
                  </button>

                  <div className="bg-zinc-900/40 px-7 py-2.5 flex flex-col border-t border-white/[0.02] gap-1 relative overflow-hidden">
                      <div className="flex justify-between items-center gap-2 text-xs text-zinc-300">
                        <span aria-live="polite">{!calculatedValue ? '算式無效或超出範圍' : rate
                          ? `1 ${fromCurrency.code} ≈ ${rate.toSignificantDigits(6)} ${toCurrency.code}`
                          : loading ? '匯率載入中…' : '暫無匯率'}</span>
                        <button onClick={reload} disabled={loading} className="p-2 text-white">{loading ? '更新中…' : '更新匯率'}</button>
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {same ? '相同幣別' : legacy ? '舊版快取匯率' : failed ? (snapshot ? '更新失敗，使用快取' : '連線失敗，請重試') : '每日參考匯率'}
                        {!same && snapshot && ' · ' + new Date(snapshot.updated).toLocaleDateString('zh-TW')}
                        {' · '}<a href="https://www.exchangerate-api.com">ExchangeRate-API</a>
                      </div>
                  </div>
              </div>
            </div>

            <div className="flex-none h-[55%] w-full px-4 pb-4 pt-1 overflow-hidden">
               <CalculatorKeypad onKeyPress={handleKeyPress} onDelete={handleDelete} onClear={handleClear} onCalculate={handleCalculate} />
            </div>

            <div className="flex-none h-[2%] flex justify-center items-start opacity-10">
               <div className="w-8 h-1 bg-white rounded-full"></div>
            </div>
          </section>

          <section className="min-h-full w-full px-6 py-12 bg-black snap-start shrink-0 border-t border-zinc-900">
             <HistoryList history={history} onClear={() => {setHistory([]); lastSavedRef.current = '';}} />
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