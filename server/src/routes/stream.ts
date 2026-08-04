import { FastifyInstance } from 'fastify';

// Store connected clients
const clients = new Set<any>();

export function broadcast(data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => {
    try {
      client.raw.write(message);
    } catch (err) {
      clients.delete(client);
    }
  });
}

export default async function routes(app: FastifyInstance) {
  // GET /api/stream/updates
  app.get('/updates', async (request, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    
    // Send initial connection message
    reply.raw.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);
    
    clients.add(reply);
    
    // Keep connection alive
    const keepAlive = setInterval(() => {
      try {
        reply.raw.write(': ping\n\n');
      } catch (err) {
        clearInterval(keepAlive);
        clients.delete(reply);
      }
    }, 30000);
    
    // Clean up on close
    request.raw.on('close', () => {
      clearInterval(keepAlive);
      clients.delete(reply);
    });
    
    // Don't close the reply - keep it open for SSE
    return reply;
  });
}

export { clients };