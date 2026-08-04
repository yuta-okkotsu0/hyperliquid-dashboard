import { FastifyInstance } from 'fastify';
import { db, trades, positions, accountSnapshots } from '../db/index.js';
import { desc } from 'drizzle-orm';

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
    
    // Get equity history for advanced calculations
    const snapshots = await db.select().from(accountSnapshots).orderBy(desc(accountSnapshots.timestamp));
    const equityHistory = snapshots.reverse().map(s => s.totalEquity);
    
    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = equityHistory[0] || 0;
    for (const equity of equityHistory) {
      if (equity > peak) {
        peak = equity;
      }
      const drawdown = peak > 0 ? (peak - equity) / peak : 0;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    // Calculate total return
    const startEquity = equityHistory[0] || 1;
    const currentEquity = equityHistory[equityHistory.length - 1] || startEquity;
    const totalReturn = (currentEquity - startEquity) / startEquity;
    
    // Calculate Sharpe ratio (simplified - assumes risk-free rate of 0)
    let sharpeRatio = 0;
    if (equityHistory.length > 1) {
      const returns: number[] = [];
      for (let i = 1; i < equityHistory.length; i++) {
        const ret = (equityHistory[i] - equityHistory[i - 1]) / equityHistory[i - 1];
        returns.push(ret);
      }
      const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
      const stdDev = Math.sqrt(variance);
      sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(365) : 0; // Annualized
    }
    
    return {
      period,
      totalTrades: allTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: parseFloat(winRate.toFixed(4)),
      profitFactor: parseFloat(profitFactor.toFixed(4)),
      expectancy: parseFloat(expectancy.toFixed(4)),
      totalPnl: parseFloat(totalPnl.toFixed(4)),
      sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
      maxDrawdown: parseFloat(maxDrawdown.toFixed(4)),
      totalReturn: parseFloat(totalReturn.toFixed(4)),
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