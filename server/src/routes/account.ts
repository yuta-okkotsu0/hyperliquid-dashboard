import { FastifyInstance } from 'fastify';
import { db, accountSnapshots } from '../db/index.js';
import { desc, gte } from 'drizzle-orm';

export default async function routes(app: FastifyInstance) {
  // GET /api/account/equity?period=1d|7d|30d|all
  app.get('/equity', async (request) => {
    const { period = '7d' } = request.query as { period?: string };
    
    let startTime: Date | undefined;
    const now = new Date();
    
    switch (period) {
      case '1d':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startTime = undefined;
    }
    
    const query = db.select().from(accountSnapshots).orderBy(desc(accountSnapshots.timestamp));
    
    if (startTime) {
      query.where(gte(accountSnapshots.timestamp, startTime));
    }
    
    const snapshots = await query;
    
    return {
      data: snapshots.map(s => ({
        id: s.id,
        timestamp: s.timestamp.toISOString(),
        totalEquity: s.totalEquity,
        availableBalance: s.availableBalance,
        unrealizedPnl: s.unrealizedPnl,
        realizedPnl24h: s.realizedPnl24h,
      })),
      period,
    };
  });

  // GET /api/account/balance
  app.get('/balance', async () => {
    const latest = await db.query.accountSnapshots.findFirst({
      orderBy: desc(accountSnapshots.timestamp),
    });
    
    if (!latest) {
      return {
        totalEquity: 0,
        availableBalance: 0,
        unrealizedPnl: 0,
        realizedPnl24h: 0,
      };
    }
    
    return {
      totalEquity: latest.totalEquity,
      availableBalance: latest.availableBalance,
      unrealizedPnl: latest.unrealizedPnl,
      realizedPnl24h: latest.realizedPnl24h,
    };
  });
}