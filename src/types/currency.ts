export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  country: string;
  decimals: number;
}

export interface ExchangeRatesData {
  base: string;
  date: string;
  timestamp: number;
  rates: Record<string, number>;
  provider: string;
}

export interface HistoricalRatePoint {
  date: string;
  rate: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}

export type TimeframeOption = '7D' | '1M' | '3M' | '6M' | '1Y' | '5Y';

export interface RateAlert {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  targetRate: number;
  condition: 'ABOVE' | 'BELOW';
  createdAt: string;
  triggered: boolean;
  notes?: string;
}

export interface FeeComparisonTier {
  provider: string;
  type: 'midmarket' | 'fintech' | 'bank' | 'card' | 'kiosk';
  feePercentage: number;
  fixedFee: number;
  estimatedDelivery: string;
}
