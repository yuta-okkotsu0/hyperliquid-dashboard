import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatDate, cn } from '../lib/utils';
import { useState } from 'react';
import { AlertCircle, Info, AlertTriangle, Search } from 'lucide-react';

const levels = ['All', 'INFO', 'WARN', 'ERROR'] as const;
const sources = ['All', 'BOT', 'SYSTEM'] as const;

const levelIcons = {
  INFO: Info,
  WARN: AlertTriangle,
  ERROR: AlertCircle,
};

const levelColors = {
  INFO: 'text-blue-500 bg-blue-500/10',
  WARN: 'text-yellow-500 bg-yellow-500/10',
  ERROR: 'text-red-500 bg-red-500/10',
};

export function Logs() {
  const [selectedLevel, setSelectedLevel] = useState<typeof levels[number]>('All');
  const [selectedSource, setSelectedSource] = useState<typeof sources[number]>('All');
  const [search, setSearch] = useState('');
  
  const { data } = useQuery({
    queryKey: ['logs', selectedLevel, selectedSource, search],
    queryFn: () => api.logs.list({ 
      level: selectedLevel === 'All' ? undefined : selectedLevel,
      source: selectedSource === 'All' ? undefined : selectedSource,
      search: search || undefined,
      limit: 100 
    }),
  });

  const logs = data?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">System Logs</h1>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                selectedLevel === level
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {level}
            </button>
          ))}
        </div>
        
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {sources.map((source) => (
            <button
              key={source}
              onClick={() => setSelectedSource(source)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                selectedSource === source
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {source}
            </button>
          ))}
        </div>

        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Logs */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground w-24">Level</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground w-24">Source</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Message</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground w-40">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const Icon = levelIcons[log.level];
                return (
                  <tr key={log.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30">
                    <td className="py-3 px-4">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium',
                        levelColors[log.level]
                      )}>
                        <Icon size={12} />
                        {log.level}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-1 bg-secondary rounded">
                        {log.source}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-sm">{log.message}</td>
                    <td className="py-3 px-4 text-right text-muted-foreground text-xs">
                      {formatDate(log.timestamp)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {logs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No logs found
          </div>
        )}
      </div>
    </div>
  );
}