import React from 'react';
import { Trade } from '../types/trading';
import { format } from 'date-fns';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface TradeBlotterProps {
  trades: Trade[];
}

export function TradeBlotter({ trades }: TradeBlotterProps) {
  const getStatusIcon = (status: Trade['status']) => {
    switch (status) {
      case 'FILLED':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-gray-400" />;
      case 'REJECTED':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: Trade['status']) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'FILLED':
        return `${baseClasses} bg-green-900 text-green-300`;
      case 'PENDING':
        return `${baseClasses} bg-yellow-900 text-yellow-300`;
      case 'CANCELLED':
        return `${baseClasses} bg-gray-700 text-gray-300`;
      case 'REJECTED':
        return `${baseClasses} bg-red-900 text-red-300`;
      default:
        return baseClasses;
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 h-full flex flex-col overflow-hidden">
      <h3 className="text-lg font-semibold mb-4 text-white flex items-center space-x-2">
        <CheckCircle className="h-5 w-5 text-blue-400" />
        <span>Trade Blotter</span>
        <span className="text-sm text-gray-400">({trades.length} trades)</span>
      </h3>
      
      <div className="overflow-y-auto flex-1">
        {trades.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No trades executed yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {trades.map((trade) => (
              <div
                key={trade.id}
                className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(trade.status)}
                    <span className="font-semibold text-white">{trade.symbol}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      trade.type === 'BUY' 
                        ? 'bg-green-900 text-green-300' 
                        : 'bg-red-900 text-red-300'
                    }`}>
                      {trade.type}
                    </span>
                  </div>
                  
                  <span className={getStatusBadge(trade.status)}>
                    {trade.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Quantity:</span>
                    <span className="ml-2 text-white font-mono">
                      {trade.quantity.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Price:</span>
                    <span className="ml-2 text-white font-mono">
                      {trade.price.toFixed(4)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Value:</span>
                    <span className="ml-2 text-white font-mono">
                      ${(trade.quantity * trade.price).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Time:</span>
                    <span className="ml-2 text-white">
                      {format(trade.timestamp, 'HH:mm:ss')}
                    </span>
                  </div>
                </div>
                
                {trade.strategy && (
                  <div className="mt-2 text-xs text-blue-400">
                    Strategy: {trade.strategy}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}