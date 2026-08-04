import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatCurrency, cn } from '../lib/utils';
import { useState } from 'react';

export function PnLCalendar() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const { data: tradesData } = useQuery({
    queryKey: ['trades', 'all'],
    queryFn: () => api.trades.list({ limit: 10000 }),
  });

  const trades = tradesData?.data || [];

  // Group trades by day and calculate daily P&L
  const dailyPnL = (() => {
    const map = new Map<string, number>();
    trades.forEach(trade => {
      if (trade.pnl === undefined) return;
      const date = new Date(trade.timestamp).toISOString().split('T')[0];
      const existing = map.get(date) || 0;
      map.set(date, existing + trade.pnl);
    });
    return map;
  })();

  // Get all days in the selected month
  const daysInMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedMonth.year, selectedMonth.month, 1).getDay();

  // Calculate month stats
  const monthPnL = (() => {
    let total = 0;
    dailyPnL.forEach((pnl, date) => {
      const d = new Date(date);
      if (d.getFullYear() === selectedMonth.year && d.getMonth() === selectedMonth.month) {
        total += pnl;
      }
    });
    return total;
  })();

  const getColor = (pnl: number | undefined) => {
    if (pnl === undefined || pnl === 0) return 'bg-secondary/30';
    const abs = Math.abs(pnl);
    if (pnl > 0) {
      if (abs > 1000) return 'bg-green-500/80';
      if (abs > 500) return 'bg-green-500/60';
      if (abs > 100) return 'bg-green-500/40';
      return 'bg-green-500/20';
    } else {
      if (abs > 1000) return 'bg-red-500/80';
      if (abs > 500) return 'bg-red-500/60';
      if (abs > 100) return 'bg-red-500/40';
      return 'bg-red-500/20';
    }
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-card rounded-lg border border-border p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Daily P&L Calendar</h2>
          <p className={cn(
            'text-sm font-medium',
            monthPnL >= 0 ? 'text-green-500' : 'text-red-500'
          )}>
            {monthNames[selectedMonth.month]} Total: {formatCurrency(monthPnL)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const newMonth = selectedMonth.month - 1;
              if (newMonth < 0) {
                setSelectedMonth({ year: selectedMonth.year - 1, month: 11 });
              } else {
                setSelectedMonth({ ...selectedMonth, month: newMonth });
              }
            }}
            className="p-1 rounded hover:bg-secondary transition-colors"
          >
            ←
          </button>
          <span className="text-sm font-medium min-w-[100px] text-center">
            {monthNames[selectedMonth.month]} {selectedMonth.year}
          </span>
          <button
            onClick={() => {
              const newMonth = selectedMonth.month + 1;
              if (newMonth > 11) {
                setSelectedMonth({ year: selectedMonth.year + 1, month: 0 });
              } else {
                setSelectedMonth({ ...selectedMonth, month: newMonth });
              }
            }}
            className="p-1 rounded hover:bg-secondary transition-colors"
          >
            →
          </button>
        </div>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs text-muted-foreground py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Days */}
        {Array.from({ length: daysInMonth }).map((_, day) => {
          const date = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}-${String(day + 1).padStart(2, '0')}`;
          const pnl = dailyPnL.get(date);
          const isToday = new Date().toISOString().split('T')[0] === date;

          return (
            <div
              key={day}
              className={cn(
                'aspect-square rounded-md flex flex-col items-center justify-center text-xs cursor-pointer transition-all hover:scale-105',
                getColor(pnl),
                isToday && 'ring-2 ring-primary',
                pnl && Math.abs(pnl) > 500 && 'text-white font-medium'
              )}
              title={pnl !== undefined ? formatCurrency(pnl) : 'No trades'}
            >
              <span className={cn(
                'text-[10px]',
                pnl && Math.abs(pnl) > 500 ? 'text-white/80' : 'text-muted-foreground'
              )}>
                {day + 1}
              </span>
              {pnl !== undefined && (
                <span className={cn(
                  'text-[9px]',
                  pnl && Math.abs(pnl) > 500 ? 'text-white' : pnl >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {pnl >= 0 ? '+' : ''}{(pnl / 1000).toFixed(1)}k
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500/80" />
          <span className="text-muted-foreground">$1000+</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500/40" />
          <span className="text-muted-foreground">$100-500</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-secondary/30" />
          <span className="text-muted-foreground">No trades</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500/40" />
          <span className="text-muted-foreground">-$100-500</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500/80" />
          <span className="text-muted-foreground">-$1000+</span>
        </div>
      </div>
    </div>
  );
}
