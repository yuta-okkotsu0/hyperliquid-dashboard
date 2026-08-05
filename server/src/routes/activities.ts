import { FastifyInstance } from 'fastify';
import { db, activities } from '../db/index.js';
import { desc, eq } from 'drizzle-orm';

export default async function routes(app: FastifyInstance) {
  // GET /api/activities?limit=20&strategyId=&type=
  app.get('/', async (request) => {
    const { limit = '20', strategyId, type } = request.query as { 
      limit?: string;
      strategyId?: string;
      type?: string;
    };
    
    const limitNum = parseInt(limit);
    
    // Build query
    let query = db.select().from(activities).orderBy(desc(activities.timestamp)).limit(limitNum);
    
    const allActivities = await query;
    
    // Filter manually (simpler for now)
    let filtered = allActivities;
    if (strategyId) {
      filtered = filtered.filter(a => a.strategyId === strategyId);
    }
    if (type) {
      filtered = filtered.filter(a => a.type === type);
    }
    
    return {
      data: filtered.map(a => ({
        id: a.id,
        strategyId: a.strategyId,
        type: a.type,
        message: a.message,
        coin: a.coin,
        data: a.data ? JSON.parse(a.data) : null,
        timestamp: a.timestamp.toISOString(),
      })),
    };
  });

  // GET /api/activities/recent - for live feed
  app.get('/recent', async (request) => {
    const { since } = request.query as { since?: string };
    
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 60000); // Default 1 minute ago
    
    const recent = await db.select()
      .from(activities)
      .where(activities.timestamp > sinceDate)
      .orderBy(desc(activities.timestamp))
      .limit(10);
    
    return {
      data: recent.map(a => ({
        id: a.id,
        strategyId: a.strategyId,
        type: a.type,
        message: a.message,
        coin: a.coin,
        data: a.data ? JSON.parse(a.data) : null,
        timestamp: a.timestamp.toISOString(),
      })),
    };
  });
}
