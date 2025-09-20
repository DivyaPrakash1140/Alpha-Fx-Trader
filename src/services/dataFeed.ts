import { CurrencyPair } from '../types/trading';
import { tradingApi } from './tradingApi';
import { tradingEngine } from './tradingEngine';

class DataFeedService {
  private subscribers: ((data: CurrencyPair[]) => void)[] = [];
  private isRunning = false;
  private cleanup?: () => void;
  private currencyPairs: CurrencyPair[] = [];

  async start() {
    if (this.isRunning) return;

    // Initialize API with currency pairs
    const pairs: [string, string][] = [
      ['EUR', 'USD'],
      ['GBP', 'USD'],
      ['USD', 'JPY'],
      ['AUD', 'USD'],
      ['USD', 'CAD']
    ];

    // Start the API service
    await tradingApi.initialize(pairs);

    // Subscribe to API updates
    const unsubscribe = tradingApi.subscribe(pairs => {
      this.currencyPairs = pairs;
      // Update trading engine with new prices
      pairs.forEach(pair => {
        tradingEngine.addPriceData(pair.symbol, pair.price);
      });
      this.notifySubscribers();
    });

    // Store unsubscribe function for cleanup
    this.isRunning = true;
    this.cleanup = unsubscribe;
  }

  stop() {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = undefined;
    }
    this.isRunning = false;
  }

  subscribe(callback: (data: CurrencyPair[]) => void) {
    this.subscribers.push(callback);
    
    // Initial data push
    if (this.currencyPairs.length > 0) {
      callback(this.currencyPairs);
    }
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback([...this.currencyPairs]));
  }

  getCurrentPrices(): CurrencyPair[] {
    return [...this.currencyPairs];
  }

  getPairBySymbol(symbol: string): CurrencyPair | undefined {
    return this.currencyPairs.find(pair => pair.symbol === symbol);
  }
}

export const dataFeedService = new DataFeedService();