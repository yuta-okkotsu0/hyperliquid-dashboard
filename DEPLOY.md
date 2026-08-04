# Deployment Guide

## Production Setup

The dashboard runs as a single Node.js process serving both the API and the built frontend.

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- PM2 (`npm install -g pm2`) - optional but recommended
- Nginx - optional, for SSL/reverse proxy

### Quick Deploy

```bash
# 1. Clone/copy the project to your server
cd hyperliquid-dashboard

# 2. Install dependencies
pnpm install

# 3. Build frontend + backend
pnpm build
cd server && pnpm build && cd ..

# 4. Setup database
pnpm db:generate
pnpm db:migrate

# 5. Generate mock data (optional, for testing)
pnpm mock:generate

# 6. Start production server
PORT=3001 NODE_ENV=production node server/dist/index.js
```

The app will be available at `http://your-server:3001`

### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.cjs

# View logs
pm2 logs hyperliquid-dashboard

# Restart
pm2 restart hyperliquid-dashboard

# Save PM2 config to start on boot
pm2 save
pm2 startup
```

### Using the Deploy Script

```bash
chmod +x deploy.sh
./deploy.sh
```

### Nginx Reverse Proxy (with SSL)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

For SSL, use Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `NODE_ENV` | `development` | Set to `production` for production |

### Database

SQLite database is stored at `server/data/dashboard.db`. Back it up regularly:

```bash
# Backup script
cp server/data/dashboard.db backups/dashboard-$(date +%Y%m%d).db
```

### Updating

```bash
# Pull latest code
git pull

# Rebuild
pnpm install
pnpm build
cd server && pnpm build && cd ..

# Run migrations
pnpm db:migrate

# Restart
pm2 restart hyperliquid-dashboard
```

### Troubleshooting

**Port already in use:**
```bash
lsof -i :3001
kill -9 <PID>
```

**Database issues:**
```bash
# Reset database
rm server/data/dashboard.db
pnpm db:migrate
pnpm mock:generate
```

**Build errors:**
```bash
# Clean and rebuild
rm -rf web/dist server/dist
pnpm build
cd server && pnpm build
```
