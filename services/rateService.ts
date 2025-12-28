import { ExchangeRateResponse } from "../types";

/**
 * 使用 rter.info API 獲取匯率。
 * 透過 allorigins.win 代理來解決純前端環境的 CORS 限制。
 */
export const fetchLiveExchangeRate = async (
  fromCode: string,
  toCode: string
): Promise<ExchangeRateResponse> => {
  try {
    const targetUrl = `https://tw.rter.info/capi.php`;
    // 使用 CORS 代理
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}&ts=${Date.now()}`;
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`Proxy Request failed: ${response.status}`);
    }

    const wrapper = await response.json();
    // allorigins 會將原始 JSON 字串放在 contents 屬性中
    const data = JSON.parse(wrapper.contents);
    
    const getUSDToCurrencyRate = (code: string): number => {
      if (code === 'USD') return 1;
      const key = `USD${code}`;
      // RTER 的資料結構中可能包含不規則字串，增加防呆
      const entry = data[key];
      return entry && entry.Exrate ? parseFloat(entry.Exrate) : 0;
    };

    const usdFrom = getUSDToCurrencyRate(fromCode);
    const usdTo = getUSDToCurrencyRate(toCode);

    if (usdFrom === 0 || usdTo === 0) {
      throw new Error(`無法解析 ${fromCode} 或 ${toCode} 的匯率。`);
    }

    const crossRate = usdTo / usdFrom;

    return {
      rate: crossRate,
      lastUpdated: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
    };

  } catch (error) {
    console.error("RTER API Fetch Error:", error);
    throw error;
  }
};