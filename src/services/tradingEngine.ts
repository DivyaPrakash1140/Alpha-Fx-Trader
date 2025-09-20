import { Trade, MovingAverage, TradingConfig } from '../types/trading';
import { tradingApi } from './tradingApi';

export class TradingEngine {
  private priceHistory: Map<string, number[]> = new Map();
  private trades: Trade[] = [];
  private tradeSubscribers: ((trades: Trade[]) => void)[] = [];
  private config: TradingConfig = {
    maxVolume: 10000000, // 10 million
    currentVolume: 0,
    autoTradingEnabled: true,
    selectedPair: 'EUR/USD',
    smaShortPeriod: 5,
    smaLongPeriod: 20
  };

  constructor() {}

  public async start() {
    // Initialize price history and start monitoring
    await this.initializePriceHistory();
    this.monitorPrice();
  }

  private async initializePriceHistory() {
    // Get initial data and set up history
    const currentPairs = await tradingApi.getCurrentPairs();
    
    // Initialize history with empty arrays for each pair
    currentPairs.forEach(pair => {
      const prices: number[] = [];
      if (pair.price) {
        prices.push(pair.price);
      }
      this.priceHistory.set(pair.symbol, prices);
    });

    // Subscribe to real-time updates
    return new Promise<void>((resolve) => {
      tradingApi.subscribe((currencyPairs) => {
        let initialized = false;
        currencyPairs.forEach((pair) => {
          if (pair.price) {
          this.addPriceData(pair.symbol, pair.price);
        }
      });
    });
  }

  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    
    const slice = prices.slice(-period);
    const sum = slice.reduce((acc, price) => acc + price, 0);
    return Number((sum / period).toFixed(4));
  }

  public calculateMovingAverages(symbol: string): MovingAverage[] {
    const prices = this.priceHistory.get(symbol) || [];
    const results: MovingAverage[] = [];
    
    for (let i = this.config.smaLongPeriod - 1; i < prices.length; i++) {
      const priceSlice = prices.slice(0, i + 1);
      const sma5 = this.calculateSMA(priceSlice, this.config.smaShortPeriod);
      const sma20 = this.calculateSMA(priceSlice, this.config.smaLongPeriod);
      
      let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
      
      // Simple crossover strategy
      if (sma5 > sma20 && i > 0) {
        const prevSma5 = this.calculateSMA(prices.slice(0, i), this.config.smaShortPeriod);
        const prevSma20 = this.calculateSMA(prices.slice(0, i), this.config.smaLongPeriod);
        if (prevSma5 <= prevSma20) {
          signal = 'BUY';
        }
      } else if (sma5 < sma20 && i > 0) {
        const prevSma5 = this.calculateSMA(prices.slice(0, i), this.config.smaShortPeriod);
        const prevSma20 = this.calculateSMA(prices.slice(0, i), this.config.smaLongPeriod);
        if (prevSma5 >= prevSma20) {
          signal = 'SELL';
        }
      }
      
      results.push({
        timestamp: new Date(Date.now() - (prices.length - i - 1) * 60000),
        price: prices[i],
        sma5,
        sma20,
        signal
      });
    }
    
    return results;
  }

  public addPriceData(symbol: string, price: number) {
    const prices = this.priceHistory.get(symbol) || [];
    
    // Always add new price data
    prices.push(price);
    
    // Keep only last 200 prices
    if (prices.length > 200) {
      prices.shift();
    }
    
    this.priceHistory.set(symbol, prices);
    
    // Calculate new MA data
    const maData = this.calculateMovingAverages(symbol);
    
    // Notify subscribers of new MA data
    this.maSubscribers.forEach(callback => {
      callback(symbol, maData);
    });
    
    // Check for trading signals if auto trading is enabled
    if (this.config.autoTradingEnabled && this.config.currentVolume < this.config.maxVolume) {
      this.checkTradingSignals(symbol, price);
    }
  }

  private checkTradingSignals(symbol: string, currentPrice: number) {
    if (!this.config.autoTradingEnabled) return;
    
    const ma = this.calculateMovingAverages(symbol);
    if (ma.length < 2) return;

    const latest = ma[ma.length - 1];
    const previous = ma[ma.length - 2];
    
    // Only trade if we have a change in signal
    if (latest && latest.signal !== 'HOLD' && latest.signal !== previous.signal) {
      if (latest.signal === 'BUY' || latest.signal === 'SELL') {
        try {
          console.log(`Executing ${latest.signal} trade for ${symbol} at ${currentPrice}`);
          this.executeTrade(symbol, latest.signal, 10000, currentPrice);
        } catch (error) {
          console.error('Error executing trade:', error);
        }
      }
    }
  }

  private executeTrade(symbol: string, type: 'BUY' | 'SELL', quantity: number, price: number): Trade {
    const tradeValue = quantity * price;
    
    if (this.config.currentVolume + tradeValue > this.config.maxVolume) {
      throw new Error('Trade would exceed volume limit');
    }
    
    const fees = tradeValue * 0.0001; // 0.01% fee
    
    const trade: Trade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol,
      type,
      quantity,
      price,
      timestamp: new Date(),
      status: 'FILLED',
      strategy: 'SMA Crossover',
      value: tradeValue,
      fees
    };
    
    this.trades.push(trade);
    this.config.currentVolume += tradeValue;
    
    // Auto-stop if volume limit reached
    if (this.config.currentVolume >= this.config.maxVolume) {
      this.config.autoTradingEnabled = false;
    }

    // Notify subscribers of new trade
    const sortedTrades = [...this.trades].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    this.tradeSubscribers.forEach(callback => callback(sortedTrades));

    return trade;
  }

  private monitorPrice() {
    // Check price signals based on real-time data from tradingApi
    setInterval(() => {
      this.priceHistory.forEach((prices, symbol) => {
        if (prices.length > 0) {
          const currentPrice = prices[prices.length - 1];
          this.checkTradingSignals(symbol, currentPrice);
          // Update subscribers with new moving averages
          this.maSubscribers.forEach(callback => {
            const maData = this.calculateMovingAverages(symbol);
            callback(symbol, maData);
          });
        }
      });
    }, 1000);
  }

  // Moving Average subscribers
  private maSubscribers: ((symbol: string, data: MovingAverage[]) => void)[] = [];

  public subscribe(callback: (symbol: string, data: MovingAverage[]) => void): () => void {
    this.maSubscribers.push(callback);
    return () => {
      this.maSubscribers = this.maSubscribers.filter(cb => cb !== callback);
    };
  }

  public getTrades(): Trade[] {
    return [...this.trades].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getConfig(): TradingConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<TradingConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public getPriceHistory(symbol: string): number[] {
    return [...(this.priceHistory.get(symbol) || [])];
  }

  public resetTrading() {
    this.trades = [];
    this.config.currentVolume = 0;
    this.config.autoTradingEnabled = true;
  }
}

// Export singleton instance
export const tradingEngine = new TradingEngine();