import { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface SettingsState {
  theme: 'dark' | 'light' | 'system';
  defaultPeriod: '1d' | '7d' | '30d' | 'all';
  autoRefresh: boolean;
  refreshInterval: number;
  notifications: {
    newTrades: boolean;
    positionClosed: boolean;
    drawdownAlert: boolean;
    dailySummary: boolean;
  };
}

export function useLiveUpdates() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const queryClient = useQueryClient();
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Manual refresh function
  const refreshData = () => {
    setLastUpdate(new Date());
    queryClient.invalidateQueries({ queryKey: ['account'] });
    queryClient.invalidateQueries({ queryKey: ['positions'] });
    queryClient.invalidateQueries({ queryKey: ['trades'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  };

  // Set up auto-refresh based on settings
  useEffect(() => {
    const setupAutoRefresh = () => {
      // Clear existing interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }

      const saved = localStorage.getItem('dashboard-settings');
      if (saved) {
        try {
          const settings: SettingsState = JSON.parse(saved);
          if (settings.autoRefresh && settings.refreshInterval) {
            refreshIntervalRef.current = setInterval(() => {
              refreshData();
            }, settings.refreshInterval * 1000);
          }
        } catch (e) {
          console.error('Failed to parse settings:', e);
        }
      }
    };

    // Initial setup
    setupAutoRefresh();

    // Listen for storage changes (when settings are saved)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dashboard-settings') {
        setupAutoRefresh();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also check periodically for settings changes in the same tab
    const checkInterval = setInterval(() => {
      setupAutoRefresh();
    }, 5000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      clearInterval(checkInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [queryClient]);

  // SSE connection for real-time updates
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
