import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  History, 
  BarChart3, 
  Brain, 
  ScrollText,
  Menu,
  X,
  Settings,
  Radio
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { useLiveUpdates } from '../hooks/useLiveUpdates';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Positions', href: '/positions', icon: TrendingUp },
  { name: 'Trades', href: '/trades', icon: History },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Reasoning', href: '/reasoning', icon: Brain },
  { name: 'Logs', href: '/logs', icon: ScrollText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isConnected, lastUpdate } = useLiveUpdates();
  const [timeAgo, setTimeAgo] = useState('');

  // Update time ago every second
  useEffect(() => {
    if (!lastUpdate) return;
    
    const updateTime = () => {
      const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
      if (seconds < 5) setTimeAgo('just now');
      else if (seconds < 60) setTimeAgo(`${seconds}s ago`);
      else if (seconds < 3600) setTimeAgo(`${Math.floor(seconds / 60)}m ago`);
      else setTimeAgo(`${Math.floor(seconds / 3600)}h ago`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <span className="font-semibold text-lg">Hyperliquid Dashboard</span>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md hover:bg-secondary"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto',
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="hidden lg:flex h-16 items-center px-6 border-b border-border">
              <span className="font-semibold text-lg">Hyperliquid</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto mt-16 lg:mt-0">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )
                  }
                >
                  <item.icon size={18} />
                  {item.name}
                </NavLink>
              ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border text-xs text-muted-foreground">
              <div className="flex items-center justify-between mb-2">
                <span>Trading Dashboard v1.3</span>
                <div className="flex items-center gap-1.5">
                  <Radio 
                    size={12} 
                    className={cn(
                      'transition-colors',
                      isConnected ? 'text-green-500' : 'text-red-500'
                    )} 
                  />
                  <span className={cn(
                    isConnected ? 'text-green-500' : 'text-red-500'
                  )}>
                    {isConnected ? 'LIVE' : 'OFFLINE'}
                  </span>
                </div>
              </div>
              {lastUpdate && (
                <p className="text-[10px] opacity-70">
                  Updated: {timeAgo}
                </p>
              )}
              <p className="mt-1">Read-only monitoring</p>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 pt-16 lg:pt-0">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}