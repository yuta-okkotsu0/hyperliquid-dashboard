#!/bin/bash
set -e

echo "🚀 Deploying Hyperliquid Dashboard..."

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build frontend
echo "🏗️ Building frontend..."
pnpm build

# Generate and run migrations
echo "🗄️ Setting up database..."
pnpm db:generate
pnpm db:migrate

# Start with PM2
echo "🟢 Starting server with PM2..."
pm2 start ecosystem.config.cjs

echo "✅ Dashboard deployed!"
echo "   API: http://localhost:3001/api"
echo "   App: http://localhost:3001"
