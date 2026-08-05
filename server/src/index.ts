import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { db } from './db/index.js';
import accountRoutes from './routes/account.js';
import positionsRoutes from './routes/positions.js';
import tradesRoutes from './routes/trades.js';
import analyticsRoutes from './routes/analytics.js';
import reasoningRoutes from './routes/reasoning.js';
import logsRoutes from './routes/logs.js';
import statusRoutes from './routes/status.js';
import streamRoutes, { broadcastUpdate } from './routes/stream.js';
import ordersRoutes from './routes/orders.js';
import strategiesRoutes from './routes/strategies.js';
import exchangeRoutes from './routes/exchange.js';
import activitiesRoutes from './routes/activities.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === 'development';

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
if (isDev) {
  await app.register(cors, {
    origin: true,
    credentials: true,
  });
}

// Register routes
await app.register(accountRoutes, { prefix: '/api/account' });
await app.register(positionsRoutes, { prefix: '/api/positions' });
await app.register(tradesRoutes, { prefix: '/api/trades' });
await app.register(analyticsRoutes, { prefix: '/api/analytics' });
await app.register(reasoningRoutes, { prefix: '/api/reasoning' });
await app.register(logsRoutes, { prefix: '/api/logs' });
await app.register(statusRoutes, { prefix: '/api/status' });
await app.register(streamRoutes, { prefix: '/api/stream' });
await app.register(ordersRoutes, { prefix: '/api/orders' });
await app.register(strategiesRoutes, { prefix: '/api/strategies' });
await app.register(exchangeRoutes, { prefix: '/api/exchange' });
await app.register(activitiesRoutes, { prefix: '/api/activities' });

// Health check
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Serve static files in production
if (!isDev) {
  await app.register(fastifyStatic, {
    root: join(__dirname, '../../web/dist'),
    prefix: '/',
    wildcard: false,
  });

  // Fallback for SPA routing
  app.get('/*', async (request, reply) => {
    return reply.sendFile('index.html');
  });
}

// Start server
try {
  const port = parseInt(process.env.PORT || '3001');
  await app.listen({ port, host: '0.0.0.0' });
  app.log.info(`Server running on http://localhost:${port}`);
  
  // Start periodic broadcast for real-time updates (every 5 seconds)
  setInterval(() => {
    broadcastUpdate();
  }, 5000);
  app.log.info('Real-time updates enabled (5s interval)');
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
