FROM node:20-alpine

WORKDIR /app

# Copy root package files for workspaces
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install all dependencies
RUN npm install --legacy-peer-deps

# Copy shared package source
COPY packages/shared/ ./packages/shared/

# Build shared package so @dms/shared resolves at compile time
RUN npm run build --workspace=packages/shared

# Copy API source
COPY apps/api/ ./apps/api/

# Generate Prisma client (pin to v5 to match @prisma/client version)
RUN cd apps/api && npx prisma@5 generate

# No tsc build needed — tsx runs TypeScript directly at runtime

WORKDIR /app/apps/api

EXPOSE 3001

# Run migrations + seed + start
CMD ["sh", "/app/apps/api/start.sh"]
