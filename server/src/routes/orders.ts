import { FastifyInstance } from 'fastify';
import { db, orders, positions } from '../db/index.js';
import { desc, eq, and } from 'drizzle-orm';

export default async function routes(app: FastifyInstance) {
  // GET /api/orders?status=pending|filled|cancelled|all
  app.get('/', async (request) => {
    const { status = 'all', limit = '50' } = request.query as { 
      status?: string;
      limit?: string;
    };
    
    const limitNum = parseInt(limit);
    
    let query = db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limitNum);
    
    // Filter by status
    const allOrders = await query;
    const filtered = status !== 'all' 
      ? allOrders.filter(o => o.status.toLowerCase() === status.toLowerCase())
      : allOrders;
    
    return {
      data: filtered.map(o => ({
        id: o.id,
        strategyId: o.strategyId,
        positionId: o.positionId,
        coin: o.coin,
        side: o.side,
        orderType: o.orderType,
        status: o.status,
        size: o.size,
        price: o.price,
        filledPrice: o.filledPrice,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt?.toISOString(),
        closedAt: o.closedAt?.toISOString(),
      })),
    };
  });

  // POST /api/orders/:id/cancel
  app.post('/:id/cancel', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
    });
    
    if (!order) {
      reply.status(404);
      return { error: 'Order not found' };
    }
    
    if (order.status !== 'PENDING') {
      reply.status(400);
      return { error: 'Only pending orders can be cancelled' };
    }
    
    await db.update(orders)
      .set({ status: 'CANCELLED', closedAt: new Date() })
      .where(eq(orders.id, id));
    
    return { success: true, message: 'Order cancelled' };
  });
}
