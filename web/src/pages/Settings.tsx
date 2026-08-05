import { useState, useEffect } from 'react';

import { cn } from '../lib/utils';
import { 
  Monitor, 
  Bell, 
  Clock, 
  Database, 
  Wifi,
  Check,
  RefreshCw
} from 'lucide-react';

type Theme = 'dark' | 'light' | 'system';
type DefaultPeriod = '1d' | '7d' | '30d' | 'all';

interface SettingsState {
  theme: Theme;
  defaultPeriod: DefaultPeriod;
  autoRefresh: boolean;
  refreshInterval: number;
  notifications: {
    newTrades: boolean;
    positionClosed: boolean;
    drawdownAlert: boolean;
    dailySummary: boolean;
  };
}

export function Settings() {
  const [settings, setSettings] = useState<SettingsState>({
    theme: 'dark',
    defaultPeriod: '7d',
    autoRefresh: true,
    refreshInterval: 5,
    notifications: {
      newTrades: true,
      positionClosed: true,
      drawdownAlert: true,
      dailySummary: false,
    },
  });

  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  // Load settings from localStorage on mount and apply theme
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);

        // Apply theme immediately on load
        if (parsed.theme === 'light') {
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
        } else if (parsed.theme === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        }
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
  }, []);

  // Check API connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/health');
        if (response.ok) {
          setConnectionStatus('connected');
          setLastSync(new Date());
        } else {
          setConnectionStatus('disconnected');
        }
      } catch {
        setConnectionStatus('disconnected');
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const saveSettings = () => {
    setIsSaving(true);
    localStorage.setItem('dashboard-settings', JSON.stringify(settings));
    
    // Apply theme
    if (settings.theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
    
    setTimeout(() => {
      setIsSaving(false);
      setSavedMessage('Settings saved successfully');
      setTimeout(() => setSavedMessage(''), 3000);
    }, 500);
  };

  const periods: { value: DefaultPeriod; label: string }[] = [
    { value: '1d', label: '1 Day' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: 'all', label: 'All Time' },
  ];

  const themes: { value: Theme; label: string; icon: React.ElementType }[] = [
    { value: 'dark', label: 'Dark', icon: Monitor },
    { value: 'light', label: 'Light', icon: Monitor },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Connection Status */}
      <div className="bg-card rounded-lg border border-border p-4 lg:p-6">
        <div className="flex items-center gap-3 mb-4">
          <Wifi className={cn(
            'transition-colors',
            connectionStatus === 'connected' ? 'text-green-500' :
            connectionStatus === 'disconnected' ? 'text-red-500' :
            'text-yellow-500'
          )} />
          <h2 className="text-lg font-semibold">API Connection</h2>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
          <div>
            <p className="font-medium">Status</p>
            <p className="text-sm text-muted-foreground">
              {connectionStatus === 'connected' ? 'Connected to backend' :
               connectionStatus === 'disconnected' ? 'Connection lost' :
               'Checking connection...'}
            </p>
          </div>
          <div className={cn(
            'px-3 py-1 rounded-full text-sm font-medium',
            connectionStatus === 'connected' ? 'bg-green-500/10 text-green-500' :
            connectionStatus === 'disconnected' ? 'bg-red-500/10 text-red-500' :
            'bg-yellow-500/10 text-yellow-500'
          )}>
            {connectionStatus === 'connected' ? 'Online' :
             connectionStatus === 'disconnected' ? 'Offline' :
             'Checking...'}
          </div>
        </div>
        
        {lastSync && (
          <p className="text-xs text-muted-foreground mt-2">
            Last synced: {lastSync.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Appearance */}
      <div className="bg-card rounded-lg border border-border p-4 lg:p-6">
        <div className="flex items-center gap-3 mb-4">
          <Monitor className="text-primary" />
          <h2 className="text-lg font-semibold">Appearance</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Theme</label>
            <div className="flex gap-2">
              {themes.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSettings(s => ({ ...s, theme: value }))}
                  className={cn(
                    'px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                    settings.theme === value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary border-border hover:border-primary/50'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Preferences */}
      <div className="bg-card rounded-lg border border-border p-4 lg:p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="text-primary" />
          <h2 className="text-lg font-semibold">Dashboard Preferences</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Default Time Period</label>
            <div className="flex gap-2 flex-wrap">
              {periods.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSettings(s => ({ ...s, defaultPeriod: value }))}
                  className={cn(
                    'px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                    settings.defaultPeriod === value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary border-border hover:border-primary/50'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
            <div>
              <p className="font-medium">Auto-refresh</p>
              <p className="text-sm text-muted-foreground">Automatically update data</p>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, autoRefresh: !s.autoRefresh }))}
              className={cn(
                'w-12 h-6 rounded-full transition-colors relative',
                settings.autoRefresh ? 'bg-primary' : 'bg-muted'
              )}
            >
              <div className={cn(
                'w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform',
                settings.autoRefresh ? 'translate-x-6' : 'translate-x-0.5'
              )} />
            </button>
          </div>

          {settings.autoRefresh && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Refresh Interval: {settings.refreshInterval} seconds
              </label>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={settings.refreshInterval}
                onChange={(e) => setSettings(s => ({ 
                  ...s, 
                  refreshInterval: parseInt(e.target.value) 
                }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>5s</span>
                <span>60s</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card rounded-lg border border-border p-4 lg:p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="text-primary" />
          <h2 className="text-lg font-semibold">Notifications</h2>
        </div>

        <div className="space-y-3">
          {[
            { key: 'newTrades', label: 'New trades executed', desc: 'Get notified when a new trade is opened' },
            { key: 'positionClosed', label: 'Position closed', desc: 'Get notified when a position is closed with P&L' },
            { key: 'drawdownAlert', label: 'Drawdown alerts', desc: 'Alert when drawdown exceeds 10%' },
            { key: 'dailySummary', label: 'Daily summary', desc: 'Receive daily P&L summary at market close' },
          ].map(({ key, label, desc }) => (
            <div 
              key={key}
              className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
            >
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
              <button
                onClick={() => setSettings(s => ({
                  ...s,
                  notifications: {
                    ...s.notifications,
                    [key]: !s.notifications[key as keyof typeof s.notifications],
                  },
                }))}
                className={cn(
                  'w-12 h-6 rounded-full transition-colors relative',
                  settings.notifications[key as keyof typeof settings.notifications] 
                    ? 'bg-primary' 
                    : 'bg-muted'
                )}
              >
                <div className={cn(
                  'w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform',
                  settings.notifications[key as keyof typeof settings.notifications]
                    ? 'translate-x-6' 
                    : 'translate-x-0.5'
                )} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-card rounded-lg border border-border p-4 lg:p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="text-primary" />
          <h2 className="text-lg font-semibold">Data Management</h2>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              localStorage.removeItem('dashboard-settings');
              window.location.reload();
            }}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={async () => {
              // Trigger manual refresh
              window.location.reload();
            }}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className={cn(
            'px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium transition-all',
            isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary/90'
          )}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
        
        {savedMessage && (
          <span className="text-green-500 text-sm flex items-center gap-1">
            <Check size={16} />
            {savedMessage}
          </span>
        )}
      </div>
    </div>
  );
}
