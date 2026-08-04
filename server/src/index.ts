import Fastify from 'fastify';
import cors from '@fastify/cors';
import { db } from './db/index.js';
import accountRoutes from './routes/account.js';
import positionsRoutes from './routes/positions.js';
import tradesRoutes from './routes/trades.js';
import analyticsRoutes from './routes/analytics.js';
import reasoningRoutes from './routes/reasoning.js';
import logsRoutes from './routes/logs.js';
import statusRoutes from './routes/status.js';
import streamRoutes from './routes/stream.js';

const app = Fastify({
  logger: {
    level: 'info',
    transport: process.env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    } : undefined,
  },
});

// Register plugins
await app.register(cors, {
  origin: true,
  credentials: true,
});

// Register routes
await app.register(accountRoutes, { prefix: '/api/account' });
await app.register(positionsRoutes, { prefix: '/api/positions' });
await app.register(tradesRoutes, { prefix: '/api/trades' });
await app.register(analyticsRoutes, { prefix: '/api/analytics' });
await app.register(reasoningRoutes, { prefix: '/api/reasoning' });
await app.register(logsRoutes, { prefix: '/api/logs' });
await app.register(statusRoutes, { prefix: '/api/status' });
await app.register(streamRoutes, { prefix: '/api/stream' });

// Health check
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
try {
  const port = parseInt(process.env.PORT || '3001');
  await app.listen({ port, host: '0.0.0.0' });
  app.log.info(`Server running on http://localhost:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
