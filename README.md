# Hyperliquid Trading Dashboard

A simple, read-only dashboard for monitoring a Hyperliquid trading agent.

## Features

- **Real-time equity tracking** with interactive charts
- **Position monitoring** — open and closed positions
- **Trade history** with filtering by asset
- **AI reasoning viewer** — understand why the bot made each decision
- **Performance analytics** — win rate, expectancy, drawdown, Sharpe ratio
- **System logs** — bot activity and health monitoring
- **Responsive design** — works on mobile and desktop
- **Dark mode** — easy on the eyes

## Architecture

```
hyperliquid-dashboard/
├── server/          # Fastify backend (Node.js + TypeScript)
│   ├── src/db/      # Drizzle ORM + SQLite
│   ├── src/routes/  # API endpoints
│   └── src/mock/    # Mock data generator
├── web/             # React frontend (Vite + TypeScript)
│   └── src/pages/   # Dashboard, Positions, Trades, etc.
└── shared/          # Shared TypeScript types
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)

### Installation

```bash
# Clone and enter directory
cd hyperliquid-dashboard

# Install dependencies
pnpm install

# Generate database and mock data
pnpm db:migrate
pnpm mock:generate

# Start development servers (runs both frontend and backend)
pnpm dev
```

The dashboard will be available at `http://localhost:3000`
The API server runs at `http://localhost:3001`

## Development

### Generate Mock Data

```bash
pnpm mock:generate   # Create realistic trading data
pnpm mock:clear      # Clear all data
```

### Database

```bash
pnpm db:generate     # Generate Drizzle migrations
pnpm db:migrate      # Run migrations
pnpm db:studio       # Open Drizzle Studio (GUI)
```

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/account/equity` | Equity history |
| `GET /api/account/balance` | Current balance |
| `GET /api/positions` | All positions |
| `GET /api/trades` | Trade history |
| `GET /api/analytics/performance` | Performance metrics |
| `GET /api/reasoning` | AI reasoning |
| `GET /api/logs` | System logs |
| `GET /api/status` | Bot status |
| `GET /api/stream/updates` | Real-time SSE stream |

## Future: Connecting the Trading Agent

When your trading agent is ready, it will send data to the dashboard via POST requests:

```
POST /api/ingest/trade      # New trade
POST /api/ingest/position   # Position update
POST /api/ingest/snapshot   # Account snapshot
POST /api/ingest/reasoning  # AI decision log
POST /api/ingest/log        # System log
POST /api/ingest/heartbeat  # Health ping
```

The dashboard is **read-only** — it never trades, it only displays.

## Tech Stack

- **Backend**: Fastify + Drizzle ORM + SQLite
- **Frontend**: React + Vite + Tailwind CSS + Recharts
- **Real-time**: Server-Sent Events (SSE)
- **State**: TanStack Query

## License

MIT