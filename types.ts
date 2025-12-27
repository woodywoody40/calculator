export interface Currency {
  code: string;
  name: string;
  flag: string;
  symbol: string;
}

export interface ExchangeRateResponse {
  rate: number;
  lastUpdated?: string;
}

export enum FetchStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface HistoryItem {
  id: string;
  fromCode: string;
  toCode: string;
  amount: string;
  result: string;
  rate: number;
  timestamp: string;
}