import React, { useState, useEffect } from 'react';
import { tradingEngine } from '../services/tradingEngine';
import { TradingConfig } from '../types/trading';
import { Activity, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

export function StatusPanel() {
  const [config, setConfig] = useState<TradingConfig>(tradingEngine.getConfig());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setConfig(tradingEngine.getConfig());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const volumePercentage = (config.currentVolume / config.maxVolume) * 100;
  const remainingVolume = config.maxVolume - config.currentVolume;

  return (
    <div className="p-4 border-b border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-white flex items-center space-x-2">
        <Activity className="h-5 w-5 text-blue-400" />
        <span>Trading Status</span>
      </h3>
      
      <div className="space-y-4">
        {/* Auto Trading Status */}
        <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              config.autoTradingEnabled ? 'bg-green-400' : 'bg-red-400'
            }`} />
            <span className="text-sm font-medium text-white">Auto Trading</span>
          </div>
          <span className={`text-xs px-2 py-1 rounded ${
            config.autoTradingEnabled 
              ? 'bg-green-900 text-green-300' 
              : 'bg-red-900 text-red-300'
          }`}>
            {config.autoTradingEnabled ? 'Active' : 'Stopped'}
          </span>
        </div>

        {/* Volume Limit */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-white">Volume Used</span>
            </div>
            <span className="text-sm text-gray-300">
              {volumePercentage.toFixed(1)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-600 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                volumePercentage >= 90 
                  ? 'bg-red-500' 
                  : volumePercentage >= 70 
                  ? 'bg-yellow-500' 
                  : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(volumePercentage, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-gray-400">
            <span>${config.currentVolume.toLocaleString()}</span>
            <span>${config.maxVolume.toLocaleString()}</span>
          </div>
        </div>

        {/* Current Strategy */}
        <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium text-white">Strategy</span>
          </div>
          <span className="text-xs text-blue-400">SMA Crossover</span>
        </div>

        {/* Warning if near limit */}
        {volumePercentage >= 80 && (
          <div className="flex items-center space-x-2 p-3 bg-yellow-900 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <div className="text-xs text-yellow-300">
              <div className="font-medium">Volume limit warning</div>
              <div>${remainingVolume.toLocaleString()} remaining</div>
            </div>
          </div>
        )}

        {/* Reset Button */}
        <button
          onClick={() => {
            tradingEngine.resetTrading();
            setConfig(tradingEngine.getConfig());
          }}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Reset Trading
        </button>
      </div>
    </div>
  );
}