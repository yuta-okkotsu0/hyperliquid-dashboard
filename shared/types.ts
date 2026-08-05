// Shared TypeScript types between server and web

export interface AccountSnapshot {
  id: string;
  timestamp: string;
  totalEquity: number;
  availableBalance: number;
  unrealizedPnl: number;
  realizedPnl24h: number;
}

export type PositionStatus = 'OPEN' | 'CLOSED' | 'LIQUIDATED';
export type PositionSide = 'LONG' | 'SHORT';

export interface Position {
  id: string;
  strategyId?: string;
  coin: string;
  side: PositionSide;
  entryPrice: number;
  markPrice: number;
  size: number;
  leverage: number;
  unrealizedPnl: number;
  liquidationPrice: number;
  marginUsed?: number;
  openedAt: string;
  closedAt?: string;
  status: PositionStatus;
}

export type TradeSide = 'BUY' | 'SELL';

export interface Trade {
  id: string;
  strategyId?: string;
  positionId?: string;
  coin: string;
  side: TradeSide;
  size: number;
  price: number;
  fee: number;
  pnl?: number;
  timestamp: string;
}

export type AIAction = 'OPEN_LONG' | 'OPEN_SHORT' | 'CLOSE' | 'HOLD';

export interface AIReasoning {
  id: string;
  tradeId?: string;
  positionId?: string;
  timestamp: string;
  action: AIAction;
  confidence: number;
  reasoning: string;
  indicators: Record<string, number>;
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';
export type LogSource = 'BOT' | 'SYSTEM';

export interface Log {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: LogSource;
  message: string;
}

export type BotStatusState = 'RUNNING' | 'PAUSED' | 'ERROR' | 'STOPPED';

export interface BotStatus {
  id: number;
  status: BotStatusState;
  lastHeartbeat: string;
  startedAt?: string;
}

export interface PerformanceMetrics {
  totalReturn: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  expectancy: number;
  totalPnl: number;
}

// Order types
export type OrderStatus = 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP';

export interface Order {
  id: string;
  strategyId?: string;
  positionId?: string;
  coin: string;
  side: PositionSide;
  orderType: OrderType;
  status: OrderStatus;
  size: number;
  price?: number;
  filledPrice?: number;
  createdAt: string;
  updatedAt?: string;
  closedAt?: string;
}

// Strategy types
export interface Strategy {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  stats: {
    totalTrades: number;
    winRate: number;
    totalPnl: number;
    sharpeRatio?: number;
    maxDrawdown?: number;
  };
}

// Activity types
export type ActivityType = 'ORDER_CREATED' | 'ORDER_FILLED' | 'ORDER_CANCELLED' | 'POSITION_OPENED' | 'POSITION_CLOSED' | 'ERROR' | 'WARNING' | 'INFO';

export interface Activity {
  id: string;
  strategyId?: string;
  type: ActivityType;
  message: string;
  coin?: string;
  data?: Record<string, any>;
  timestamp: string;
}

// Exchange Health types
export type ExchangeStatus = 'ONLINE' | 'OFFLINE' | 'DEGRADED';

export interface ExchangeHealth {
  status: ExchangeStatus;
  latencyMs: number;
  rateLimit: {
    used: number;
    total: number;
    remaining: number;
  };
  lastCheck: string;
  errorMessage?: string;
}
