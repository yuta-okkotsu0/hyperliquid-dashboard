import { FastifyInstance } from 'fastify';
import { db, trades, positions, accountSnapshots, botStatus, activities, strategies } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export default async function routes(app: FastifyInstance) {
  // POST /api/ingest/trades - Push new trade
  app.post('/trades', async (request, reply) => {
    const body = request.body as {
      id?: string;
      strategyId?: string;
      positionId?: string;
      coin: string;
      side: 'BUY' | 'SELL';
      size: number;
      price: number;
      fee?: number;
      pnl?: number;
      timestamp?: string;
    };

    if (!body.coin || !body.side || !body.size || !body.price) {
      reply.status(400);
      return { error: 'Missing required fields: coin, side, size, price' };
    }

    try {
      const tradeId = body.id || randomUUID();
      const now = new Date();

      await db.insert(trades).values({
        id: tradeId,
        strategyId: body.strategyId || 'default',
        positionId: body.positionId,
        coin: body.coin.toUpperCase(),
        side: body.side,
        size: body.size,
        price: body.price,
        fee: body.fee || 0,
        pnl: body.pnl,
        timestamp: body.timestamp ? new Date(body.timestamp) : now,
      });

      // Also log as activity
      await db.insert(activities).values({
        id: randomUUID(),
        strategyId: body.strategyId || 'default',
        type: 'ORDER_FILLED',
        message: `${body.side} ${body.size} ${body.coin.toUpperCase()} @ $${body.price}`,
        coin: body.coin.toUpperCase(),
        data: JSON.stringify({ price: body.price, pnl: body.pnl }),
        timestamp: now,
      });

      app.log.info(`Trade ingested: ${tradeId} - ${body.coin} ${body.side}`);
      return { success: true, id: tradeId };
    } catch (err) {
      app.log.error(err);
      reply.status(500);
      return { error: 'Failed to insert trade' };
    }
  });

  // POST /api/ingest/positions - Create or update position
  app.post('/positions', async (request, reply) => {
    const body = request.body as {
      id?: string;
      strategyId?: string;
      coin: string;
      side: 'LONG' | 'SHORT';
      entryPrice: number;
      markPrice?: number;
      size: number;
      leverage?: number;
      unrealizedPnl?: number;
      liquidationPrice?: number;
      marginUsed?: number;
      openedAt?: string;
      closedAt?: string;
      status?: 'OPEN' | 'CLOSED' | 'LIQUIDATED';
    };

    if (!body.coin || !body.side || !body.entryPrice || !body.size) {
      reply.status(400);
      return { error: 'Missing required fields: coin, side, entryPrice, size' };
    }

    try {
      const positionId = body.id || randomUUID();
      const now = new Date();
      const status = body.status || 'OPEN';

      // Check if position exists
      const existing = body.id ? await db.query.positions.findFirst({
        where: eq(positions.id, body.id)
      }) : null;

      if (existing) {
        // Update existing position
        await db.update(positions)
          .set({
            markPrice: body.markPrice ?? existing.markPrice,
            size: body.size,
            unrealizedPnl: body.unrealizedPnl ?? existing.unrealizedPnl,
            liquidationPrice: body.liquidationPrice ?? existing.liquidationPrice,
            marginUsed: body.marginUsed ?? existing.marginUsed,
            status: status,
            closedAt: body.closedAt ? new Date(body.closedAt) : (status === 'CLOSED' ? now : existing.closedAt),
          })
          .where(eq(positions.id, positionId));
      } else {
        // Insert new position
        await db.insert(positions).values({
          id: positionId,
          strategyId: body.strategyId || 'default',
          coin: body.coin.toUpperCase(),
          side: body.side,
          entryPrice: body.entryPrice,
          markPrice: body.markPrice || body.entryPrice,
          size: body.size,
          leverage: body.leverage || 1,
          unrealizedPnl: body.unrealizedPnl || 0,
          liquidationPrice: body.liquidationPrice,
          marginUsed: body.marginUsed || 0,
          openedAt: body.openedAt ? new Date(body.openedAt) : now,
          closedAt: body.closedAt ? new Date(body.closedAt) : null,
          status: status,
        });

        // Log activity for new position
        await db.insert(activities).values({
          id: randomUUID(),
          strategyId: body.strategyId || 'default',
          type: 'POSITION_OPENED',
          message: `Opened ${body.side} ${body.size} ${body.coin.toUpperCase()} @ $${body.entryPrice}`,
          coin: body.coin.toUpperCase(),
          data: JSON.stringify({ entryPrice: body.entryPrice, leverage: body.leverage }),
          timestamp: now,
        });
      }

      app.log.info(`Position ingested: ${positionId} - ${body.coin} ${body.side}`);
      return { success: true, id: positionId };
    } catch (err) {
      app.log.error(err);
      reply.status(500);
      return { error: 'Failed to insert/update position' };
    }
  });

  // POST /api/ingest/account - Push account snapshot
  app.post('/account', async (request, reply) => {
    const body = request.body as {
      totalEquity: number;
      availableBalance: number;
      unrealizedPnl?: number;
      realizedPnl24h?: number;
      timestamp?: string;
    };

    if (body.totalEquity === undefined || body.availableBalance === undefined) {
      reply.status(400);
      return { error: 'Missing required fields: totalEquity, availableBalance' };
    }

    try {
      const snapshotId = randomUUID();
      const now = new Date();

      await db.insert(accountSnapshots).values({
        id: snapshotId,
        totalEquity: body.totalEquity,
        availableBalance: body.availableBalance,
        unrealizedPnl: body.unrealizedPnl || 0,
        realizedPnl24h: body.realizedPnl24h || 0,
        timestamp: body.timestamp ? new Date(body.timestamp) : now,
      });

      app.log.info(`Account snapshot ingested: ${snapshotId}`);
      return { success: true, id: snapshotId };
    } catch (err) {
      app.log.error(err);
      reply.status(500);
      return { error: 'Failed to insert account snapshot' };
    }
  });

  // POST /api/ingest/status - Update bot status/heartbeat
  app.post('/status', async (request, reply) => {
    const body = request.body as {
      status: 'RUNNING' | 'PAUSED' | 'ERROR' | 'STOPPED';
      message?: string;
    };

    if (!body.status) {
      reply.status(400);
      return { error: 'Missing required field: status' };
    }

    try {
      const now = new Date();

      // Update or insert bot status (singleton, id=1)
      const existing = await db.query.botStatus.findFirst({
        where: eq(botStatus.id, 1)
      });

      if (existing) {
        await db.update(botStatus)
          .set({
            status: body.status,
            lastHeartbeat: now,
          })
          .where(eq(botStatus.id, 1));
      } else {
        await db.insert(botStatus).values({
          id: 1,
          status: body.status,
          lastHeartbeat: now,
          startedAt: now,
        });
      }

      app.log.info(`Bot status updated: ${body.status}`);
      return { success: true, status: body.status };
    } catch (err) {
      app.log.error(err);
      reply.status(500);
      return { error: 'Failed to update status' };
    }
  });

  // POST /api/ingest/activity - Log an activity
  app.post('/activity', async (request, reply) => {
    const body = request.body as {
      strategyId?: string;
      type: 'ORDER_CREATED' | 'ORDER_FILLED' | 'ORDER_CANCELLED' | 'POSITION_OPENED' | 'POSITION_CLOSED' | 'ERROR' | 'WARNING' | 'INFO';
      message: string;
      coin?: string;
      data?: object;
      timestamp?: string;
    };

    if (!body.type || !body.message) {
      reply.status(400);
      return { error: 'Missing required fields: type, message' };
    }

    try {
      const activityId = randomUUID();
      const now = new Date();

      await db.insert(activities).values({
        id: activityId,
        strategyId: body.strategyId || 'default',
        type: body.type,
        message: body.message,
        coin: body.coin?.toUpperCase(),
        data: body.data ? JSON.stringify(body.data) : null,
        timestamp: body.timestamp ? new Date(body.timestamp) : now,
      });

      return { success: true, id: activityId };
    } catch (err) {
      app.log.error(err);
      reply.status(500);
      return { error: 'Failed to insert activity' };
    }
  });

  // POST /api/ingest/strategy - Create or update strategy
  app.post('/strategy', async (request, reply) => {
    const body = request.body as {
      id?: string;
      name: string;
      description?: string;
      active?: boolean;
      totalTrades?: number;
      winningTrades?: number;
      totalPnl?: number;
    };

    if (!body.name) {
      reply.status(400);
      return { error: 'Missing required field: name' };
    }

    try {
      const strategyId = body.id || randomUUID();
      const now = new Date();

      const existing = body.id ? await db.query.strategies.findFirst({
        where: eq(strategies.id, body.id)
      }) : null;

      if (existing) {
        await db.update(strategies)
          .set({
            name: body.name,
            description: body.description ?? existing.description,
            active: body.active ?? existing.active,
            totalTrades: body.totalTrades ?? existing.totalTrades,
            winningTrades: body.winningTrades ?? existing.winningTrades,
            totalPnl: body.totalPnl ?? existing.totalPnl,
          })
          .where(eq(strategies.id, strategyId));
      } else {
        await db.insert(strategies).values({
          id: strategyId,
          name: body.name,
          description: body.description,
          active: body.active ?? true,
          totalTrades: body.totalTrades || 0,
          winningTrades: body.winningTrades || 0,
          totalPnl: body.totalPnl || 0,
          createdAt: now,
        });
      }

      app.log.info(`Strategy ingested: ${strategyId} - ${body.name}`);
      return { success: true, id: strategyId };
    } catch (err) {
      app.log.error(err);
      reply.status(500);
      return { error: 'Failed to insert/update strategy' };
    }
  });
}
