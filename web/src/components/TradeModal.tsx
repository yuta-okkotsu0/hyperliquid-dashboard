import { formatCurrency, formatNumber, formatDate, cn } from '../lib/utils';
import { Clock, DollarSign, Target, BarChart3, Brain, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useState, useEffect } from 'react';

interface TradeModalProps {
  position: any;
  isOpen: boolean;
  onClose: () => void;
}

export function TradeModal({ position, isOpen, onClose }: TradeModalProps) {
  const [showReasoning, setShowReasoning] = useState(true);

  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  // This is the React rules of hooks

  // Safe property access with defaults - do this first
  const positionId = position?.id || '';
  const coin = position?.coin || 'Unknown';
  const side = position?.side || 'LONG';
  const size = position?.size || 0;
  const leverage = position?.leverage || 1;
  const entryPrice = position?.entryPrice || position?.price || 0;
  const markPrice = position?.markPrice || entryPrice;
  const unrealizedPnl = position?.unrealizedPnl || 0;
  const pnl = position?.pnl;
  const status = position?.status;
  const liquidationPrice = position?.liquidationPrice;
  const fee = position?.fee;
  const strategyId = position?.strategyId;
  const openedAt = position?.openedAt;
  const timestamp = position?.timestamp;
  const closedAt = position?.closedAt;
  const relatedPositionId = position?.positionId;

  // Check if this is a trade (has pnl property but no status) or a position
  const isTrade = pnl !== undefined && !status;

  // Close on escape key - always call this hook
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Fetch reasoning for this position/trade - always call this hook
  const { data: reasoningData } = useQuery({
    queryKey: ['reasoning', 'for-trade', positionId],
    queryFn: () => api.reasoning.list({
      positionId: isTrade ? relatedPositionId : positionId,
      limit: 5
    }),
    enabled: isOpen && !!positionId,
  });

  // Fetch related trades for positions - always call this hook
  const { data: tradesData } = useQuery({
    queryKey: ['trades', 'for-position', positionId],
    queryFn: () => api.trades.list({
      coin: coin,
      limit: 10
    }),
    enabled: isOpen && !isTrade && !!positionId,
  });

  // NOW we can do conditional rendering
  if (!isOpen || !position || typeof position !== 'object') {
    return null;
  }

  const reasoning = reasoningData?.data || [];
  const relatedTrades = tradesData?.data?.filter((t: any) =>
    t.positionId === positionId || t.coin === coin
  ) || [];

  const pnlPercent = entryPrice > 0
    ? ((markPrice - entryPrice) / entryPrice) * (side === 'LONG' ? 1 : -1) * 100
    : 0;

  const positionSize = size * (markPrice || entryPrice || 1);
  const initialMargin = leverage ? positionSize / leverage : positionSize;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold">{coin}</span>
            <span className={cn(
              'px-2 py-1 rounded text-sm font-medium',
              (side === 'LONG' || side === 'BUY')
                ? 'bg-green-500/10 text-green-500'
                : 'bg-red-500/10 text-red-500'
            )}>
              {side}
            </span>
            {leverage > 1 && (
              <span className="text-sm text-muted-foreground">
                {leverage}x
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <DollarSign size={14} />
                <span>{isTrade ? 'P&L' : 'Unrealized P&L'}</span>
              </div>
              <p className={cn(
                'text-lg font-bold mt-1',
                (unrealizedPnl || pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'
              )}>
                {formatCurrency(unrealizedPnl || pnl || 0)}
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
              <p className="text-lg font-bold mt-1">{formatNumber(size)}</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(positionSize)}
              </p>
            </div>

            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Target size={14} />
                <span>{isTrade ? 'Price' : 'Entry Price'}</span>
              </div>
              <p className="text-lg font-bold mt-1">${formatNumber(entryPrice, 2)}</p>
              {!isTrade && markPrice !== entryPrice && (
                <p className="text-xs text-muted-foreground">
                  Mark: ${formatNumber(markPrice, 2)}
                </p>
              )}
            </div>

            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Clock size={14} />
                <span>Time</span>
              </div>
              <p className="text-lg font-bold mt-1">
                {openedAt ? formatDate(openedAt) : timestamp ? formatDate(timestamp) : '-'}
              </p>
              {!isTrade && closedAt && (
                <p className="text-xs text-muted-foreground">
                  Closed: {formatDate(closedAt)}
                </p>
              )}
            </div>
          </div>

          {/* Position Details */}
          <div className="bg-secondary/30 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Strategy:</span>
                <span className="ml-2 font-medium">{strategyId || 'Default'}</span>
              </div>
              {!isTrade && (
                <>
                  <div>
                    <span className="text-muted-foreground">Initial Margin:</span>
                    <span className="ml-2 font-medium">{formatCurrency(initialMargin)}</span>
                  </div>
                  {liquidationPrice && (
                    <div>
                      <span className="text-muted-foreground">Liquidation:</span>
                      <span className="ml-2 font-medium text-red-500">
                        ${formatNumber(liquidationPrice, 2)}
                      </span>
                    </div>
                  )}
                </>
              )}
              {fee !== undefined && (
                <div>
                  <span className="text-muted-foreground">Fee:</span>
                  <span className="ml-2 font-medium">${formatNumber(fee, 4)}</span>
                </div>
              )}
              {status && (
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <span className={cn(
                    'ml-2 px-2 py-0.5 rounded text-xs font-medium',
                    status === 'OPEN' && 'bg-blue-500/10 text-blue-500',
                    status === 'CLOSED' && 'bg-gray-500/10 text-gray-500',
                    status === 'LIQUIDATED' && 'bg-red-500/10 text-red-500'
                  )}>
                    {status}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* AI Reasoning Section */}
          {reasoning.length > 0 && (
            <div>
              <button
                onClick={() => setShowReasoning(!showReasoning)}
                className="flex items-center gap-2 w-full text-left hover:bg-secondary/30 p-2 rounded-lg transition-colors"
              >
                <Brain className="text-primary" size={18} />
                <h3 className="font-semibold">AI Reasoning</h3>
                <span className="text-xs text-muted-foreground">({reasoning.length})</span>
                {showReasoning ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showReasoning && (
                <div className="mt-3 space-y-3">
                  {reasoning.map((r: any) => (
                    <div key={r.id} className="bg-secondary/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium',
                          r.action === 'OPEN_LONG' && 'bg-green-500/10 text-green-500',
                          r.action === 'OPEN_SHORT' && 'bg-red-500/10 text-red-500',
                          r.action === 'CLOSE' && 'bg-blue-500/10 text-blue-500',
                          r.action === 'HOLD' && 'bg-gray-500/10 text-gray-500'
                        )}>
                          {r.action?.replace('_', ' ') || 'UNKNOWN'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Confidence</span>
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                (r.confidence || 0) >= 0.8 ? 'bg-green-500' :
                                  (r.confidence || 0) >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                              )}
                              style={{ width: `${(r.confidence || 0) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{Math.round((r.confidence || 0) * 100)}%</span>
                        </div>
                      </div>

                      <p className="text-sm mb-3">{r.reasoning || 'No reasoning provided'}</p>

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
                                    : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="text-[10px] text-muted-foreground mt-2">
                        {r.timestamp ? formatDate(r.timestamp) : '-'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Related Trades for Positions */}
          {!isTrade && relatedTrades.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Related Trades ({relatedTrades.length})</h3>
              <div className="bg-secondary/30 rounded-lg overflow-hidden">
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
                          {trade.timestamp ? formatDate(trade.timestamp) : '-'}
                        </td>
                        <td className="py-2 px-3">
                          <span className={cn(
                            'text-xs',
                            trade.side === 'BUY' ? 'text-green-500' : 'text-red-500'
                          )}>
                            {trade.side}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">{formatNumber(trade.size || 0)}</td>
                        <td className="py-2 px-3 text-right">${formatNumber(trade.price || 0, 2)}</td>
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
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
