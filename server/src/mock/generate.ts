import { db, accountSnapshots, positions, trades, aiReasoning, logs, botStatus, strategies, orders, exchangeHealth, activities } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

const COINS = ['ETH', 'BTC', 'SOL', 'ARB', 'LINK'];

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateReasoning(coin: string, action: string, confidence: number): string {
  const reasons = [
    `Strong ${coin} momentum detected with RSI at oversold levels. Volume spike confirms institutional interest.`,
    `Breaking above 20-day EMA with increasing OBV. Market structure suggests continuation.`,
    `Funding rates turning negative while spot accumulates. Contrarian long opportunity.`,
    `Stop run below previous low created liquidity sweep. Reclaim of key level signals reversal.`,
    `Confluence of Fib 0.618 retracement and daily support. Risk/reward favorable for ${action.toLowerCase()}.`,
  ];
  return randomChoice(reasons);
}

async function generateMockData() {
  console.log('Generating mock data...');
  
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Generate strategies
  console.log('Creating strategies...');
  const strategyData = [
    { id: 'trend_following', name: 'Trend Follower', description: 'Follows strong trends with momentum confirmation' },
    { id: 'breakout', name: 'Breakout Hunter', description: 'Trades breakouts from key levels with volume confirmation' },
    { id: 'mean_reversion', name: 'Mean Reversion', description: 'Counter-trend trades at overbought/oversold levels' },
  ];
  
  for (const strat of strategyData) {
    await db.insert(strategies).values({
      id: strat.id,
      name: strat.name,
      description: strat.description,
      active: true,
      totalTrades: Math.floor(randomBetween(10, 50)),
      winningTrades: Math.floor(randomBetween(5, 30)),
      totalPnl: randomBetween(-2000, 5000),
      sharpeRatio: randomBetween(0.5, 2.5),
      maxDrawdown: randomBetween(0.05, 0.25),
    });
  }
  
  // Generate account snapshots (hourly for 30 days)
  console.log('Creating account snapshots...');
  let currentEquity = 10000;
  const snapshots = [];
  
  for (let i = 0; i < 30 * 24; i++) {
    const timestamp = new Date(thirtyDaysAgo.getTime() + i * 60 * 60 * 1000);
    const change = randomBetween(-200, 250);
    currentEquity = Math.max(5000, currentEquity + change);
    
    snapshots.push({
      id: uuidv4(),
      timestamp,
      totalEquity: currentEquity,
      availableBalance: currentEquity * 0.3,
      unrealizedPnl: randomBetween(-500, 800),
      realizedPnl24h: randomBetween(-300, 400),
    });
  }
  
  await db.insert(accountSnapshots).values(snapshots);
  
  // Generate positions and trades
  console.log('Creating positions, trades, and orders...');
  const numPositions = 25;
  const strategyIds = strategyData.map(s => s.id);
  
  for (let i = 0; i < numPositions; i++) {
    const coin = randomChoice(COINS);
    const side = Math.random() > 0.5 ? 'LONG' : 'SHORT';
    const isOpen = i < 5; // Keep last 5 open
    const entryPrice = randomBetween(100, 5000);
    const leverage = Math.floor(randomBetween(2, 10));
    const size = randomBetween(0.1, 5);
    const strategyId = randomChoice(strategyIds);
    const marginUsed = (size * entryPrice) / leverage;
    
    const openedAt = new Date(thirtyDaysAgo.getTime() + Math.random() * 25 * 24 * 60 * 60 * 1000);
    const closedAt = isOpen ? undefined : new Date(openedAt.getTime() + randomBetween(1, 72) * 60 * 60 * 1000);
    
    const positionId = uuidv4();
    const pnl = isOpen ? undefined : randomBetween(-800, 1200);
    
    await db.insert(positions).values({
      id: positionId,
      strategyId,
      coin,
      side,
      entryPrice,
      markPrice: isOpen ? entryPrice * randomBetween(0.95, 1.05) : entryPrice * (pnl! > 0 ? 1.1 : 0.9),
      size,
      leverage,
      unrealizedPnl: isOpen ? randomBetween(-500, 600) : 0,
      liquidationPrice: side === 'LONG' 
        ? entryPrice * (1 - 0.9 / leverage) 
        : entryPrice * (1 + 0.9 / leverage),
      marginUsed,
      openedAt,
      closedAt,
      status: isOpen ? 'OPEN' : 'CLOSED',
    });
    
    // Create pending order first
    const orderId = uuidv4();
    const orderType = randomChoice(['MARKET', 'LIMIT', 'STOP']);
    await db.insert(orders).values({
      id: orderId,
      strategyId,
      positionId,
      coin,
      side,
      orderType: orderType as 'MARKET' | 'LIMIT' | 'STOP',
      status: 'FILLED',
      size,
      price: orderType === 'LIMIT' ? entryPrice * 0.995 : entryPrice,
      filledPrice: entryPrice,
      createdAt: new Date(openedAt.getTime() - 60000),
      updatedAt: openedAt,
      closedAt: openedAt,
    });
    
    // Create activity for order filled
    await db.insert(activities).values({
      id: uuidv4(),
      strategyId,
      type: 'ORDER_FILLED',
      message: `${side} ${coin} order filled @ $${entryPrice.toFixed(2)}`,
      coin,
      data: JSON.stringify({ size, price: entryPrice, orderType }),
      timestamp: openedAt,
    });
    
    // Create entry trade
    const entryTradeId = uuidv4();
    await db.insert(trades).values({
      id: entryTradeId,
      strategyId,
      positionId,
      coin,
      side: side === 'LONG' ? 'BUY' : 'SELL',
      size,
      price: entryPrice,
      fee: size * entryPrice * 0.00035,
      timestamp: openedAt,
    });
    
    // Add reasoning for entry
    const confidence = randomBetween(0.6, 0.95);
    await db.insert(aiReasoning).values({
      id: uuidv4(),
      tradeId: entryTradeId,
      positionId,
      timestamp: openedAt,
      action: side === 'LONG' ? 'OPEN_LONG' : 'OPEN_SHORT',
      confidence,
      reasoning: generateReasoning(coin, side === 'LONG' ? 'LONG' : 'SHORT', confidence),
      indicators: JSON.stringify({
        rsi: randomBetween(20, 80),
        macd: randomBetween(-5, 5),
        ema20: entryPrice * randomBetween(0.98, 1.02),
        volume24h: randomBetween(1000000, 10000000),
        fundingRate: randomBetween(-0.001, 0.001),
      }),
    });
    
    // Create exit trade if closed
    if (!isOpen && closedAt) {
      const exitPrice = pnl! > 0 
        ? entryPrice * randomBetween(1.02, 1.15)
        : entryPrice * randomBetween(0.85, 0.98);
      
      const exitTradeId = uuidv4();
      await db.insert(trades).values({
        id: exitTradeId,
        strategyId,
        positionId,
        coin,
        side: side === 'LONG' ? 'SELL' : 'BUY',
        size,
        price: exitPrice,
        fee: size * exitPrice * 0.00035,
        pnl,
        timestamp: closedAt,
      });
      
      // Add activity for position closed
      await db.insert(activities).values({
        id: uuidv4(),
        strategyId,
        type: 'POSITION_CLOSED',
        message: `${side} ${coin} position closed @ $${exitPrice.toFixed(2)} (P&L: $${pnl!.toFixed(2)})`,
        coin,
        data: JSON.stringify({ size, exitPrice, pnl, entryPrice }),
        timestamp: closedAt,
      });
      
      // Add reasoning for exit
      const exitConfidence = randomBetween(0.5, 0.9);
      await db.insert(aiReasoning).values({
        id: uuidv4(),
        tradeId: exitTradeId,
        positionId,
        timestamp: closedAt,
        action: 'CLOSE',
        confidence: exitConfidence,
        reasoning: pnl! > 0 
          ? `Target reached. ${coin} showing signs of exhaustion at resistance. Taking profits.`
          : `Stop loss hit. ${coin} momentum reversed. Cutting losses to preserve capital.`,
        indicators: JSON.stringify({
          rsi: randomBetween(30, 70),
          macd: randomBetween(-3, 3),
          pnlPercent: (pnl! / (size * entryPrice)) * 100,
        }),
      });
    }
  }
  
  // Generate some pending orders
  console.log('Creating pending orders...');
  for (let i = 0; i < 3; i++) {
    const coin = randomChoice(COINS);
    const side = Math.random() > 0.5 ? 'LONG' : 'SHORT';
    const strategyId = randomChoice(strategyIds);
    const size = randomBetween(0.5, 2);
    const price = randomBetween(100, 5000);
    
    await db.insert(orders).values({
      id: uuidv4(),
      strategyId,
      coin,
      side,
      orderType: 'LIMIT',
      status: 'PENDING',
      size,
      price,
      createdAt: new Date(now.getTime() - randomBetween(60000, 300000)),
    });
    
    await db.insert(activities).values({
      id: uuidv4(),
      strategyId,
      type: 'ORDER_CREATED',
      message: `Pending ${side} ${coin} order @ $${price.toFixed(2)}`,
      coin,
      data: JSON.stringify({ size, price, orderType: 'LIMIT' }),
      timestamp: new Date(now.getTime() - randomBetween(60000, 300000)),
    });
  }
  
  // Generate logs
  console.log('Creating system logs...');
  const logMessages = [
    { level: 'INFO', message: 'Bot initialized successfully' },
    { level: 'INFO', message: 'Connected to Hyperliquid exchange' },
    { level: 'INFO', message: 'Strategy loaded: Trend Following v2.1' },
    { level: 'WARN', message: 'High volatility detected on ETH-PERP' },
    { level: 'INFO', message: 'Position opened: LONG 2.5 ETH @ $3,240' },
    { level: 'INFO', message: 'AI model latency: 245ms' },
    { level: 'ERROR', message: 'Rate limit approaching, backing off...' },
    { level: 'INFO', message: 'Position closed: LONG 2.5 ETH @ $3,412 (+$430)' },
    { level: 'INFO', message: 'Daily P&L report generated' },
    { level: 'WARN', message: 'Funding rate unusually high on SOL' },
  ];
  
  const logEntries = [];
  for (let i = 0; i < 100; i++) {
    const logTemplate = randomChoice(logMessages);
    logEntries.push({
      id: uuidv4(),
      timestamp: new Date(thirtyDaysAgo.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000),
      level: logTemplate.level as 'INFO' | 'WARN' | 'ERROR',
      source: (Math.random() > 0.3 ? 'BOT' : 'SYSTEM') as 'BOT' | 'SYSTEM',
      message: logTemplate.message,
    });
  }
  
  await db.insert(logs).values(logEntries);
  
  // Set bot status
  await db.insert(botStatus).values({
    id: 1,
    status: 'RUNNING',
    lastHeartbeat: now,
    startedAt: thirtyDaysAgo,
  });
  
  // Set exchange health
  await db.insert(exchangeHealth).values({
    id: 1,
    status: 'ONLINE',
    latencyMs: Math.floor(randomBetween(50, 200)),
    rateLimitUsed: Math.floor(randomBetween(10, 80)),
    rateLimitTotal: 100,
    lastCheck: now,
  });
  
  // Add some error/warning activities
  await db.insert(activities).values({
    id: uuidv4(),
    type: 'ERROR',
    message: 'Rate limit warning: 85/100 requests used',
    timestamp: new Date(now.getTime() - 3600000),
  });
  
  await db.insert(activities).values({
    id: uuidv4(),
    type: 'WARNING',
    message: 'High volatility detected on BTC',
    coin: 'BTC',
    timestamp: new Date(now.getTime() - 7200000),
  });
  
  console.log('✅ Mock data generated successfully!');
  console.log(`   - ${strategyData.length} strategies`);
  console.log(`   - ${snapshots.length} account snapshots`);
  console.log(`   - ${numPositions} positions`);
  console.log(`   - ${logEntries.length} log entries`);
  console.log(`   - Pending orders and activities created`);
}

generateMockData().catch(console.error);
