import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { formatCurrency, formatNumber, formatDate, cn, formatDuration } from '../lib/utils';
import { Clock, DollarSign, Target, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface PositionModalProps {
  position: any;
  isOpen: boolean;
  onClose: () => void;
}

export function PositionModal({ position, isOpen, onClose }: PositionModalProps) {
  if (!position) return null;

  const { data: tradesData } = useQuery({
    queryKey: ['trades', 'for-position', position.id],
    queryFn: () => api.trades.list({ 
      coin: position.coin,
      limit: 100 
    }),
    enabled: isOpen,
  });

  const relatedTrades = tradesData?.data.filter((t: any) => 
    t.coin === position.coin
  ) || [];

  const pnlPercent = position.entryPrice > 0 
    ? ((position.markPrice - position.entryPrice) / position.entryPrice) * (position.side === 'LONG' ? 1 : -1) * 100
    : 0;

  const positionSize = position.size * position.markPrice;
  const initialMargin = positionSize / position.leverage;
  const liquidationPrice = position.side === 'LONG'
    ? position.entryPrice * (1 - 1 / position.leverage)
    : position.entryPrice * (1 + 1 / position.leverage);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-2xl">{position.coin}</span>
            <span className={cn(
              'px-2 py-1 rounded text-sm font-medium',
              position.side === 'LONG' 
                ? 'bg-green-500/10 text-green-500' 
                : 'bg-red-500/10 text-red-500'
            )}>
              {position.side}
            </span>
            <span className="text-sm text-muted-foreground">
              {position.leverage}x
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <DollarSign size={14} />
              <span>P&L</span>
            </div>
            <p className={cn(
              'text-lg font-bold mt-1',
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
              <span>Entry Price</span>
            </div>
            <p className="text-lg font-bold mt-1">${formatNumber(position.entryPrice, 2)}</p>
            <p className="text-xs text-muted-foreground">
              Mark: ${formatNumber(position.markPrice, 2)}
            </p>
          </div>

          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Clock size={14} />
              <span>Duration</span>
            </div>
            <p className="text-lg font-bold mt-1">
              {formatDuration(position.openedAt, position.closedAt)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(position.openedAt)}
            </p>
          </div>
        </div>

        {/* Position Details */}
        <div className="bg-card border border-border rounded-lg p-4 mt-4">
          <h3 className="font-semibold mb-3">Position Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Initial Margin:</span>
              <span className="ml-2 font-medium">{formatCurrency(initialMargin)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Liquidation Price:</span>
              <span className="ml-2 font-medium text-red-500">
                ${formatNumber(liquidationPrice, 2)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Funding Paid:</span>
              <span className="ml-2 font-medium">
                {formatCurrency(position.fundingPaid || 0)}
              </span>
            </div>
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
          </div>
        </div>

        {/* Related Trades */}
        {relatedTrades.length > 0 && (
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
