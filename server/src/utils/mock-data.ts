import { db, accountSnapshots, positions, trades, strategies, activities } from '../db/index.js';
import { randomUUID } from 'crypto';

export async function generateMockData() {
  console.log('Generating mock data...');
  
  // Check if we already have data
  const existingTrades = await db.query.trades.findFirst();
  if (existingTrades) {
    console.log('Mock data already exists, skipping...');
    return;
  }

  // Create default strategy
  const strategyId = randomUUID();
  await db.insert(strategies).values({
    id: strategyId,
    name: 'Default Strategy',
    description: 'Auto-generated mock strategy',
    active: true,
    totalTrades: 10,
    winningTrades: 6,
    totalPnl: 1250.50,
  });

  // Create sample account snapshot
  await db.insert(accountSnapshots).values({
    id: randomUUID(),
    totalEquity: 15000.00,
    availableBalance: 8000.00,
    unrealizedPnl: 500.00,
    realizedPnl24h: 250.00,
  });

  // Create sample positions
  const coins = ['BTC', 'ETH', 'SOL'];
  for (const coin of coins) {
    await db.insert(positions).values({
      id: randomUUID(),
      strategyId,
      coin,
      side: Math.random() > 0.5 ? 'LONG' : 'SHORT',
      entryPrice: coin === 'BTC' ? 65000 : coin === 'ETH' ? 3500 : 150,
      markPrice: coin === 'BTC' ? 65500 : coin === 'ETH' ? 3550 : 155,
      size: Math.random() * 10 + 1,
      leverage: 2,
      unrealizedPnl: Math.random() * 200 - 50,
      status: 'OPEN',
    });
  }

  // Create sample trades
  for (let i = 0; i < 10; i++) {
    const coin = coins[Math.floor(Math.random() * coins.length)];
    await db.insert(trades).values({
      id: randomUUID(),
      strategyId,
      coin,
      side: Math.random() > 0.5 ? 'BUY' : 'SELL',
      size: Math.random() * 5 + 0.5,
      price: coin === 'BTC' ? 64000 + Math.random() * 2000 : coin === 'ETH' ? 3400 + Math.random() * 200 : 140 + Math.random() * 20,
      fee: Math.random() * 5,
      pnl: Math.random() * 100 - 30,
    });
  }

  // Create sample activities
  await db.insert(activities).values({
    id: randomUUID(),
    strategyId,
    type: 'INFO',
    message: 'Mock data initialized',
    timestamp: new Date(),
  });

  console.log('Mock data generation complete!');
}
