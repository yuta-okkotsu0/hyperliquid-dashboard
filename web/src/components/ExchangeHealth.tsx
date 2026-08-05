import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import { Wifi, WifiOff, AlertTriangle, Gauge } from 'lucide-react';

export function ExchangeHealth() {
  const { data: health } = useQuery({
    queryKey: ['exchange', 'health'],
    queryFn: () => api.exchange.health(),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: balance } = useQuery({
    queryKey: ['exchange', 'balance'],
    queryFn: () => api.exchange.balance(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (!health) return null;

  const statusIcons = {
    ONLINE: Wifi,
    OFFLINE: WifiOff,
    DEGRADED: AlertTriangle,
  };

  const statusColors = {
    ONLINE: 'text-green-500 bg-green-500/10',
    OFFLINE: 'text-red-500 bg-red-500/10',
    DEGRADED: 'text-yellow-500 bg-yellow-500/10',
  };

  const StatusIcon = statusIcons[health.status];
  const rateLimitPercent = (health.rateLimit.used / health.rateLimit.total) * 100;

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gauge className="text-primary" size={18} />
          <h3 className="font-semibold">Exchange Health</h3>
        </div>
        <span className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
          statusColors[health.status]
        )}>
          <StatusIcon size={12} />
          {health.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Latency */}
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Latency</p>
          <p className={cn(
            'text-lg font-semibold',
            health.latencyMs < 100 ? 'text-green-500' :
            health.latencyMs < 300 ? 'text-yellow-500' : 'text-red-500'
          )}>
            {health.latencyMs}ms
          </p>
        </div>

        {/* Rate Limit */}
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Rate Limit</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  rateLimitPercent < 50 ? 'bg-green-500' :
                  rateLimitPercent < 80 ? 'bg-yellow-500' : 'bg-red-500'
                )}
                style={{ width: `${rateLimitPercent}%` }}
              />
            </div>
            <span className="text-xs font-medium">
              {health.rateLimit.used}/{health.rateLimit.total}
            </span>
          </div>
        </div>

        {/* Wallet Balance */}
        {balance && (
          <>
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Total Equity</p>
              <p className="text-lg font-semibold">
                ${balance.totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Available</p>
              <p className="text-lg font-semibold">
                ${balance.availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </>
        )}
      </div>

      {health.errorMessage && (
        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-500">{health.errorMessage}</p>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground mt-3">
        Last check: {new Date(health.lastCheck).toLocaleTimeString()}
      </p>
    </div>
  );
}
