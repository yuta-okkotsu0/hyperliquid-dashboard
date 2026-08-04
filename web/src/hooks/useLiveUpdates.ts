import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useLiveUpdates() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const eventSource = new EventSource('/api/stream/updates');

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'connected') {
          setIsConnected(true);
        } else if (data.type === 'update') {
          setLastUpdate(new Date());
          
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['account'] });
          queryClient.invalidateQueries({ queryKey: ['positions'] });
          queryClient.invalidateQueries({ queryKey: ['trades'] });
          queryClient.invalidateQueries({ queryKey: ['analytics'] });
        }
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [queryClient]);

  return { isConnected, lastUpdate };
}
