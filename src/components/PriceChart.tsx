import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { tradingEngine } from '../services/tradingEngine';
import { MovingAverage } from '../types/trading';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PriceChartProps {
  symbol: string;
}

export function PriceChart({ symbol }: PriceChartProps) {
  const [maData, setMaData] = useState<MovingAverage[]>([]);


  useEffect(() => {
    console.log('Initializing chart for symbol:', symbol);
    
    // Get initial data
    const movingAverages = tradingEngine.calculateMovingAverages(symbol);
    console.log('Initial MA data:', movingAverages);
    setMaData(movingAverages.slice(-50)); // Show last 50 data points

    // Subscribe to price updates
    const unsubscribe = tradingEngine.subscribe((updatedSymbol, updatedMaData) => {
      if (updatedSymbol === symbol) {
        console.log('Received MA update for', updatedSymbol, ':', updatedMaData.length, 'points');
        setMaData(updatedMaData.slice(-50));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [symbol]);

  const chartData = {
    labels: maData.map(d => format(d.timestamp, 'HH:mm:ss')),
    datasets: [
      {
        label: 'Price',
        data: maData.map(d => d.price),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        label: 'SMA 5',
        data: maData.map(d => d.sma5),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        label: 'SMA 20',
        data: maData.map(d => d.sma20),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#D1D5DB',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#1F2937',
        titleColor: '#F3F4F6',
        bodyColor: '#D1D5DB',
        borderColor: '#374151',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time',
          color: '#9CA3AF',
        },
        grid: {
          color: '#374151',
        },
        ticks: {
          color: '#9CA3AF',
          maxTicksLimit: 8,
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Price',
          color: '#9CA3AF',
        },
        grid: {
          color: '#374151',
        },
        ticks: {
          color: '#9CA3AF',
          callback: function(value: any) {
            return typeof value === 'number' ? value.toFixed(4) : value;
          },
        },
      },
    },
  };

  // Add signal markers
  const signalData = maData.filter(d => d.signal !== 'HOLD');
  
  return (
    <div className="relative h-full">
      <Line data={chartData} options={options} />
      
      {/* Signal indicators */}
      {signalData.length > 0 && (
        <div className="absolute top-4 right-4 space-y-1">
          {signalData.slice(-3).map((signal, index) => (
            <div
              key={index}
              className={`px-2 py-1 rounded text-xs font-medium ${
                signal.signal === 'BUY'
                  ? 'bg-green-900 text-green-300'
                  : 'bg-red-900 text-red-300'
              }`}
            >
              {signal.signal} @ {signal.price.toFixed(4)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}