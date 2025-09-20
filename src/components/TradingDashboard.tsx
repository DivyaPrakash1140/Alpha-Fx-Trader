import { useState, useEffect } from 'react';
import { PriceChart } from './PriceChart';
import { CurrencyPairTable } from './CurrencyPairTable';
import { TradeBlotter } from './TradeBlotter';
import { TradingRecords } from './TradingRecords';
import { TradingPanel } from './TradingPanel';
import { StatusPanel } from './StatusPanel';
import { CurrencyPair, Trade } from '../types/trading';
import { dataFeedService } from '../services/dataFeed';
import { tradingEngine } from '../services/tradingEngine';
import { tradingApi } from '../services/tradingApi';
import { TrendingUp, Activity, Zap, Settings, BarChart3, List } from 'lucide-react';

export function TradingDashboard() {
  const [currencyPairs, setCurrencyPairs] = useState<CurrencyPair[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedPair, setSelectedPair] = useState<string>('EUR/USD');
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'blotter' | 'records'>('blotter');

  // Setup forex data fetching
  useEffect(() => {
    const pairs: [string, string][] = [
      ['EUR', 'USD'],
      ['GBP', 'USD'],
      ['USD', 'JPY'],
      ['AUD', 'USD']
    ];

    let isCleanedUp = false;

    async function initializeServices() {
      if (isCleanedUp) return;
      
      try {
        console.log('Initializing trading services...');
        
        // First, initialize the trading API
        await tradingApi.initialize(pairs);
        console.log('Trading API initialized');

        // Start the data feed service
        await dataFeedService.start();
        console.log('Data feed service started');

        // Start the trading engine
        await tradingEngine.start();
        console.log('Trading engine started');

        // Get initial data
        const initialPairs = await tradingApi.getCurrentPairs();
        if (!isCleanedUp) {
          setCurrencyPairs(initialPairs);
          setIsConnected(true);
          console.log('Initial data loaded:', initialPairs);
        }
      } catch (error) {
        console.error('Error initializing services:', error);
        if (!isCleanedUp) {
          setIsConnected(false);
        }
      }
    }

    // Subscribe to real-time updates
    const priceUpdateUnsubscribe = tradingApi.subscribe(pairs => {
      if (!isCleanedUp) {
        console.log('Received price update:', pairs);
        setCurrencyPairs(pairs);
        setIsConnected(true);
      }
    });

    // Subscribe to trade updates
    const tradeUpdateUnsubscribe = tradingEngine.subscribeTrades(updatedTrades => {
      if (!isCleanedUp) {
        console.log('Received trade update:', updatedTrades);
        setTrades(updatedTrades);
      }
    });

    // Initialize everything
    initializeServices();

    // Cleanup
    return () => {
      console.log('Cleaning up trading dashboard...');
      isCleanedUp = true;
      
      // Clean up subscriptions
      priceUpdateUnsubscribe();
      console.log('Price update subscription cleaned up');
      
      tradeUpdateUnsubscribe();
      console.log('Trade update subscription cleaned up');

      // Stop services in reverse order
      Promise.all([
        tradingEngine.stop().catch(err => console.error('Error stopping trading engine:', err)),
        tradingApi.stop().catch(err => console.error('Error stopping trading API:', err)),
        dataFeedService.stop().catch(err => console.error('Error stopping data feed:', err))
      ]).then(() => console.log('All services stopped'));

      setIsConnected(false);
    };
  }, []);

  const selectedPairData = currencyPairs.find(pair => pair.symbol === selectedPair);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">AlphaFxTrader</h1>
              <p className="text-sm text-gray-400">Professional Forex Trading Platform</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-sm text-gray-300">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
              <Settings className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)] overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden">
          <StatusPanel />
          <CurrencyPairTable
            pairs={currencyPairs}
            selectedPair={selectedPair}
            onPairSelect={setSelectedPair}
          />
        </div>

        {/* Center Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chart Section */}
          <div className="h-96 p-6">
            <div className="bg-gray-800 rounded-lg p-6 h-full overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Activity className="h-5 w-5 text-blue-400" />
                  <h2 className="text-lg font-semibold">{selectedPair}</h2>
                  {selectedPairData && (
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-mono font-bold">
                        {selectedPairData.price.toFixed(4)}
                      </span>
                      <span className={`text-sm px-2 py-1 rounded ${
                        selectedPairData.change >= 0 
                          ? 'bg-green-900 text-green-300' 
                          : 'bg-red-900 text-red-300'
                      }`}>
                        {selectedPairData.change >= 0 ? '+' : ''}
                        {selectedPairData.change.toFixed(4)} ({selectedPairData.changePercent}%)
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-gray-400">SMA Strategy Active</span>
                </div>
              </div>
              
              <div className="h-[calc(100%-4rem)]">
                <PriceChart symbol={selectedPair} />
              </div>
            </div>
          </div>

          {/* Trade Section with Tabs */}
          <div className="flex-1 p-6 pt-0 overflow-hidden flex flex-col">
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-4">
              <button
                onClick={() => setActiveTab('blotter')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'blotter'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <List className="h-4 w-4" />
                <span>Trade Blotter</span>
              </button>
              <button
                onClick={() => setActiveTab('records')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'records'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Trading Records</span>
              </button>
            </div>
            
            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'blotter' ? (
                <TradeBlotter trades={trades} />
              ) : (
                <TradingRecords trades={trades} />
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-hidden">
          <TradingPanel selectedPair={selectedPair} />
        </div>
      </div>
    </div>
  );
}