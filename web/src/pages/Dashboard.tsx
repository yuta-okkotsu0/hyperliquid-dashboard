import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatCurrency, formatPercent, formatNumber } from '../lib/utils';
import { TrendingUp, TrendingDown, DollarSign, Activity, Calendar, Trophy, AlertTriangle, TrendingDown as DrawdownIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { PnLCalendar } from '../components/PnLCalendar';

const iconGlowClass = "drop-shadow-[0_0_8px_hsl(217,100%,50%)]";

const periods = [
  { label: '1D', value: '1d' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: 'All', value: 'all' },
];

function StatCard({ 
  title, 
  value, 
  change, 
  icon: Icon,
  variant = 'default'
}: { 
  title: string; 
  value: string; 
  change?: number; 
  icon: React.ElementType;
  variant?: 'default' | 'success' | 'danger' | 'warning';
}) {
  const iconColors = {
    default: 'text-muted-foreground',
    success: 'text-green-500',
    danger: 'text-red-500',
    warning: 'text-yellow-500'
  };
  
  return (
    <div className="bg-card rounded-lg border border-border p-4 lg:p-6 hover:border-primary/50 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {change !== undefined && (
            <p className={cn(
              'text-sm mt-1 flex items-center gap-1',
              change >= 0 ? 'text-green-500' : 'text-red-500'
            )}>
              {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {formatPercent(change)}
            </p>
          )}
        </div>
        <div className="p-3 bg-secondary rounded-lg">
          <Icon size={24} className={cn(iconColors[variant], iconGlowClass)} />
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [period, setPeriod] = useState('7d');
  
  const { data: equityData } = useQuery({
    queryKey: ['account', 'equity', period],
    queryFn: () => api.account.equity(period),
  });
  
  const { data: balanceData } = useQuery({
    queryKey: ['account', 'balance'],
    queryFn: () => api.account.balance(),
  });
  
  const { data: positionsData } = useQuery({
    queryKey: ['positions', 'open'],
    queryFn: () => api.positions.list('open'),
  });
  
  // Note: performanceData not currently used but kept for future stats
  useQuery({
    queryKey: ['analytics', 'performance'],
    queryFn: () => api.analytics.performance(),
  });

  const { data: tradesData } = useQuery({
    queryKey: ['trades', 'all'],
    queryFn: () => api.trades.list({ limit: 1000 }),
  });

  const chartData = equityData?.data.map(d => ({
    timestamp: new Date(d.timestamp).toLocaleDateString(),
    fullDate: new Date(d.timestamp),
    equity: d.totalEquity,
  })).reverse() || [];

  const trades = tradesData?.data || [];

  // Match trades to chart data points for markers
  const tradeMarkers = (() => {
    const markers: Array<{
      index: number;
      equity: number;
      timestamp: string;
      trade: typeof trades[0];
      type: 'entry' | 'exit';
    }> = [];
    
    trades.forEach(trade => {
      const tradeDate = new Date(trade.timestamp);
      // Find closest chart point
      const closestIndex = chartData.findIndex((d, i) => {
        const next = chartData[i + 1];
        if (!next) return true;
        return tradeDate >= d.fullDate && tradeDate < next.fullDate;
      });
      
      if (closestIndex >= 0) {
        markers.push({
          index: closestIndex,
          equity: chartData[closestIndex].equity,
          timestamp: chartData[closestIndex].timestamp,
          trade,
          type: trade.pnl !== undefined ? 'exit' : 'entry',
        });
      }
    });
    
    return markers;
  })();

  const openPositions = positionsData?.data || [];
  const totalUnrealizedPnl = openPositions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
  
  const currentEquity = balanceData?.totalEquity || 0;
  const startEquity = chartData[0]?.equity || currentEquity;
  const equityChange = startEquity > 0 ? (currentEquity - startEquity) / startEquity : 0;

  // Calculate additional stats
  const closedTrades = trades.filter(t => t.pnl !== undefined);
  const bestTrade = closedTrades.length > 0 ? closedTrades.reduce((max, t) => (t.pnl || 0) > (max.pnl || 0) ? t : max, closedTrades[0]) : null;
  const worstTrade = closedTrades.length > 0 ? closedTrades.reduce((min, t) => (t.pnl || 0) < (min.pnl || 0) ? t : min, closedTrades[0]) : null;
  
  // Calculate current drawdown from equity curve
  let currentDrawdown = 0;
  if (chartData.length > 0) {
    let peak = chartData[0].equity;
    for (const point of chartData) {
      if (point.equity > peak) peak = point.equity;
    }
    const current = chartData[chartData.length - 1].equity;
    currentDrawdown = peak > 0 ? (peak - current) / peak : 0;
  }
  
  // Today's P&L (last 24h realized)
  const todayPnl = balanceData?.realizedPnl24h || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                period === p.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Equity"
          value={formatCurrency(currentEquity)}
          change={equityChange}
          icon={DollarSign}
        />
        <StatCard
          title="Today's P&L"
          value={formatCurrency(todayPnl)}
          change={todayPnl / currentEquity}
          icon={Calendar}
          variant={todayPnl >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          title="Unrealized P&L"
          value={formatCurrency(totalUnrealizedPnl)}
          change={totalUnrealizedPnl / currentEquity}
          icon={Activity}
          variant={totalUnrealizedPnl >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          title="Current Drawdown"
          value={formatPercent(-currentDrawdown)}
          icon={DrawdownIcon}
          variant={currentDrawdown > 0.1 ? 'danger' : currentDrawdown > 0.05 ? 'warning' : 'default'}
        />
      </div>

      {/* Best/Worst Trades Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Best Trade"
          value={bestTrade ? formatCurrency(bestTrade.pnl || 0) : '$0.00'}
          icon={Trophy}
          variant="success"
        />
        <StatCard
          title="Worst Trade"
          value={worstTrade ? formatCurrency(worstTrade.pnl || 0) : '$0.00'}
          icon={AlertTriangle}
          variant="danger"
        />
      </div>

      {/* Equity Chart */}
      <div className="bg-card rounded-lg border border-border p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Equity Curve</h2>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Entry</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Exit</span>
            </div>
          </div>
        </div>
        <div className="h-64 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="timestamp" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                minTickGap={30}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: number, _name: string, _props: any) => {
                  const equity = value as number;
                  const pnlPercent = startEquity > 0 ? ((equity - startEquity) / startEquity) : 0;
                  return [
                    <div key="tooltip">
                      <div className="font-semibold">{formatCurrency(equity)}</div>
                      <div className={cn(
                        'text-sm',
                        pnlPercent >= 0 ? 'text-green-500' : 'text-red-500'
                      )}>
                        {pnlPercent >= 0 ? '+' : ''}{formatPercent(pnlPercent)}
                      </div>
                    </div>,
                    'Equity'
                  ];
                }}
              />
              <Area
                type="monotone"
                dataKey="equity"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#equityGradient)"
              />
              {/* Trade markers */}
              {tradeMarkers.map((marker, i) => (
                <ReferenceDot
                  key={`trade-${i}`}
                  x={marker.timestamp}
                  y={marker.equity}
                  r={4}
                  fill={marker.type === 'entry' ? '#10b981' : '#ef4444'}
                  stroke="none"
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* P&L Calendar */}
      <PnLCalendar />

      {/* Open Positions Preview */}
      <div className="bg-card rounded-lg border border-border p-4 lg:p-6">
        <h2 className="text-lg font-semibold mb-4">Open Positions ({openPositions.length})</h2>
        {openPositions.length === 0 ? (
          <p className="text-muted-foreground">No open positions</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium text-muted-foreground">Asset</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Side</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Size</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Entry</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Mark</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">P&L</th>
                </tr>
              </thead>
              <tbody>
                {openPositions.slice(0, 5).map((position) => (
                  <tr key={position.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 font-medium">{position.coin}</td>
                    <td className="py-3">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        position.side === 'LONG' 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-red-500/10 text-red-500'
                      )}>
                        {position.side}
                      </span>
                    </td>
                    <td className="py-3 text-right">{formatNumber(position.size)}</td>
                    <td className="py-3 text-right">${formatNumber(position.entryPrice, 2)}</td>
                    <td className="py-3 text-right">${formatNumber(position.markPrice, 2)}</td>
                    <td className={cn(
                      'py-3 text-right font-medium',
                      position.unrealizedPnl >= 0 ? 'text-green-500' : 'text-red-500'
                    )}>
                      {formatCurrency(position.unrealizedPnl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}