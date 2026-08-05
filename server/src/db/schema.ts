import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const strategies = sqliteTable('strategies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // Stats
  totalTrades: integer('total_trades').notNull().default(0),
  winningTrades: integer('winning_trades').notNull().default(0),
  totalPnl: real('total_pnl').notNull().default(0),
  sharpeRatio: real('sharpe_ratio').default(0),
  maxDrawdown: real('max_drawdown').default(0),
});

export const accountSnapshots = sqliteTable('account_snapshots', {
  id: text('id').primaryKey(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  totalEquity: real('total_equity').notNull(),
  availableBalance: real('available_balance').notNull(),
  unrealizedPnl: real('unrealized_pnl').notNull().default(0),
  realizedPnl24h: real('realized_pnl_24h').notNull().default(0),
});

export const positions = sqliteTable('positions', {
  id: text('id').primaryKey(),
  strategyId: text('strategy_id').references(() => strategies.id),
  coin: text('coin').notNull(),
  side: text('side', { enum: ['LONG', 'SHORT'] }).notNull(),
  entryPrice: real('entry_price').notNull(),
  markPrice: real('mark_price').notNull(),
  size: real('size').notNull(),
  leverage: real('leverage').notNull().default(1),
  unrealizedPnl: real('unrealized_pnl').notNull().default(0),
  liquidationPrice: real('liquidation_price'),
  marginUsed: real('margin_used').default(0),
  openedAt: integer('opened_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  closedAt: integer('closed_at', { mode: 'timestamp' }),
  status: text('status', { enum: ['OPEN', 'CLOSED', 'LIQUIDATED'] }).notNull().default('OPEN'),
});

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  strategyId: text('strategy_id').references(() => strategies.id),
  positionId: text('position_id').references(() => positions.id),
  coin: text('coin').notNull(),
  side: text('side', { enum: ['LONG', 'SHORT'] }).notNull(),
  orderType: text('order_type', { enum: ['MARKET', 'LIMIT', 'STOP'] }).notNull(),
  status: text('status', { enum: ['PENDING', 'FILLED', 'CANCELLED', 'REJECTED'] }).notNull().default('PENDING'),
  size: real('size').notNull(),
  price: real('price'),
  filledPrice: real('filled_price'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
  closedAt: integer('closed_at', { mode: 'timestamp' }),
});

export const trades = sqliteTable('trades', {
  id: text('id').primaryKey(),
  strategyId: text('strategy_id').references(() => strategies.id),
  positionId: text('position_id').references(() => positions.id),
  coin: text('coin').notNull(),
  side: text('side', { enum: ['BUY', 'SELL'] }).notNull(),
  size: real('size').notNull(),
  price: real('price').notNull(),
  fee: real('fee').notNull().default(0),
  pnl: real('pnl'),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const aiReasoning = sqliteTable('ai_reasoning', {
  id: text('id').primaryKey(),
  tradeId: text('trade_id').references(() => trades.id),
  positionId: text('position_id').references(() => positions.id),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  action: text('action', { enum: ['OPEN_LONG', 'OPEN_SHORT', 'CLOSE', 'HOLD'] }).notNull(),
  confidence: real('confidence').notNull(),
  reasoning: text('reasoning').notNull(),
  indicators: text('indicators').notNull().default('{}'), // JSON string
});

export const logs = sqliteTable('logs', {
  id: text('id').primaryKey(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  level: text('level', { enum: ['INFO', 'WARN', 'ERROR'] }).notNull(),
  source: text('source', { enum: ['BOT', 'SYSTEM'] }).notNull(),
  message: text('message').notNull(),
});

export const botStatus = sqliteTable('bot_status', {
  id: integer('id').primaryKey(), // Always 1 (singleton)
  status: text('status', { enum: ['RUNNING', 'PAUSED', 'ERROR', 'STOPPED'] }).notNull().default('STOPPED'),
  lastHeartbeat: integer('last_heartbeat', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  startedAt: integer('started_at', { mode: 'timestamp' }),
});

export const exchangeHealth = sqliteTable('exchange_health', {
  id: integer('id').primaryKey(), // Always 1 (singleton)
  status: text('status', { enum: ['ONLINE', 'OFFLINE', 'DEGRADED'] }).notNull().default('ONLINE'),
  latencyMs: integer('latency_ms').default(0),
  rateLimitUsed: integer('rate_limit_used').default(0),
  rateLimitTotal: integer('rate_limit_total').default(100),
  lastCheck: integer('last_check', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  errorMessage: text('error_message'),
});

export const activities = sqliteTable('activities', {
  id: text('id').primaryKey(),
  strategyId: text('strategy_id').references(() => strategies.id),
  type: text('type', { enum: ['ORDER_CREATED', 'ORDER_FILLED', 'ORDER_CANCELLED', 'POSITION_OPENED', 'POSITION_CLOSED', 'ERROR', 'WARNING', 'INFO'] }).notNull(),
  message: text('message').notNull(),
  coin: text('coin'),
  data: text('data'), // JSON string for extra data
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
