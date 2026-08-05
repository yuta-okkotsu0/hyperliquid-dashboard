import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import { 
  PlusCircle, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  AlertTriangle,
  Info,
  X
} from 'lucide-react';
import type { Activity } from '@hl/shared';

const activityIcons = {
  ORDER_CREATED: PlusCircle,
  ORDER_FILLED: CheckCircle2,
  ORDER_CANCELLED: XCircle,
  POSITION_OPENED: PlusCircle,
  POSITION_CLOSED: CheckCircle2,
  ERROR: AlertCircle,
  WARNING: AlertTriangle,
  INFO: Info,
};

const activityColors = {
  ORDER_CREATED: 'text-blue-500 bg-blue-500/10',
  ORDER_FILLED: 'text-green-500 bg-green-500/10',
  ORDER_CANCELLED: 'text-gray-500 bg-gray-500/10',
  POSITION_OPENED: 'text-blue-500 bg-blue-500/10',
  POSITION_CLOSED: 'text-green-500 bg-green-500/10',
  ERROR: 'text-red-500 bg-red-500/10',
  WARNING: 'text-yellow-500 bg-yellow-500/10',
  INFO: 'text-muted-foreground bg-muted',
};

export function ActivityFeed() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [activities, setActivities] = useState<Activity[]>([]);

  const { data: initialData } = useQuery({
    queryKey: ['activities'],
    queryFn: () => api.activities.list({ limit: 20 }),
  });

  useEffect(() => {
    if (initialData?.data) {
      setActivities(initialData.data);
    }
  }, [initialData]);

  // Subscribe to SSE for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/stream/updates');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'update' && data.data.activities) {
          setActivities(prev => {
            const newActivities = data.data.activities.filter(
              (a: Activity) => !prev.find(p => p.id === a.id)
            );
            return [...newActivities, ...prev].slice(0, 20);
          });
        }
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const dismissActivity = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  const visibleActivities = activities.filter(a => !dismissed.has(a.id)).slice(0, 10);

  if (visibleActivities.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 w-80 space-y-2">
      {visibleActivities.map((activity) => {
        const Icon = activityIcons[activity.type];
        return (
          <div
            key={activity.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg border shadow-lg animate-in slide-in-from-right',
              activity.type === 'ERROR' ? 'bg-red-950/90 border-red-500/30' :
              activity.type === 'WARNING' ? 'bg-yellow-950/90 border-yellow-500/30' :
              'bg-card border-border'
            )}
          >
            <div className={cn(
              'p-1.5 rounded-md shrink-0',
              activityColors[activity.type]
            )}>
              <Icon size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-sm font-medium',
                activity.type === 'ERROR' ? 'text-red-400' :
                activity.type === 'WARNING' ? 'text-yellow-400' :
                'text-foreground'
              )}>
                {activity.message}
              </p>
              {activity.coin && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activity.coin}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground mt-1">
                {new Date(activity.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => dismissActivity(activity.id)}
              className="p-1 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
