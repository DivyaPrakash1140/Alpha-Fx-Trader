import { CurrencyPair } from '../types/trading';

interface ForexResponse {
  'Realtime Currency Exchange Rate': {
    '1. From_Currency Code': string;
    '2. From_Currency Name': string;
    '3. To_Currency Code': string;
    '4. To_Currency Name': string;
    '5. Exchange Rate': string;
    '6. Last Refreshed': string;
    '7. Time Zone': string;
    '8. Bid Price': string;
    '9. Ask Price': string;
  };
}

class TradingApi {
  private readonly API_KEY = '8FL86UXVBAYLEAFY';
  private readonly BASE_URL = 'https://www.alphavantage.co/query';
  private lastPrices: Record<string, number> = {};
  private subscribers: ((pairs: CurrencyPair[]) => void)[] = [];
  private updateIntervals: NodeJS.Timeout[] = [];
  private currencyPairs: CurrencyPair[] = [];

  constructor() {
    this.currencyPairs = [];
  }

  public async initialize(pairs: [string, string][]): Promise<void> {
    // Clear any existing intervals
    this.stopUpdates();

    // Initial fetch for all pairs
    await Promise.all(pairs.map(pair => this.fetchCurrencyPair(pair[0], pair[1])));

    // Set up periodic updates
    pairs.forEach(([base, quote]) => {
      const interval = setInterval(
        () => this.fetchCurrencyPair(base, quote),
        60000 // Update every minute
      );
      this.updateIntervals.push(interval);
    });
  }

  public subscribe(callback: (pairs: CurrencyPair[]) => void): () => void {
    this.subscribers.push(callback);
    callback(this.currencyPairs); // Initial callback with current data

    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  public async getCurrentPairs(): Promise<CurrencyPair[]> {
    // Refresh data before returning
    const pairs = this.currencyPairs.map(pair => [pair.base, pair.quote] as [string, string]);
    await Promise.all(pairs.map(([base, quote]) => this.fetchCurrencyPair(base, quote)));
    return [...this.currencyPairs];
  }

  public stopUpdates(): void {
    this.updateIntervals.forEach(clearInterval);
    this.updateIntervals = [];
  }

  private async fetchCurrencyPair(fromCurrency: string, toCurrency: string): Promise<void> {
    try {
      console.log(`Fetching ${fromCurrency}/${toCurrency} data...`);
      const url = `${this.BASE_URL}?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${this.API_KEY}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ForexResponse = await response.json();
      
      console.log(`Received data for ${fromCurrency}/${toCurrency}:`, data);

      if (data['Realtime Currency Exchange Rate']) {
        this.updateCurrencyPair(data);
      } else {
        console.error('No real-time exchange rate data in response:', data);
      }
    } catch (error) {
      console.error(`Error fetching ${fromCurrency}/${toCurrency}:`, error);
    }
  }

  private updateCurrencyPair(data: ForexResponse): void {
    const rate = data['Realtime Currency Exchange Rate'];
    const fromCurrency = rate['1. From_Currency Code'];
    const toCurrency = rate['3. To_Currency Code'];
    const symbol = `${fromCurrency}/${toCurrency}`;
    const currentPrice = parseFloat(rate['5. Exchange Rate']);
    const lastPrice = this.lastPrices[symbol] || currentPrice;

    const newPair: CurrencyPair = {
      id: `${fromCurrency}${toCurrency}`,
      symbol,
      base: fromCurrency,
      quote: toCurrency,
      price: currentPrice,
      change: currentPrice - lastPrice,
      changePercent: ((currentPrice - lastPrice) / lastPrice) * 100,
      high24h: Math.max(currentPrice, this.getExistingHigh(symbol) || currentPrice),
      low24h: Math.min(currentPrice, this.getExistingLow(symbol) || currentPrice),
      volume: 0,
      lastUpdate: new Date(rate['6. Last Refreshed'])
    };

    // Update last price for next comparison
    this.lastPrices[symbol] = currentPrice;

    // Update currency pairs
    const existingIndex = this.currencyPairs.findIndex(p => p.symbol === symbol);
    if (existingIndex >= 0) {
      this.currencyPairs[existingIndex] = newPair;
    } else {
      this.currencyPairs.push(newPair);
    }

    // Notify subscribers
    this.notifySubscribers();
  }

  private getExistingHigh(symbol: string): number | null {
    const existing = this.currencyPairs.find(p => p.symbol === symbol);
    return existing ? existing.high24h : null;
  }

  private getExistingLow(symbol: string): number | null {
    const existing = this.currencyPairs.find(p => p.symbol === symbol);
    return existing ? existing.low24h : null;
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.currencyPairs));
  }

  // Helper method to format prices
  public static formatPrice(price: number): string {
    return price.toFixed(5);
  }

  // Helper method to format percent changes
  public static formatPercent(percent: number): string {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  }
}

// Create and export a singleton instance
export const tradingApi = new TradingApi();

// Export the class for testing purposes
export type { ForexResponse };
export { TradingApi };
