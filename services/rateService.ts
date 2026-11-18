import { readStored, store } from '../storage';
import { POPULAR_CURRENCIES } from '../constants';

interface Snapshot {
  rates: Record<string, number>;
  updated: number;
  expires: number;
}

function valid(data: Snapshot | null): data is Snapshot {
  return !!data && Number.isFinite(data.updated) && data.updated > 0 &&
    Number.isFinite(data.expires) && data.expires > data.updated &&
    POPULAR_CURRENCIES.every(({ code }) => Number.isFinite(data.rates?.[code]) && data.rates[code] > 0);
}

export function cachedSnapshot(): Snapshot | null {
  const data = readStored('usdRateTable');
  return valid(data) ? data : null;
}

let pending: Promise<Snapshot> | undefined;
export function refreshRates() {
  if (pending) return pending;
  pending = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD', { signal: controller.signal });
      if (!response.ok) throw Error('匯率服務暫時無法使用');
      const data = await response.json();
      const snapshot = { rates: data.rates, updated: data.time_last_update_unix * 1000, expires: data.time_next_update_unix * 1000 };
      if (data.result !== 'success' || data.base_code !== 'USD' || !valid(snapshot)) throw Error('匯率資料不完整');
      store('usdRateTable', snapshot);
      return snapshot;
    } finally {
      clearTimeout(timer);
    }
  })().finally(() => { pending = undefined; });
  return pending;
}
