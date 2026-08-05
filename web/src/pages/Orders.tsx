import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatNumber, cn } from '../lib/utils';
import { Clock, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import type { Order } from '@hl/shared';

type OrderStatus = 'pending' | 'filled' | 'cancelled' | 'all';

const statusIcons = {
  PENDING: Clock,
  FILLED: CheckCircle,
  CANCELLED: XCircle,
  REJECTED: AlertCircle,
};

const statusColors = {
  PENDING: 'text-yellow-500 bg-yellow-500/10',
  FILLED: 'text-green-500 bg-green-500/10',
  CANCELLED: 'text-gray-500 bg-gray-500/10',
  REJECTED: 'text-red-500 bg-red-500/10',
};

export function Orders() {
  const [status, setStatus] = useState<OrderStatus>('all');
  const queryClient = useQueryClient();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', status],
    queryFn: () => api.orders.list(status),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.orders.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const orders = ordersData?.data || [];

  const tabs: { value: OrderStatus; label: string }[] = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'filled', label: 'Filled' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orders</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatus(t.value)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              status === t.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Strategy</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Asset</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Side</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Size</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Price</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Filled</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Time</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: Order) => {
                  const StatusIcon = statusIcons[order.status];
                  return (
                    <tr key={order.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30">
                      <td className="py-3 px-4">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                          statusColors[order.status]
                        )}>
                          <StatusIcon size={12} />
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {order.strategyId || '-'}
                      </td>
                      <td className="py-3 px-4 font-medium">{order.coin}</td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          'text-xs font-medium',
                          order.side === 'LONG' ? 'text-green-500' : 'text-red-500'
                        )}>
                          {order.side}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{order.orderType}</td>
                      <td className="py-3 px-4 text-right">{formatNumber(order.size)}</td>
                      <td className="py-3 px-4 text-right">
                        {order.price ? `$${formatNumber(order.price, 2)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {order.filledPrice ? `$${formatNumber(order.filledPrice, 2)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {new Date(order.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {order.status === 'PENDING' && (
                          <button
                            onClick={() => cancelMutation.mutate(order.id)}
                            disabled={cancelMutation.isPending}
                            className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-md transition-colors"
                            title="Cancel order"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
