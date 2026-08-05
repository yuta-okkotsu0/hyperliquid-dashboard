import { FastifyInstance } from 'fastify';
import { db, exchangeHealth, accountSnapshots } from '../db/index.js';
import { desc, eq } from 'drizzle-orm';

export default async function routes(app: FastifyInstance) {
  // GET /api/exchange/health
  app.get('/health', async () => {
    const health = await db.query.exchangeHealth.findFirst({
      where: eq(exchangeHealth.id, 1),
    });
    
    if (!health) {
      return {
        status: 'UNKNOWN',
        latencyMs: 0,
        rateLimit: { used: 0, total: 100, remaining: 100 },
        lastCheck: new Date().toISOString(),
      };
    }
    
    return {
      status: health.status,
      latencyMs: health.latencyMs,
      rateLimit: {
        used: health.rateLimitUsed,
        total: health.rateLimitTotal,
        remaining: health.rateLimitTotal - health.rateLimitUsed,
      },
      lastCheck: health.lastCheck.toISOString(),
      errorMessage: health.errorMessage,
    };
  });

  // GET /api/exchange/balance
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
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      totalEquity: latest.totalEquity,
      availableBalance: latest.availableBalance,
      unrealizedPnl: latest.unrealizedPnl,
      realizedPnl24h: latest.realizedPnl24h,
      timestamp: latest.timestamp.toISOString(),
    };
  });
}
