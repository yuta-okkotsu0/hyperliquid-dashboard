import { FastifyInstance } from 'fastify';
import { db, positions } from '../db/index.js';
import { desc, eq } from 'drizzle-orm';

export default async function routes(app: FastifyInstance) {
  // GET /api/positions?status=open|closed
  app.get('/', async (request) => {
    const { status } = request.query as { status?: string };
    
    const results = await db.select().from(positions)
      .where(status === 'open' ? eq(positions.status, 'OPEN') : status === 'closed' ? eq(positions.status, 'CLOSED') : undefined)
      .orderBy(desc(positions.openedAt));
    
    return {
      data: results.map(p => ({
        id: p.id,
        strategyId: p.strategyId,
        coin: p.coin,
        side: p.side,
        entryPrice: p.entryPrice,
        markPrice: p.markPrice,
        size: p.size,
        leverage: p.leverage,
        unrealizedPnl: p.unrealizedPnl,
        liquidationPrice: p.liquidationPrice,
        marginUsed: p.marginUsed,
        openedAt: p.openedAt.toISOString(),
        closedAt: p.closedAt?.toISOString(),
        status: p.status,
      })),
    };
  });

  // GET /api/positions/:id
  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string };
    
    const position = await db.query.positions.findFirst({
      where: eq(positions.id, id),
    });
    
    if (!position) {
      return { error: 'Position not found' };
    }
    
    return {
      id: position.id,
      strategyId: position.strategyId,
      coin: position.coin,
      side: position.side,
      entryPrice: position.entryPrice,
      markPrice: position.markPrice,
      size: position.size,
      leverage: position.leverage,
      unrealizedPnl: position.unrealizedPnl,
      liquidationPrice: position.liquidationPrice,
      marginUsed: position.marginUsed,
      openedAt: position.openedAt.toISOString(),
      closedAt: position.closedAt?.toISOString(),
      status: position.status,
    };
  });
}