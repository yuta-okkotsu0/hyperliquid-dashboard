import type { 
  AccountSnapshot, 
  Position, 
  Trade, 
  AIReasoning, 
  Log, 
  BotStatus,
  PerformanceMetrics,
  Order,
  Strategy,
  Activity,
  ExchangeHealth
} from '@hl/shared';

const API_BASE = '/api';

async function fetchJson<T>(url: string, method: 'GET' | 'POST' = 'GET', body?: object): Promise<T> {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(`${API_BASE}${url}`, options);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

export const api = {
  account: {
    equity: (period = '7d') => fetchJson<{ data: AccountSnapshot[]; period: string }>(`/account/equity?period=${period}`),
    balance: () => fetchJson<{ totalEquity: number; availableBalance: number; unrealizedPnl: number; realizedPnl24h: number }>('/account/balance'),
  },
  positions: {
    list: (status?: 'open' | 'closed') => fetchJson<{ data: Position[] }>(`/positions${status ? `?status=${status}` : ''}`),
    get: (id: string) => fetchJson<Position>(`/positions/${id}`),
  },
  trades: {
    list: (params?: { limit?: number; offset?: number; coin?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.offset) searchParams.set('offset', String(params.offset));
      if (params?.coin) searchParams.set('coin', params.coin);
      return fetchJson<{ data: Trade[]; pagination: { limit: number; offset: number; total: number } }>(`/trades?${searchParams}`);
    },
    reasoning: (id: string) => fetchJson<{ data: AIReasoning | null }>(`/trades/${id}/reasoning`),
  },
  analytics: {
    performance: (period = '30d') => fetchJson<PerformanceMetrics & { period: string }>(`/analytics/performance?period=${period}`),
    winrate: () => fetchJson<{ byCoin: Record<string, number>; byMonth: Record<string, number>; overall: number }>('/analytics/winrate'),
  },
  reasoning: {
    list: (params?: { tradeId?: string; positionId?: string; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.tradeId) searchParams.set('tradeId', params.tradeId);
      if (params?.positionId) searchParams.set('positionId', params.positionId);
      if (params?.limit) searchParams.set('limit', String(params.limit));
      return fetchJson<{ data: AIReasoning[] }>(`/reasoning?${searchParams}`);
    },
    get: (id: string) => fetchJson<AIReasoning>(`/reasoning/${id}`),
  },
  logs: {
    list: (params?: { level?: 'INFO' | 'WARN' | 'ERROR'; source?: 'BOT' | 'SYSTEM'; limit?: number; search?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.level) searchParams.set('level', params.level);
      if (params?.source) searchParams.set('source', params.source);
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.search) searchParams.set('search', params.search);
      return fetchJson<{ data: Log[] }>(`/logs?${searchParams}`);
    },
  },
  status: {
    get: () => fetchJson<BotStatus & { isStale: boolean }>('/status'),
  },
  orders: {
    list: (status?: 'pending' | 'filled' | 'cancelled' | 'all') => fetchJson<{ data: Order[] }>(`/orders?status=${status || 'all'}`),
    cancel: (id: string) => fetchJson<{ success: boolean; message: string }>(`/orders/${id}/cancel`, 'POST'),
  },
  strategies: {
    list: () => fetchJson<{ data: Strategy[] }>('/strategies'),
    get: (id: string) => fetchJson<Strategy & { recentTrades: Trade[]; openPositions: Position[] }>(`/strategies/${id}`),
    compare: () => fetchJson<{ data: Array<Strategy & { winRate: number; profitFactor: number }> }>('/strategies/compare'),
  },
  exchange: {
    health: () => fetchJson<ExchangeHealth>('/exchange/health'),
    balance: () => fetchJson<{ totalEquity: number; availableBalance: number; unrealizedPnl: number; realizedPnl24h: number; timestamp: string }>('/exchange/balance'),
  },
  activities: {
    list: (params?: { limit?: number; strategyId?: string; type?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.strategyId) searchParams.set('strategyId', params.strategyId);
      if (params?.type) searchParams.set('type', params.type);
      return fetchJson<{ data: Activity[] }>(`/activities?${searchParams}`);
    },
    recent: (since?: string) => {
      const searchParams = new URLSearchParams();
      if (since) searchParams.set('since', since);
      return fetchJson<{ data: Activity[] }>(`/activities/recent?${searchParams}`);
    },
  },
};
