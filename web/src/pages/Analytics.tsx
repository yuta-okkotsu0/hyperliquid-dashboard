import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatCurrency, formatPercent, cn } from '../lib/utils';
import { TrendingUp, TrendingDown, Target, Activity, BarChart2, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';

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
    <div className="bg-card rounded-lg border border-border p-4 lg:p-6 hover:border-primary/50 transition-colors">
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

  const { data: equityData } = useQuery({
    queryKey: ['account', 'equity', 'all'],
    queryFn: () => api.account.equity('all'),
  });

  const { data: tradesData } = useQuery({
    queryKey: ['trades', 'all'],
    queryFn: () => api.trades.list({ limit: 1000 }),
  });

  const { data: positionsData } = useQuery({
    queryKey: ['positions', 'all'],
    queryFn: () => api.positions.list(),
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

  // Calculate monthly performance from equity snapshots
  const monthlyData = (() => {
    const snapshots = equityData?.data || [];
    const monthlyMap = new Map<string, { pnl: number; trades: number }>();
    
    snapshots.forEach((snapshot, index) => {
      if (index === 0) return;
      const date = new Date(snapshot.timestamp);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const prevEquity = snapshots[index - 1].totalEquity;
      const pnl = snapshot.totalEquity - prevEquity;
      
      const existing = monthlyMap.get(monthKey) || { pnl: 0, trades: 0 };
      existing.pnl += pnl;
      existing.trades += 1;
      monthlyMap.set(monthKey, existing);
    });

    return Array.from(monthlyMap.entries())
      .slice(-6) // Last 6 months
      .map(([month, data]) => ({
        month,
        pnl: data.pnl,
      }));
  })();

  // Calculate asset breakdown from positions
  const assetBreakdown = (() => {
    const positions = positionsData?.data || [];
    const trades = tradesData?.data || [];
    const assetMap = new Map<string, { pnl: number; count: number }>();
    
    // Add open positions
    positions.forEach(pos => {
      const existing = assetMap.get(pos.coin) || { pnl: 0, count: 0 };
      existing.pnl += pos.unrealizedPnl;
      existing.count += 1;
      assetMap.set(pos.coin, existing);
    });

    // Add closed trade P&L
    trades.filter(t => t.pnl !== undefined).forEach(trade => {
      const existing = assetMap.get(trade.coin) || { pnl: 0, count: 0 };
      existing.pnl += trade.pnl || 0;
      existing.count += 1;
      assetMap.set(trade.coin, existing);
    });

    const data = Array.from(assetMap.entries()).map(([coin, data]) => ({
      name: coin,
      value: Math.abs(data.pnl),
      pnl: data.pnl,
    }));

    return data.sort((a, b) => b.value - a.value).slice(0, 5);
  })();

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Performance */}
        <div className="bg-card rounded-lg border border-border p-4 lg:p-6">
          <h2 className="text-lg font-semibold mb-4">Monthly Performance</h2>
          <div className="h-64">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'P&L']}
                  />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {monthlyData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Asset Breakdown */}
        <div className="bg-card rounded-lg border border-border p-4 lg:p-6">
          <h2 className="text-lg font-semibold mb-4">Asset Breakdown</h2>
          <div className="h-64">
            {assetBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={assetBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {assetBreakdown.map((_entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                    formatter={(_value: number, _name: string, props: any) => [
                      formatCurrency(props.payload.pnl),
                      props.payload.name
                    ]}
                  />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {assetBreakdown.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1 text-sm">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className={cn(
                  entry.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                )}>
                  {entry.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
