#!/bin/sh

echo "=== Railway startup ==="
echo "Node: $(node --version)"
echo "NPM: $(npm --version)"
echo "Working dir: $(pwd)"
echo "TSX binary: $(ls /app/node_modules/.bin/tsx 2>/dev/null || echo 'NOT FOUND')"

echo "Running DB setup in background..."
(cd /app/apps/api && npx prisma@5 db push --accept-data-loss && node /app/node_modules/.bin/tsx /app/apps/api/prisma/seed.ts || echo "DB setup skipped") &

echo "Starting API server..."
exec node /app/node_modules/.bin/tsx /app/apps/api/src/index.ts
