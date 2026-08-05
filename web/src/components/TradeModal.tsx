import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '../components/ui/dialog';
import { formatCurrency, formatNumber, formatDate, cn } from '../lib/utils';
import { Clock, DollarSign, Target, BarChart3, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useState } from 'react';

interface TradeModalProps {
  position: any;
  isOpen: boolean;
  onClose: () => void;
}

export function TradeModal({ position, isOpen, onClose }: TradeModalProps) {
  const [showReasoning, setShowReasoning] = useState(true);

  if (!position) return null;

  // Check if this is a trade (has pnl property) or a position
  const isTrade = position.pnl !== undefined && !position.status;

  // Fetch reasoning for this position/trade
  const { data: reasoningData } = useQuery({
    queryKey: ['reasoning', 'for-trade', position.id],
    queryFn: () => api.reasoning.list({
      positionId: isTrade ? position.positionId : position.id,
      limit: 5
    }),
    enabled: isOpen && !!position.id,
  });

  // Fetch related trades for positions
  const { data: tradesData } = useQuery({
    queryKey: ['trades', 'for-position', position.id],
    queryFn: () => api.trades.list({
      coin: position.coin,
      limit: 10
    }),
    enabled: isOpen && !isTrade,
  });

  const reasoning = reasoningData?.data || [];
  const relatedTrades = tradesData?.data.filter((t: any) =>
    t.positionId === position.id || t.coin === position.coin
  ) || [];

  const pnlPercent = position.entryPrice > 0
    ? ((position.markPrice - position.entryPrice) / position.entryPrice) * (position.side === 'LONG' ? 1 : -1) * 100
    : 0;

  const positionSize = position.size * (position.markPrice || position.price);
  const initialMargin = position.leverage ? positionSize / position.leverage : positionSize;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-2xl">{position.coin}</span>
            <span className={cn(
              'px-2 py-1 rounded text-sm font-medium',
              (position.side === 'LONG' || position.side === 'BUY')
                ? 'bg-green-500/10 text-green-500'
                : 'bg-red-500/10 text-red-500'
            )}>
              {position.side}
            </span>
            {position.leverage && (
              <span className="text-sm text-muted-foreground">
                {position.leverage}x
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <DollarSign size={14} />
              <span>{isTrade ? 'P&L' : 'Unrealized P&L'}</span>
            </div>
            <p className={cn(
              'text-lg font-bold mt-1',
              (position.unrealizedPnl || position.pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'
            )}>
              {formatCurrency(position.unrealizedPnl || position.pnl || 0)}
            </p>
            {!isTrade && (
              <p className={cn(
                'text-xs',
                pnlPercent >= 0 ? 'text-green-500' : 'text-red-500'
              )}>
                {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
              </p>
            )}
          </div>

          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <BarChart3 size={14} />
              <span>Size</span>
            </div>
            <p className="text-lg font-bold mt-1">{formatNumber(position.size)}</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(positionSize)}
            </p>
          </div>

          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Target size={14} />
              <span>{isTrade ? 'Price' : 'Entry Price'}</span>
            </div>
            <p className="text-lg font-bold mt-1">${formatNumber(position.entryPrice || position.price, 2)}</p>
            {!isTrade && (
              <p className="text-xs text-muted-foreground">
                Mark: ${formatNumber(position.markPrice, 2)}
              </p>
            )}
          </div>

          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Clock size={14} />
              <span>Time</span>
            </div>
            <p className="text-lg font-bold mt-1">
              {formatDate(position.openedAt || position.timestamp)}
            </p>
            {!isTrade && position.closedAt && (
              <p className="text-xs text-muted-foreground">
                Closed: {formatDate(position.closedAt)}
              </p>
            )}
          </div>
        </div>

        {/* Position Details */}
        <div className="bg-card border border-border rounded-lg p-4 mt-4">
          <h3 className="font-semibold mb-3">Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Strategy:</span>
              <span className="ml-2 font-medium">{position.strategyId || 'Default'}</span>
            </div>
            {!isTrade && (
              <>
                <div>
                  <span className="text-muted-foreground">Initial Margin:</span>
                  <span className="ml-2 font-medium">{formatCurrency(initialMargin)}</span>
                </div>
                {position.liquidationPrice && (
                  <div>
                    <span className="text-muted-foreground">Liquidation:</span>
                    <span className="ml-2 font-medium text-red-500">
                      ${formatNumber(position.liquidationPrice, 2)}
                    </span>
                  </div>
                )}
              </>
            )}
            {position.fee !== undefined && (
              <div>
                <span className="text-muted-foreground">Fee:</span>
                <span className="ml-2 font-medium">${formatNumber(position.fee, 4)}</span>
              </div>
            )}
            {position.status && (
              <div>
                <span className="text-muted-foreground">Status:</span>
                <span className={cn(
                  'ml-2 px-2 py-0.5 rounded text-xs font-medium',
                  position.status === 'OPEN' && 'bg-blue-500/10 text-blue-500',
                  position.status === 'CLOSED' && 'bg-gray-500/10 text-gray-500',
                  position.status === 'LIQUIDATED' && 'bg-red-500/10 text-red-500'
                )}>
                  {position.status}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* AI Reasoning Section */}
        {reasoning.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="flex items-center gap-2 w-full text-left"
            >
              <Brain className="text-primary" size={18} />
              <h3 className="font-semibold">AI Reasoning</h3>
              <span className="text-xs text-muted-foreground">({reasoning.length})</span>
              {showReasoning ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showReasoning && (
              <div className="mt-3 space-y-3">
                {reasoning.map((r: any) => (
                  <div key={r.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        r.action === 'OPEN_LONG' && 'bg-green-500/10 text-green-500',
                        r.action === 'OPEN_SHORT' && 'bg-red-500/10 text-red-500',
                        r.action === 'CLOSE' && 'bg-blue-500/10 text-blue-500',
                        r.action === 'HOLD' && 'bg-gray-500/10 text-gray-500'
                      )}>
                        {r.action.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Confidence</span>
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              r.confidence >= 0.8 ? 'bg-green-500' :
                                r.confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                            )}
                            style={{ width: `${r.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{Math.round(r.confidence * 100)}%</span>
                      </div>
                    </div>

                    <p className="text-sm mb-3">{r.reasoning}</p>

                    {r.indicators && Object.keys(r.indicators).length > 0 && (
                      <div className="bg-secondary/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-2">Indicators</p>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.entries(r.indicators).map(([key, value]: [string, any]) => (
                            <div key={key} className="text-xs">
                              <span className="text-muted-foreground capitalize">{key}:</span>
                              <span className="ml-1 font-medium">
                                {typeof value === 'number'
                                  ? value > 1000
                                    ? `${(value / 1000).toFixed(1)}k`
                                    : value.toFixed(2)
                                  : value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-[10px] text-muted-foreground mt-2">
                      {formatDate(r.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Manual Close Button */}
        <div className="mt-6 flex justify-end">
          <DialogClose asChild>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </DialogClose>
        </div>

        {/* Related Trades for Positions */}
        {!isTrade && relatedTrades.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-3">Related Trades ({relatedTrades.length})</h3>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Time</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Side</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Size</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Price</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {relatedTrades.slice(0, 5).map((trade: any) => (
                    <tr key={trade.id} className="border-t border-border/50">
                      <td className="py-2 px-3 text-muted-foreground">
                        {formatDate(trade.timestamp)}
                      </td>
                      <td className="py-2 px-3">
                        <span className={cn(
                          'text-xs',
                          trade.side === 'BUY' ? 'text-green-500' : 'text-red-500'
                        )}>
                          {trade.side}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">{formatNumber(trade.size)}</td>
                      <td className="py-2 px-3 text-right">${formatNumber(trade.price, 2)}</td>
                      <td className={cn(
                        'py-2 px-3 text-right font-medium',
                        (trade.pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                      )}>
                        {trade.pnl !== undefined ? formatCurrency(trade.pnl) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
