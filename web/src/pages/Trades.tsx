import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatCurrency, formatNumber, formatDate, cn } from '../lib/utils';
import { useState } from 'react';

const COINS = ['All', 'ETH', 'BTC', 'SOL', 'ARB', 'LINK'];

export function Trades() {
  const [selectedCoin, setSelectedCoin] = useState('All');
  const [page, setPage] = useState(0);
  const limit = 20;
  
  const { data } = useQuery({
    queryKey: ['trades', selectedCoin, page],
    queryFn: () => api.trades.list({ 
      limit, 
      offset: page * limit,
      coin: selectedCoin === 'All' ? undefined : selectedCoin 
    }),
  });

  const trades = data?.data || [];
  const total = data?.pagination?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Trade History</h1>
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {COINS.map((coin) => (
            <button
              key={coin}
              onClick={() => { setSelectedCoin(coin); setPage(0); }}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                selectedCoin === coin
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {coin}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Time</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Asset</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Side</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Size</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Price</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Fee</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">P&L</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr key={trade.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30">
                  <td className="py-3 px-4 text-muted-foreground">{formatDate(trade.timestamp)}</td>
                  <td className="py-3 px-4 font-medium">{trade.coin}</td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      trade.side === 'BUY' 
                        ? 'bg-green-500/10 text-green-500' 
                        : 'bg-red-500/10 text-red-500'
                    )}>
                      {trade.side}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">{formatNumber(trade.size)}</td>
                  <td className="py-3 px-4 text-right">${formatNumber(trade.price, 2)}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">${formatNumber(trade.fee, 4)}</td>
                  <td className={cn(
                    'py-3 px-4 text-right font-medium',
                    trade.pnl === undefined ? 'text-muted-foreground' :
                    trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                  )}>
                    {trade.pnl !== undefined ? formatCurrency(trade.pnl) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
        
        {trades.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No trades found
          </div>
        )}
      </div>
    </div>
  );
}