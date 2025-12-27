import { Currency } from './types';

export const POPULAR_CURRENCIES: Currency[] = [
  { code: 'TWD', name: '新台幣', flag: '🇹🇼', symbol: 'NT$' },
  { code: 'JPY', name: '日圓', flag: '🇯🇵', symbol: '¥' },
  { code: 'USD', name: '美金', flag: '🇺🇸', symbol: '$' },
  { code: 'EUR', name: '歐元', flag: '🇪🇺', symbol: '€' },
  { code: 'KRW', name: '韓元', flag: '🇰🇷', symbol: '₩' },
  { code: 'CNY', name: '人民幣', flag: '🇨🇳', symbol: '¥' },
  { code: 'HKD', name: '港幣', flag: '🇭🇰', symbol: 'HK$' },
  { code: 'THB', name: '泰銖', flag: '🇹🇭', symbol: '฿' },
  { code: 'GBP', name: '英鎊', flag: '🇬🇧', symbol: '£' },
  { code: 'SGD', name: '新加坡幣', flag: '🇸🇬', symbol: 'S$' },
  { code: 'AUD', name: '澳幣', flag: '🇦🇺', symbol: 'A$' },
  { code: 'VND', name: '越南盾', flag: '🇻🇳', symbol: '₫' },
];

export const DEFAULT_FROM_CURRENCY = POPULAR_CURRENCIES[1]; // JPY
export const DEFAULT_TO_CURRENCY = POPULAR_CURRENCIES[0];   // TWD