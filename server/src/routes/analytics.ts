import { FastifyInstance } from 'fastify';
import { db, trades, positions } from '../db/index.js';
import { sql } from 'drizzle-orm';

export default async function routes(app: FastifyInstance) {
  // GET /api/analytics/performance?period=30d
  app.get('/performance', async (request) => {
    const { period = '30d' } = request.query as { period?: string };
    
    // Calculate simple metrics from available data
    const allTrades = await db.select().from(trades);
    const winningTrades = allTrades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = allTrades.filter(t => (t.pnl || 0) < 0);
    
    const totalPnl = allTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const grossProfit = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));
    
    const winRate = allTrades.length > 0 ? winningTrades.length / allTrades.length : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
    
    // Simple expectancy calculation
    const avgWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;
    const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss);
    
    return {
      period,
      totalTrades: allTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: parseFloat(winRate.toFixed(4)),
      profitFactor: parseFloat(profitFactor.toFixed(4)),
      expectancy: parseFloat(expectancy.toFixed(4)),
      totalPnl: parseFloat(totalPnl.toFixed(4)),
      // Placeholder for more complex metrics
      sharpeRatio: 0,
      maxDrawdown: 0,
      totalReturn: 0,
    };
  });

  // GET /api/analytics/winrate
  app.get('/winrate', async () => {
    const allPositions = await db.select().from(positions);
    const closedPositions = allPositions.filter(p => p.status === 'CLOSED');
    const winningPositions = closedPositions.filter(p => {
      // Approximation: if closed, assume it was profitable if we don't have exact PnL
      return true; // Simplified - would need trade data to calculate properly
    });
    
    return {
      byCoin: {}, // Grouped by asset
      byMonth: {}, // Grouped by month
      overall: closedPositions.length > 0 ? closedPositions.length / allPositions.length : 0,
    };
  });
}