#!/bin/sh

echo "Running database migrations..."
npx prisma@5 db push --accept-data-loss || echo "DB push failed, continuing..."

echo "Seeding database (safe - skips existing users)..."
npx tsx /app/apps/api/prisma/seed.ts || echo "Seed skipped"

echo "Starting API server..."
exec npx tsx /app/apps/api/src/index.ts
