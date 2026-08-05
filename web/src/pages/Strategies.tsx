import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatCurrency, formatPercent, cn } from '../lib/utils';
import { BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import type { Strategy } from '@hl/shared';

export function Strategies() {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);

  const { data: strategiesData } = useQuery({
    queryKey: ['strategies'],
    queryFn: () => api.strategies.list(),
  });

  const { data: comparisonData } = useQuery({
    queryKey: ['strategies', 'compare'],
    queryFn: () => api.strategies.compare(),
  });

  const strategies = strategiesData?.data || [];
  const comparison = comparisonData?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Strategies</h1>

      {/* Strategy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {strategies.map((strategy: Strategy) => (
          <div
            key={strategy.id}
            className={cn(
              'bg-card rounded-lg border p-4 cursor-pointer transition-all',
              selectedStrategy === strategy.id
                ? 'border-primary ring-1 ring-primary'
                : 'border-border hover:border-primary/50'
            )}
            onClick={() => setSelectedStrategy(
              selectedStrategy === strategy.id ? null : strategy.id
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">{strategy.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{strategy.description}</p>
              </div>
              <span className={cn(
                'px-2 py-0.5 rounded text-xs font-medium',
                strategy.active
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-gray-500/10 text-gray-500'
              )}>
                {strategy.active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Total P&L</p>
                <p className={cn(
                  'text-lg font-semibold',
                  (strategy.stats.totalPnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                )}>
                  {formatCurrency(strategy.stats.totalPnl || 0)}
                </p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Win Rate</p>
                <p className="text-lg font-semibold">{formatPercent((strategy.stats.winRate || 0) / 100)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span>{strategy.stats.totalTrades} trades</span>
              {selectedStrategy === strategy.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="bg-card rounded-lg border border-border p-4 lg:p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="text-primary" size={20} />
          <h2 className="text-lg font-semibold">Strategy Comparison</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 font-medium text-muted-foreground">Strategy</th>
                <th className="text-center py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right py-3 font-medium text-muted-foreground">Trades</th>
                <th className="text-right py-3 font-medium text-muted-foreground">Win Rate</th>
                <th className="text-right py-3 font-medium text-muted-foreground">Total P&L</th>
                <th className="text-right py-3 font-medium text-muted-foreground">Sharpe</th>
                <th className="text-right py-3 font-medium text-muted-foreground">Max DD</th>
                <th className="text-right py-3 font-medium text-muted-foreground">Profit Factor</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((s: any) => (
                <tr key={s.id} className="border-b border-border/50 last:border-0">
                  <td className="py-3 font-medium">{s.name}</td>
                  <td className="py-3 text-center">
                    <span className={cn(
                      'px-2 py-0.5 rounded text-xs',
                      s.active ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'
                    )}>
                      {s.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 text-right">{s.totalTrades}</td>
                  <td className="py-3 text-right">{formatPercent(s.winRate / 100)}</td>
                  <td className={cn(
                    'py-3 text-right font-medium',
                    s.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'
                  )}>
                    {formatCurrency(s.totalPnl)}
                  </td>
                  <td className="py-3 text-right">{s.sharpeRatio?.toFixed(2) || '-'}</td>
                  <td className="py-3 text-right text-red-500">
                    {s.maxDrawdown ? formatPercent(-s.maxDrawdown) : '-'}
                  </td>
                  <td className="py-3 text-right">{s.profitFactor?.toFixed(2) || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
