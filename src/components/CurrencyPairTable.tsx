import React from 'react';
import { CurrencyPair } from '../types/trading';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CurrencyPairTableProps {
  pairs: CurrencyPair[];
  selectedPair: string;
  onPairSelect: (symbol: string) => void;
}

export function CurrencyPairTable({ pairs, selectedPair, onPairSelect }: CurrencyPairTableProps) {
  return (
    <div className="flex-1 p-4 overflow-hidden flex flex-col">
      <h3 className="text-lg font-semibold mb-4 text-gray-200">Market Watch</h3>
      
      <div className="space-y-2 overflow-y-auto flex-1">
        {pairs.map((pair) => (
          <div
            key={pair.id}
            onClick={() => onPairSelect(pair.symbol)}
            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedPair === pair.symbol
                ? 'bg-blue-900 border border-blue-700'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-white">{pair.symbol}</span>
                  {pair.change >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  )}
                </div>
                
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-lg font-mono font-bold text-white">
                    {pair.price.toFixed(4)}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    pair.change >= 0 
                      ? 'bg-green-900 text-green-300' 
                      : 'bg-red-900 text-red-300'
                  }`}>
                    {pair.changePercent}%
                  </span>
                </div>
                
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>H: {pair.high24h.toFixed(4)}</span>
                  <span>L: {pair.low24h.toFixed(4)}</span>
                </div>
                
                <div className="text-xs text-gray-400 mt-1">
                  Vol: {(pair.volume / 1000000).toFixed(1)}M
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}