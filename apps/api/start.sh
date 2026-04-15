#!/bin/sh

echo "=== Railway startup ==="
echo "Node: $(node --version)"
echo "NPM: $(npm --version)"
echo "Working dir: $(pwd)"
echo "TSX binary: $(ls /app/node_modules/.bin/tsx 2>/dev/null || echo 'NOT FOUND')"

echo "Running DB migration..."
cd /app/apps/api && npx prisma@5 db push --accept-data-loss || echo "DB push failed, continuing..."

echo "Running seed..."
node /app/node_modules/.bin/tsx /app/apps/api/prisma/seed.ts || echo "Seed skipped"

echo "Starting API server..."
cd /app
exec node /app/node_modules/.bin/tsx /app/apps/api/src/index.ts
