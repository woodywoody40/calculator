import { ExchangeRateResponse } from "../types";

/**
 * Fetches the exchange rate using the standard open.er-api.com API.
 */
export const fetchLiveExchangeRate = async (
  fromCode: string,
  toCode: string
): Promise<ExchangeRateResponse> => {
  try {
    // Using open.er-api.com (ExchangeRate-API) standard endpoint
    const response = await fetch(`https://open.er-api.com/v6/latest/${fromCode}`);
    
    if (!response.ok) {
      throw new Error(`API Request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.result !== 'success') {
       throw new Error("API Error: " + (data['error-type'] || 'Unknown error'));
    }

    const rate = data.rates[toCode];

    if (typeof rate !== 'number') {
       throw new Error(`Rate for ${toCode} not found in API response.`);
    }

    return {
      rate: rate,
      lastUpdated: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
    };

  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    throw error;
  }
};