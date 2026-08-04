import { FastifyInstance } from 'fastify';
import { db, aiReasoning } from '../db/index.js';
import { desc, eq } from 'drizzle-orm';

export default async function routes(app: FastifyInstance) {
  // GET /api/reasoning?tradeId=xxx&positionId=xxx
  app.get('/', async (request) => {
    const { tradeId, positionId, limit = '50' } = request.query as { 
      tradeId?: string;
      positionId?: string;
      limit?: string;
    };
    
    const limitNum = parseInt(limit);
    
    let query = db.select().from(aiReasoning).orderBy(desc(aiReasoning.timestamp)).limit(limitNum);
    
    const results = await query;
    
    // Filter in memory for now (optimize with proper queries later)
    let filtered = results;
    if (tradeId) {
      filtered = filtered.filter(r => r.tradeId === tradeId);
    }
    if (positionId) {
      filtered = filtered.filter(r => r.positionId === positionId);
    }
    
    return {
      data: filtered.map(r => ({
        id: r.id,
        tradeId: r.tradeId,
        positionId: r.positionId,
        timestamp: r.timestamp.toISOString(),
        action: r.action,
        confidence: r.confidence,
        reasoning: r.reasoning,
        indicators: JSON.parse(r.indicators),
      })),
    };
  });

  // GET /api/reasoning/:id
  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string };
    
    const reasoning = await db.query.aiReasoning.findFirst({
      where: eq(aiReasoning.id, id),
    });
    
    if (!reasoning) {
      return app.httpErrors.notFound('Reasoning not found');
    }
    
    return {
      id: reasoning.id,
      tradeId: reasoning.tradeId,
      positionId: reasoning.positionId,
      timestamp: reasoning.timestamp.toISOString(),
      action: reasoning.action,
      confidence: reasoning.confidence,
      reasoning: reasoning.reasoning,
      indicators: JSON.parse(reasoning.indicators),
    };
  });
}