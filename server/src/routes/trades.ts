import { FastifyInstance } from 'fastify';
import { db, trades, aiReasoning } from '../db/index.js';
import { desc, eq, and } from 'drizzle-orm';

export default async function routes(app: FastifyInstance) {
  // GET /api/trades?limit=50&offset=0&coin=ETH
  app.get('/', async (request) => {
    const { limit = '50', offset = '0', coin } = request.query as { 
      limit?: string; 
      offset?: string;
      coin?: string;
    };
    
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);
    
    let query = db.select().from(trades).orderBy(desc(trades.timestamp)).limit(limitNum).offset(offsetNum);
    
    // Note: Drizzle SQLite doesn't have direct query builder for this, would need raw or adjust
    // For now, fetch all and filter (will optimize with proper query builder later)
    const allTrades = await db.select().from(trades).orderBy(desc(trades.timestamp));
    const filtered = coin ? allTrades.filter(t => t.coin === coin) : allTrades;
    const paginated = filtered.slice(offsetNum, offsetNum + limitNum);
    
    return {
      data: paginated.map(t => ({
        id: t.id,
        strategyId: t.strategyId,
        positionId: t.positionId,
        coin: t.coin,
        side: t.side,
        size: t.size,
        price: t.price,
        fee: t.fee,
        pnl: t.pnl,
        timestamp: t.timestamp.toISOString(),
      })),
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: filtered.length,
      },
    };
  });

  // GET /api/trades/:id/reasoning
  app.get('/:id/reasoning', async (request) => {
    const { id } = request.params as { id: string };
    
    const reasoning = await db.query.aiReasoning.findFirst({
      where: eq(aiReasoning.tradeId, id),
    });
    
    if (!reasoning) {
      return { data: null };
    }
    
    return {
      data: {
        id: reasoning.id,
        tradeId: reasoning.tradeId,
        positionId: reasoning.positionId,
        timestamp: reasoning.timestamp.toISOString(),
        action: reasoning.action,
        confidence: reasoning.confidence,
        reasoning: reasoning.reasoning,
        indicators: JSON.parse(reasoning.indicators),
      },
    };
  });
}