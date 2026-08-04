import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatCurrency, formatPercent, cn } from '../lib/utils';
import { TrendingUp, TrendingDown, Target, Activity, BarChart2, PieChart } from 'lucide-react';

function MetricCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon,
  trend
}: { 
  title: string; 
  value: string; 
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="bg-card rounded-lg border border-border p-4 lg:p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={cn(
          'p-3 rounded-lg',
          trend === 'up' && 'bg-green-500/10',
          trend === 'down' && 'bg-red-500/10',
          trend === 'neutral' && 'bg-secondary'
        )}>
          <Icon size={24} className={cn(
            trend === 'up' && 'text-green-500',
            trend === 'down' && 'text-red-500',
            trend === 'neutral' && 'text-muted-foreground'
          )} />
        </div>
      </div>
    </div>
  );
}

export function Analytics() {
  const { data: performance } = useQuery({
    queryKey: ['analytics', 'performance'],
    queryFn: () => api.analytics.performance(),
  });

  const metrics = performance || {
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    profitFactor: 0,
    expectancy: 0,
    totalPnl: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    totalReturn: 0,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Total Return"
          value={formatPercent(metrics.totalReturn)}
          icon={TrendingUp}
          trend={metrics.totalReturn >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="Win Rate"
          value={`${(metrics.winRate * 100).toFixed(1)}%`}
          subtitle={`${metrics.winningTrades} wins / ${metrics.losingTrades} losses`}
          icon={Target}
          trend={metrics.winRate > 0.5 ? 'up' : 'neutral'}
        />
        <MetricCard
          title="Profit Factor"
          value={metrics.profitFactor.toFixed(2)}
          subtitle="Gross Profit / Gross Loss"
          icon={BarChart2}
          trend={metrics.profitFactor > 1 ? 'up' : 'down'}
        />
        <MetricCard
          title="Expectancy"
          value={formatCurrency(metrics.expectancy)}
          subtitle="Avg profit per trade"
          icon={Activity}
          trend={metrics.expectancy > 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="Sharpe Ratio"
          value={metrics.sharpeRatio.toFixed(2)}
          subtitle="Risk-adjusted return"
          icon={PieChart}
          trend={metrics.sharpeRatio > 1 ? 'up' : 'neutral'}
        />
        <MetricCard
          title="Max Drawdown"
          value={formatPercent(-metrics.maxDrawdown)}
          subtitle="Largest peak-to-trough decline"
          icon={TrendingDown}
          trend="down"
        />
      </div>

      {/* Trade Statistics */}
      <div className="bg-card rounded-lg border border-border p-4 lg:p-6">
        <h2 className="text-lg font-semibold mb-4">Trade Statistics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Trades</p>
            <p className="text-2xl font-bold">{metrics.totalTrades}</p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Winning Trades</p>
            <p className="text-2xl font-bold text-green-500">{metrics.winningTrades}</p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Losing Trades</p>
            <p className="text-2xl font-bold text-red-500">{metrics.losingTrades}</p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Total P&L</p>
            <p className={cn(
              'text-2xl font-bold',
              metrics.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'
            )}>
              {formatCurrency(metrics.totalPnl)}
            </p>
          </div>
        </div>
      </div>

      {/* Placeholder for future charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-4 lg:p-6">
          <h2 className="text-lg font-semibold mb-4">Monthly Performance</h2>
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            Coming soon
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 lg:p-6">
          <h2 className="text-lg font-semibold mb-4">Asset Breakdown</h2>
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            Coming soon
          </div>
        </div>
      </div>
    </div>
  );
}