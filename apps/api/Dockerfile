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

# Copy API source
COPY apps/api/ ./apps/api/

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build the API
RUN cd apps/api && npm run build

WORKDIR /app/apps/api

EXPOSE 3001

# Run migrations + seed + start
CMD ["sh", "/app/apps/api/start.sh"]
