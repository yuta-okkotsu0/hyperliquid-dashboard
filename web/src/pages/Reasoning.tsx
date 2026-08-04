import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatDate, cn } from '../lib/utils';
import { Brain, TrendingUp, TrendingDown, Minus, X, Shield } from 'lucide-react';
import { useState } from 'react';
import type { AIReasoning } from '@hl/shared';

const actions = {
  OPEN_LONG: { label: 'Open Long', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
  OPEN_SHORT: { label: 'Open Short', icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10' },
  CLOSE: { label: 'Close Position', icon: X, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  HOLD: { label: 'Hold', icon: Minus, color: 'text-gray-500', bg: 'bg-gray-500/10' },
};

function ReasoningCard({ reasoning }: { reasoning: AIReasoning }) {
  const action = actions[reasoning.action];
  const Icon = action.icon;
  
  return (
    <div className="bg-card rounded-lg border border-border p-4 lg:p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', action.bg)}>
            <Icon size={20} className={action.color} />
          </div>
          <div>
            <p className="font-medium">{action.label}</p>
            <p className="text-sm text-muted-foreground">{formatDate(reasoning.timestamp)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium">{(reasoning.confidence * 100).toFixed(0)}%</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Reasoning</p>
          <p className="text-sm leading-relaxed">{reasoning.reasoning}</p>
        </div>
        
        {Object.keys(reasoning.indicators).length > 0 && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Indicators</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(reasoning.indicators).map(([key, value]) => (
                <span 
                  key={key} 
                  className="px-2 py-1 bg-secondary rounded text-xs font-mono"
                >
                  {key}: {typeof value === 'number' ? value.toFixed(2) : value}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {(reasoning.tradeId || reasoning.positionId) && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {reasoning.tradeId && `Trade: ${reasoning.tradeId.slice(0, 8)}...`}
              {reasoning.tradeId && reasoning.positionId && ' | '}
              {reasoning.positionId && `Position: ${reasoning.positionId.slice(0, 8)}...`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function Reasoning() {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  
  const { data } = useQuery({
    queryKey: ['reasoning', selectedAction],
    queryFn: () => api.reasoning.list({ limit: 50 }),
  });

  const reasoningList = data?.data || [];
  
  const filteredReasoning = selectedAction 
    ? reasoningList.filter(r => r.action === selectedAction)
    : reasoningList;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">AI Reasoning</h1>
        <div className="flex gap-1 bg-secondary rounded-lg p-1 flex-wrap">
          <button
            onClick={() => setSelectedAction(null)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              selectedAction === null
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            All
          </button>
          {Object.entries(actions).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedAction(key)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                selectedAction === key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {filteredReasoning.map((reasoning) => (
          <ReasoningCard key={reasoning.id} reasoning={reasoning} />
        ))}
      </div>

      {filteredReasoning.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Brain size={48} className="mx-auto mb-4 opacity-50" />
          <p>No reasoning records found</p>
        </div>
      )}
    </div>
  );
}