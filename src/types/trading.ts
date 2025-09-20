export interface CurrencyPair {
  id: string;
  symbol: string;
  base: string;
  quote: string;
  price: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  volume: number;
  lastUpdate: Date;
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: Date;
  status: 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  pnl?: number;
  strategy?: string;
  value: number;
  fees?: number;
}

export interface MovingAverage {
  timestamp: Date;
  price: number;
  sma5: number;
  sma20: number;
  signal?: 'BUY' | 'SELL' | 'HOLD';
}

export interface TradingConfig {
  maxVolume: number;
  currentVolume: number;
  autoTradingEnabled: boolean;
  selectedPair: string;
  smaShortPeriod: number;
  smaLongPeriod: number;
}