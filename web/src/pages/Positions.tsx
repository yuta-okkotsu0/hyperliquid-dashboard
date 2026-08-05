import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatCurrency, formatNumber, cn } from '../lib/utils';
import { useState } from 'react';
import { PositionModal } from '../components/PositionModal';

type StatusFilter = 'all' | 'open' | 'closed';

export function Positions() {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data } = useQuery({
    queryKey: ['positions', status],
    queryFn: () => api.positions.list(status === 'all' ? undefined : status),
  });

  const positions = data?.data || [];

  const handleRowClick = (position: any) => {
    setSelectedPosition(position);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Positions</h1>
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {(['all', 'open', 'closed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize',
                status === s
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Asset</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Side</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Size</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Leverage</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Margin</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Entry</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Mark</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Liq. Price</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">P&L</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => {
                const liqDistance = position.liquidationPrice && position.markPrice
                  ? Math.abs((position.markPrice - position.liquidationPrice) / position.markPrice)
                  : null;
                const liqPercent = liqDistance ? (liqDistance * 100).toFixed(1) : null;
                const isNearLiq = liqPercent && parseFloat(liqPercent) < 10;

                return (
                  <tr
                    key={position.id}
                    className="border-b border-border/50 last:border-0 hover:bg-secondary/30 cursor-pointer"
                    onClick={() => handleRowClick(position)}
                  >
                    <td className="py-3 px-4 font-medium">{position.coin}</td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        position.side === 'LONG'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-red-500/10 text-red-500'
                      )}>
                        {position.side}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">{formatNumber(position.size)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-1.5 py-0.5 bg-secondary rounded text-xs">
                        {position.leverage}x
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground">
                      {position.marginUsed ? formatCurrency(position.marginUsed) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">${formatNumber(position.entryPrice, 2)}</td>
                    <td className="py-3 px-4 text-right">${formatNumber(position.markPrice, 2)}</td>
                    <td className="py-3 px-4 text-right">
                      {position.liquidationPrice ? (
                        <span className={cn(
                          'text-xs',
                          isNearLiq ? 'text-red-500 font-medium' : 'text-muted-foreground'
                        )}>
                          ${formatNumber(position.liquidationPrice, 2)}
                          {liqPercent && (
                            <span className={cn(
                              'ml-1 text-[10px]',
                              isNearLiq ? 'text-red-500' : 'text-muted-foreground'
                            )}>
                              ({liqPercent}%)
                            </span>
                          )}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className={cn(
                      'py-3 px-4 text-right font-medium',
                      position.unrealizedPnl >= 0 ? 'text-green-500' : 'text-red-500'
                    )}>
                      {formatCurrency(position.unrealizedPnl)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        position.status === 'OPEN' && 'bg-blue-500/10 text-blue-500',
                        position.status === 'CLOSED' && 'bg-gray-500/10 text-gray-500',
                        position.status === 'LIQUIDATED' && 'bg-red-500/10 text-red-500'
                      )}>
                        {position.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {positions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No positions found
          </div>
        )}
      </div>

      <PositionModal
        position={selectedPosition}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}