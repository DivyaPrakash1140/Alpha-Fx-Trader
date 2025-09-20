import React, { useState } from 'react';
import { tradingEngine } from '../services/tradingEngine';
import { dataFeedService } from '../services/dataFeed';
import { DollarSign, TrendingUp, TrendingDown, Zap } from 'lucide-react';

interface TradingPanelProps {
  selectedPair: string;
}

export function TradingPanel({ selectedPair }: TradingPanelProps) {
  const [quantity, setQuantity] = useState<number>(10000);
  const [loading, setLoading] = useState<string>('');

  const currentPair = dataFeedService.getPairBySymbol(selectedPair);
  
  const executeTrade = async (type: 'BUY' | 'SELL') => {
    if (!currentPair) return;
    
    setLoading(type);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate execution delay
      tradingEngine.executeTrade(selectedPair, type, quantity, currentPair.price);
    } catch (error) {
      console.error('Trade execution failed:', error);
      alert(error instanceof Error ? error.message : 'Trade execution failed');
    } finally {
      setLoading('');
    }
  };

  const tradeValue = currentPair ? quantity * currentPair.price : 0;
  const config = tradingEngine.getConfig();
  const canTrade = config.currentVolume + tradeValue <= config.maxVolume;

  return (
    <div className="p-6 h-full flex flex-col overflow-y-auto">
      <h3 className="text-lg font-semibold mb-6 text-white flex items-center space-x-2">
        <Zap className="h-5 w-5 text-yellow-400" />
        <span>Trading Panel</span>
      </h3>

      {currentPair && (
        <div className="space-y-6 flex-1">
          {/* Current Pair Info */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-center">
              <h4 className="text-xl font-bold text-white mb-2">{currentPair.symbol}</h4>
              <div className="text-3xl font-mono font-bold text-white mb-2">
                {currentPair.price.toFixed(4)}
              </div>
              <div className={`text-sm px-3 py-1 rounded-full inline-block ${
                currentPair.change >= 0 
                  ? 'bg-green-900 text-green-300' 
                  : 'bg-red-900 text-red-300'
              }`}>
                {currentPair.change >= 0 ? '+' : ''}
                {currentPair.change.toFixed(4)} ({currentPair.changePercent}%)
              </div>
            </div>
          </div>

          {/* Trade Size Input */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Trade Size
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter quantity"
              min="1000"
              step="1000"
            />
            <div className="text-sm text-gray-400">
              Trade Value: ${tradeValue.toLocaleString()}
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {[10000, 50000, 100000].map((amount) => (
              <button
                key={amount}
                onClick={() => setQuantity(amount)}
                className="py-2 px-3 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
              >
                {amount >= 1000 ? `${amount/1000}K` : amount}
              </button>
            ))}
          </div>

          {/* Trade Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => executeTrade('BUY')}
              disabled={loading === 'BUY' || !canTrade}
              className="w-full py-4 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {loading === 'BUY' ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <TrendingUp className="h-5 w-5" />
                  <span>BUY</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => executeTrade('SELL')}
              disabled={loading === 'SELL' || !canTrade}
              className="w-full py-4 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {loading === 'SELL' ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <TrendingDown className="h-5 w-5" />
                  <span>SELL</span>
                </>
              )}
            </button>
          </div>

          {!canTrade && (
            <div className="text-sm text-yellow-400 text-center p-3 bg-yellow-900 rounded-lg">
              Trade would exceed volume limit
            </div>
          )}

          {/* Auto Trading Info */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h5 className="font-semibold text-white mb-2">Auto Trading</h5>
            <div className="text-sm text-gray-300 space-y-1">
              <div>Strategy: SMA Crossover (5/20)</div>
              <div>Status: {config.autoTradingEnabled ? 'Active' : 'Stopped'}</div>
              <div>Volume Used: {((config.currentVolume / config.maxVolume) * 100).toFixed(1)}%</div>
            </div>
          </div>

          {/* Market Info */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h5 className="font-semibold text-white mb-2">Market Info</h5>
            <div className="text-sm text-gray-300 space-y-1">
              <div className="flex justify-between">
                <span>24h High:</span>
                <span className="font-mono">{currentPair.high24h.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span>24h Low:</span>
                <span className="font-mono">{currentPair.low24h.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span>24h Volume:</span>
                <span>{(currentPair.volume / 1000000).toFixed(1)}M</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}