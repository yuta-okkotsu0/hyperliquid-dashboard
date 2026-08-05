import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatCurrency, formatNumber, formatDate, cn } from '../lib/utils';
import { useState } from 'react';
import { TrendingUp, TrendingDown, Target, Clock, Brain } from 'lucide-react';
import { TradeModal } from '../components/TradeModal';

const COINS = ['All', 'ETH', 'BTC', 'SOL', 'ARB', 'LINK'];

export function Trades() {
  const [selectedCoin, setSelectedCoin] = useState('All');
  const [page, setPage] = useState(0);
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const limit = 20;

  // Fetch open positions
  const { data: positionsData } = useQuery({
    queryKey: ['positions', 'open'],
    queryFn: () => api.positions.list('open'),
  });

  // Fetch closed trades
  const { data: tradesData } = useQuery({
    queryKey: ['trades', selectedCoin, page],
    queryFn: () => api.trades.list({
      limit,
      offset: page * limit,
      coin: selectedCoin === 'All' ? undefined : selectedCoin
    }),
  });

  const positions = positionsData?.data || [];
  const trades = tradesData?.data || [];
  const total = tradesData?.pagination?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const longPositions = positions.filter((p: any) => p.side === 'LONG');
  const shortPositions = positions.filter((p: any) => p.side === 'SHORT');

  const handlePositionClick = (position: any) => {
    setSelectedPosition(position);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Trades</h1>

      {/* Open Positions Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Target className="text-primary" size={20} />
          Open Positions ({positions.length})
        </h2>

        {positions.length === 0 ? (
          <div className="bg-card rounded-lg border border-border p-8 text-center text-muted-foreground">
            No open positions
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Longs */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-green-500 flex items-center gap-2">
                <TrendingUp size={16} />
                Longs ({longPositions.length})
              </h3>
              {longPositions.map((position: any) => (
                <PositionCard
                  key={position.id}
                  position={position}
                  onClick={() => handlePositionClick(position)}
                />
              ))}
              {longPositions.length === 0 && (
                <p className="text-sm text-muted-foreground">No open longs</p>
              )}
            </div>

            {/* Shorts */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-red-500 flex items-center gap-2">
                <TrendingDown size={16} />
                Shorts ({shortPositions.length})
              </h3>
              {shortPositions.map((position: any) => (
                <PositionCard
                  key={position.id}
                  position={position}
                  onClick={() => handlePositionClick(position)}
                />
              ))}
              {shortPositions.length === 0 && (
                <p className="text-sm text-muted-foreground">No open shorts</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Closed Trades Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="text-primary" size={20} />
            Trade History
          </h2>
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
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Entry</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Exit</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Fee</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">P&L</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Info</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade: any) => (
                  <tr
                    key={trade.id}
                    className="border-b border-border/50 last:border-0 hover:bg-secondary/30 cursor-pointer"
                    onClick={() => handlePositionClick(trade)}
                  >
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
                    <td className="py-3 px-4 text-right text-muted-foreground">
                      {trade.exitPrice ? `$${formatNumber(trade.exitPrice, 2)}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground">${formatNumber(trade.fee, 4)}</td>
                    <td className={cn(
                      'py-3 px-4 text-right font-medium',
                      trade.pnl === undefined ? 'text-muted-foreground' :
                        trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                    )}>
                      {trade.pnl !== undefined ? formatCurrency(trade.pnl) : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Brain size={16} className="text-primary mx-auto" />
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

      <TradeModal
        position={selectedPosition}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

// Position Card Component
function PositionCard({ position, onClick }: { position: any; onClick: () => void }) {
  const pnlPercent = position.entryPrice > 0
    ? ((position.markPrice - position.entryPrice) / position.entryPrice) * (position.side === 'LONG' ? 1 : -1) * 100
    : 0;

  const liqDistance = position.liquidationPrice && position.markPrice
    ? Math.abs((position.markPrice - position.liquidationPrice) / position.markPrice) * 100
    : null;

  return (
    <div
      onClick={onClick}
      className="bg-card rounded-lg border border-border p-4 cursor-pointer hover:border-primary/50 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{position.coin}</span>
          <span className={cn(
            'px-2 py-0.5 rounded text-xs font-medium',
            position.side === 'LONG' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
          )}>
            {position.side}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{position.leverage}x</span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">P&L</p>
          <p className={cn(
            'font-semibold',
            position.unrealizedPnl >= 0 ? 'text-green-500' : 'text-red-500'
          )}>
            {formatCurrency(position.unrealizedPnl)}
          </p>
          <p className={cn(
            'text-xs',
            pnlPercent >= 0 ? 'text-green-500' : 'text-red-500'
          )}>
            {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Size</p>
          <p className="font-medium">{formatNumber(position.size)}</p>
          <p className="text-xs text-muted-foreground">
            @{formatCurrency(position.entryPrice)}
          </p>
        </div>
      </div>

      {liqDistance !== null && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Liq. Distance</span>
            <span className={cn(
              liqDistance < 10 ? 'text-red-500 font-medium' : 'text-muted-foreground'
            )}>
              {liqDistance.toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
