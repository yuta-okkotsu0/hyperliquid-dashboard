import { FastifyInstance } from 'fastify';
import { db, logs } from '../db/index.js';
import { desc, eq } from 'drizzle-orm';

export default async function routes(app: FastifyInstance) {
  // GET /api/logs?level=ERROR&limit=100
  app.get('/', async (request) => {
    const { level, source, limit = '100', search } = request.query as { 
      level?: 'INFO' | 'WARN' | 'ERROR';
      source?: 'BOT' | 'SYSTEM';
      limit?: string;
      search?: string;
    };
    
    const limitNum = parseInt(limit);
    
    let query = db.select().from(logs).orderBy(desc(logs.timestamp)).limit(limitNum);
    
    const results = await query;
    
    // Filter in memory for now
    let filtered = results;
    if (level) {
      filtered = filtered.filter(l => l.level === level);
    }
    if (source) {
      filtered = filtered.filter(l => l.source === source);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(l => l.message.toLowerCase().includes(searchLower));
    }
    
    return {
      data: filtered.map(l => ({
        id: l.id,
        timestamp: l.timestamp.toISOString(),
        level: l.level,
        source: l.source,
        message: l.message,
      })),
    };
  });
}