import { FastifyInstance } from 'fastify';
import { db, strategies, trades, positions } from '../db/index.js';
import { desc, eq, sql } from 'drizzle-orm';

export default async function routes(app: FastifyInstance) {
  // GET /api/strategies
  app.get('/', async () => {
    const allStrategies = await db.select().from(strategies).orderBy(desc(strategies.createdAt));
    
    return {
      data: allStrategies.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        active: s.active,
        createdAt: s.createdAt.toISOString(),
        stats: {
          totalTrades: s.totalTrades,
          winRate: s.totalTrades > 0 ? (s.winningTrades / s.totalTrades) * 100 : 0,
          totalPnl: s.totalPnl,
          sharpeRatio: s.sharpeRatio,
          maxDrawdown: s.maxDrawdown,
        },
      })),
    };
  });

  // GET /api/strategies/:id
  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string };
    
    const strategy = await db.query.strategies.findFirst({
      where: eq(strategies.id, id),
    });
    
    if (!strategy) {
      return { error: 'Strategy not found' };
    }
    
    // Get recent trades for this strategy
    const strategyTrades = await db.select()
      .from(trades)
      .where(eq(trades.strategyId, id))
      .orderBy(desc(trades.timestamp))
      .limit(20);
    
    // Get open positions
    const openPositions = await db.select()
      .from(positions)
      .where(and(eq(positions.strategyId, id), eq(positions.status, 'OPEN')));
    
    return {
      id: strategy.id,
      name: strategy.name,
      description: strategy.description,
      active: strategy.active,
      createdAt: strategy.createdAt.toISOString(),
      stats: {
        totalTrades: strategy.totalTrades,
        winningTrades: strategy.winningTrades,
        winRate: strategy.totalTrades > 0 ? (strategy.winningTrades / strategy.totalTrades) * 100 : 0,
        totalPnl: strategy.totalPnl,
        sharpeRatio: strategy.sharpeRatio,
        maxDrawdown: strategy.maxDrawdown,
      },
      recentTrades: strategyTrades.map(t => ({
        id: t.id,
        coin: t.coin,
        side: t.side,
        size: t.size,
        price: t.price,
        pnl: t.pnl,
        timestamp: t.timestamp.toISOString(),
      })),
      openPositions: openPositions.map(p => ({
        id: p.id,
        coin: p.coin,
        side: p.side,
        size: p.size,
        entryPrice: p.entryPrice,
        markPrice: p.markPrice,
        unrealizedPnl: p.unrealizedPnl,
      })),
    };
  });

  // GET /api/strategies/compare
  app.get('/compare', async () => {
    const allStrategies = await db.select().from(strategies);
    
    const comparison = allStrategies.map(s => ({
      id: s.id,
      name: s.name,
      active: s.active,
      totalTrades: s.totalTrades,
      winRate: s.totalTrades > 0 ? (s.winningTrades / s.totalTrades) * 100 : 0,
      totalPnl: s.totalPnl,
      sharpeRatio: s.sharpeRatio,
      maxDrawdown: s.maxDrawdown,
      profitFactor: s.totalPnl > 0 ? (s.totalPnl / Math.abs(s.maxDrawdown || 1)) : 0,
    }));
    
    return { data: comparison };
  });
}

// Helper for SQL AND
function and(...conditions: any[]) {
  return sql`(${conditions.join(' AND ')})`;
}
