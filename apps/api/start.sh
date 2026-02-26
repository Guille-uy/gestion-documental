#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding database (safe - skips existing users)..."
npx tsx /app/apps/api/prisma/seed.ts || echo "Seed skipped"

echo "Starting API server..."
exec node dist/index.js
