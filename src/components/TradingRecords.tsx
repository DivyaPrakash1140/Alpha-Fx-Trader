import React, { useState, useEffect } from 'react';
import { Trade } from '../types/trading';
import { format } from 'date-fns';
import { 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Download, 
  Calendar,
  DollarSign,
  BarChart3
} from 'lucide-react';

interface TradingRecordsProps {
  trades: Trade[];
}

export function TradingRecords({ trades }: TradingRecordsProps) {
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'timestamp' | 'value' | 'symbol'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredTrades = trades.filter(trade => {
    if (filter !== 'ALL' && trade.type !== filter) return false;
    
    const now = new Date();
    const tradeDate = new Date(trade.timestamp);
    
    switch (dateFilter) {
      case 'TODAY':
        return tradeDate.toDateString() === now.toDateString();
      case 'WEEK':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return tradeDate >= weekAgo;
      case 'MONTH':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return tradeDate >= monthAgo;
      default:
        return true;
    }
  }).sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'timestamp':
        aValue = new Date(a.timestamp).getTime();
        bValue = new Date(b.timestamp).getTime();
        break;
      case 'value':
        aValue = a.value;
        bValue = b.value;
        break;
      case 'symbol':
        aValue = a.symbol;
        bValue = b.symbol;
        break;
      default:
        return 0;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Calculate statistics
  const buyTrades = filteredTrades.filter(t => t.type === 'BUY');
  const sellTrades = filteredTrades.filter(t => t.type === 'SELL');
  const totalBuyValue = buyTrades.reduce((sum, t) => sum + t.value, 0);
  const totalSellValue = sellTrades.reduce((sum, t) => sum + t.value, 0);
  const totalFees = filteredTrades.reduce((sum, t) => sum + (t.fees || 0), 0);

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Symbol', 'Type', 'Quantity', 'Price', 'Value', 'Fees', 'Strategy', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredTrades.map(trade => [
        format(trade.timestamp, 'yyyy-MM-dd'),
        format(trade.timestamp, 'HH:mm:ss'),
        trade.symbol,
        trade.type,
        trade.quantity,
        trade.price.toFixed(4),
        trade.value.toFixed(2),
        (trade.fees || 0).toFixed(2),
        trade.strategy || '',
        trade.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading_records_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
          <BarChart3 className="h-6 w-6 text-blue-400" />
          <span>Trading Records</span>
        </h3>
        
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-sm text-gray-300">Buy Orders</span>
          </div>
          <div className="text-xl font-bold text-white">{buyTrades.length}</div>
          <div className="text-sm text-gray-400">${totalBuyValue.toLocaleString()}</div>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingDown className="h-4 w-4 text-red-400" />
            <span className="text-sm text-gray-300">Sell Orders</span>
          </div>
          <div className="text-xl font-bold text-white">{sellTrades.length}</div>
          <div className="text-sm text-gray-400">${totalSellValue.toLocaleString()}</div>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-gray-300">Total Volume</span>
          </div>
          <div className="text-xl font-bold text-white">{filteredTrades.length}</div>
          <div className="text-sm text-gray-400">${(totalBuyValue + totalSellValue).toLocaleString()}</div>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-gray-300">Total Fees</span>
          </div>
          <div className="text-xl font-bold text-white">${totalFees.toFixed(2)}</div>
          <div className="text-sm text-gray-400">0.01% per trade</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'ALL' | 'BUY' | 'SELL')}
            className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Trades</option>
            <option value="BUY">Buy Only</option>
            <option value="SELL">Sell Only</option>
          </select>
        </div>
        
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as 'TODAY' | 'WEEK' | 'MONTH' | 'ALL')}
          className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Time</option>
          <option value="TODAY">Today</option>
          <option value="WEEK">Last Week</option>
          <option value="MONTH">Last Month</option>
        </select>
        
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-');
            setSortBy(field as 'timestamp' | 'value' | 'symbol');
            setSortOrder(order as 'asc' | 'desc');
          }}
          className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
        >
          <option value="timestamp-desc">Newest First</option>
          <option value="timestamp-asc">Oldest First</option>
          <option value="value-desc">Highest Value</option>
          <option value="value-asc">Lowest Value</option>
          <option value="symbol-asc">Symbol A-Z</option>
          <option value="symbol-desc">Symbol Z-A</option>
        </select>
      </div>

      {/* Records Table */}
      <div className="flex-1 overflow-y-auto">
        {filteredTrades.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No trading records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-700 sticky top-0">
                <tr>
                  <th className="text-left p-3 text-gray-300 font-medium">Date/Time</th>
                  <th className="text-left p-3 text-gray-300 font-medium">Symbol</th>
                  <th className="text-left p-3 text-gray-300 font-medium">Type</th>
                  <th className="text-right p-3 text-gray-300 font-medium">Quantity</th>
                  <th className="text-right p-3 text-gray-300 font-medium">Price</th>
                  <th className="text-right p-3 text-gray-300 font-medium">Value</th>
                  <th className="text-right p-3 text-gray-300 font-medium">Fees</th>
                  <th className="text-left p-3 text-gray-300 font-medium">Strategy</th>
                  <th className="text-left p-3 text-gray-300 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map((trade, index) => (
                  <tr 
                    key={trade.id}
                    className={`border-b border-gray-700 hover:bg-gray-700 transition-colors ${
                      index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'
                    }`}
                  >
                    <td className="p-3">
                      <div className="text-white font-mono text-xs">
                        <div>{format(trade.timestamp, 'MMM dd, yyyy')}</div>
                        <div className="text-gray-400">{format(trade.timestamp, 'HH:mm:ss')}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-white">{trade.symbol}</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.type === 'BUY' 
                          ? 'bg-green-900 text-green-300' 
                          : 'bg-red-900 text-red-300'
                      }`}>
                        {trade.type}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-mono text-white">
                        {trade.quantity.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-mono text-white">
                        {trade.price.toFixed(4)}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-mono text-white">
                        ${trade.value.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-mono text-gray-400">
                        ${(trade.fees || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-blue-400 text-xs">
                        {trade.strategy || 'Manual'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.status === 'FILLED' 
                          ? 'bg-green-900 text-green-300'
                          : trade.status === 'PENDING'
                          ? 'bg-yellow-900 text-yellow-300'
                          : 'bg-red-900 text-red-300'
                      }`}>
                        {trade.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}