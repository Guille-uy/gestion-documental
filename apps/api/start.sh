#!/bin/sh

echo "Running DB setup in background..."
(npx prisma@5 db push --accept-data-loss && npx tsx /app/apps/api/prisma/seed.ts || echo "DB setup skipped") &

echo "Starting API server..."
exec npx tsx /app/apps/api/src/index.ts
