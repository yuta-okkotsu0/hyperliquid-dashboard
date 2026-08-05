import { FastifyInstance } from 'fastify';
import { db, accountSnapshots, trades, positions, activities, exchangeHealth } from '../db/index.js';
import { desc, sql } from 'drizzle-orm';

// Store connected clients
const clients = new Set<any>();

export function broadcast(data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => {
    try {
      client.raw.write(message);
    } catch (err) {
      clients.delete(client);
    }
  });
}

// Broadcast latest data to all connected clients
export async function broadcastUpdate() {
  try {
    // Get latest balance
    const latestSnapshot = await db.select().from(accountSnapshots).orderBy(desc(accountSnapshots.timestamp)).limit(1);
    const balance = latestSnapshot[0];

    // Get recent trades
    const recentTrades = await db.select().from(trades).orderBy(desc(trades.timestamp)).limit(5);

    // Get open positions
    const openPositions = await db.select().from(positions).where(sql`${positions.status} = 'OPEN'`);

    // Get performance metrics
    const allTrades = await db.select().from(trades);
    const winningTrades = allTrades.filter(t => (t.pnl || 0) > 0);
    const totalPnl = allTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

    // Get recent activities
    const recentActivities = await db.select().from(activities).orderBy(desc(activities.timestamp)).limit(10);

    // Get exchange health
    const health = await db.select().from(exchangeHealth).where(sql`${exchangeHealth.id} = 1`).limit(1);

    broadcast({
      type: 'update',
      timestamp: new Date().toISOString(),
      data: {
        balance: balance ? {
          totalEquity: balance.totalEquity,
          availableBalance: balance.availableBalance,
          unrealizedPnl: balance.unrealizedPnl,
          realizedPnl24h: balance.realizedPnl24h,
        } : null,
        positions: {
          count: openPositions.length,
          unrealizedPnl: openPositions.reduce((sum, p) => sum + p.unrealizedPnl, 0),
        },
        trades: {
          recent: recentTrades,
          totalCount: allTrades.length,
          winRate: allTrades.length > 0 ? winningTrades.length / allTrades.length : 0,
        },
        performance: {
          totalPnl,
        },
        activities: recentActivities.map(a => ({
          id: a.id,
          type: a.type,
          message: a.message,
          coin: a.coin,
          timestamp: a.timestamp.toISOString(),
        })),
        exchangeHealth: health[0] ? {
          status: health[0].status,
          latencyMs: health[0].latencyMs,
          rateLimitUsed: health[0].rateLimitUsed,
          rateLimitTotal: health[0].rateLimitTotal,
        } : null,
      },
    });
  } catch (err) {
    console.error('Error broadcasting update:', err);
  }
}

export default async function routes(app: FastifyInstance) {
  // GET /api/stream/updates
  app.get('/updates', async (request, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    
    // Send initial connection message
    reply.raw.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);
    
    clients.add(reply);
    
    // Keep connection alive
    const keepAlive = setInterval(() => {
      try {
        reply.raw.write(': ping\n\n');
      } catch (err) {
        clearInterval(keepAlive);
        clients.delete(reply);
      }
    }, 30000);
    
    // Clean up on close
    request.raw.on('close', () => {
      clearInterval(keepAlive);
      clients.delete(reply);
    });
    
    // Don't close the reply - keep it open for SSE
    return reply;
  });
}

export { clients };