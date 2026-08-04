import { FastifyInstance } from 'fastify';
import { db, positions } from '../db/index.js';
import { desc, eq } from 'drizzle-orm';

export default async function routes(app: FastifyInstance) {
  // GET /api/positions?status=open|closed
  app.get('/', async (request) => {
    const { status } = request.query as { status?: string };
    
    let query = db.select().from(positions).orderBy(desc(positions.openedAt));
    
    if (status === 'open') {
      query = query.where(eq(positions.status, 'OPEN'));
    } else if (status === 'closed') {
      query = query.where(eq(positions.status, 'CLOSED'));
    }
    
    const results = await query;
    
    return {
      data: results.map(p => ({
        id: p.id,
        coin: p.coin,
        side: p.side,
        entryPrice: p.entryPrice,
        markPrice: p.markPrice,
        size: p.size,
        leverage: p.leverage,
        unrealizedPnl: p.unrealizedPnl,
        liquidationPrice: p.liquidationPrice,
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
      return app.httpErrors.notFound('Position not found');
    }
    
    return {
      id: position.id,
      coin: position.coin,
      side: position.side,
      entryPrice: position.entryPrice,
      markPrice: position.markPrice,
      size: position.size,
      leverage: position.leverage,
      unrealizedPnl: position.unrealizedPnl,
      liquidationPrice: position.liquidationPrice,
      openedAt: position.openedAt.toISOString(),
      closedAt: position.closedAt?.toISOString(),
      status: position.status,
    };
  });
}