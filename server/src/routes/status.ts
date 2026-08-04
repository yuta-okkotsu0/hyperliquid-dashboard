import { FastifyInstance } from 'fastify';
import { db, botStatus } from '../db/index.js';
import { eq } from 'drizzle-orm';

export default async function routes(app: FastifyInstance) {
  // GET /api/status
  app.get('/', async () => {
    const status = await db.query.botStatus.findFirst({
      where: eq(botStatus.id, 1),
    });
    
    if (!status) {
      return {
        status: 'STOPPED',
        lastHeartbeat: new Date().toISOString(),
        startedAt: null,
      };
    }
    
    // Check if heartbeat is stale (> 2 minutes)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const isStale = status.lastHeartbeat < twoMinutesAgo;
    
    return {
      status: isStale ? 'ERROR' : status.status,
      lastHeartbeat: status.lastHeartbeat.toISOString(),
      startedAt: status.startedAt?.toISOString(),
      isStale,
    };
  });
}