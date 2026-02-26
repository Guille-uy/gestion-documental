# Local Development Setup Guide

## Quick Start (5 Minutes)

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Git

### One-Command Setup

```bash
# Clone repository
git clone <your-repo> dms
cd dms

# Install all dependencies
npm install

# Start PostgreSQL database
npm run docker:up

# Run migrations and seed demo data
npm run db:migrate
npm run db:seed

# Start frontend + backend dev servers
npm run dev
```

**Frontend**: http://localhost:5173  
**Backend API**: http://localhost:3001  
**Demo User**: admin@dms.local / Admin@12345

That's it! Both frontend and backend are running.

---

## Step-by-Step Setup

### 1. Environment Setup

Node.js 18+ ([Download](https://nodejs.org)):
```bash
node --version  # v18.0.0 or higher
npm --version   # 9.0.0 or higher
```

### 2. Clone Repository

```bash
git clone <your-repo-url> dms
cd dms
```

### 3. Install Dependencies

```bash
# Install all workspace dependencies
npm install

# Verify installation
npm list @dms/shared
```

### 4. Configure Environment Variables

**Backend** (`apps/api/.env`):
```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env`:
```env
# Database
DATABASE_URL=postgresql://dms_user:dms_password@localhost:5432/dms_db

# JWT Secrets (use strong random values in production)
JWT_SECRET=your-secret-key-minimum-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-minimum-32-chars

# API Configuration
NODE_ENV=development
PORT=3001
API_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:5173

# Google Drive
GOOGLE_APPLICATION_CREDENTIALS=./credentials-sa.json
GOOGLE_DRIVE_FOLDER_ID=<optional-drive-folder-id>

# Logging
LOG_LEVEL=debug
```

**Frontend** (`apps/web/.env`):
```bash
cp apps/web/.env.example apps/web/.env
```

Edit `apps/web/.env`:
```env
# API
VITE_API_URL=http://localhost:3001/api
```

### 5. Setup Database

#### Option A: Docker (Recommended for Development)

```bash
# Start PostgreSQL container
npm run docker:up

# Wait 10 seconds for database to be ready

# Run migrations
npm run db:migrate

# (Optional) Seed demo data
npm run db:seed
```

#### Option B: Local PostgreSQL

```bash
# Install PostgreSQL (macOS)
brew install postgresql@16
brew services start postgresql@16

# Install PostgreSQL (Windows)
# Download from https://www.postgresql.org/download/windows/
# Use default password during installation

# Create database and user
psql -U postgres
CREATE DATABASE dms_db;
CREATE USER dms_user WITH PASSWORD 'dms_password';
GRANT ALL PRIVILEGES ON DATABASE dms_db TO dms_user;
\q

# Run migrations
npm run db:migrate

# (Optional) Seed demo data
npm run db:seed
```

### 6. Verify Database Connection

```bash
# Check if PostgreSQL is running
docker ps  # Should show PostgreSQL container or
psql -U dms_user -d dms_db -h localhost -c "SELECT version();"

# Check Prisma can connect
npm run db:status
```

### 7. Google Drive Setup (Optional)

To enable file uploads to Google Drive:

1. Create Google Cloud Project:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project

2. Enable Google Drive API:
   - Search for "Google Drive API"
   - Click Enable

3. Create Service Account:
   - Go to "Service Accounts"
   - Create new service account
   - Create JSON key
   - Save as `apps/api/credentials-sa.json`

4. Share Google Drive Folder:
   - Create folder in Google Drive (e.g., `CompanyDMS`)
   - Get folder ID from URL
   - Right-click folder → Share
   - Share with service account email
   - Give "Editor" access

5. Update `.env`:
   ```env
   GOOGLE_DRIVE_FOLDER_ID=<folder-id-from-step-4>
   ```

**Testing Google Drive:**
```bash
curl http://localhost:3001/api/auth/test-drive
```

Should return:
```json
{
  "success": true,
  "data": {
    "message": "Google Drive access is working",
    "folder": "CompanyDMS"
  }
}
```

### 8. Start Development Servers

#### All Together (Recommended)

```bash
npm run dev
```

This starts:
- **Frontend** (Vite): http://localhost:5173
- **Backend** (Express): http://localhost:3001
- **Database** (PostgreSQL): localhost:5432

#### Separately

```bash
# Terminal 1: Backend
npm run dev:api

# Terminal 2: Frontend
npm run dev:web

# Terminal 3: Database (if using Docker)
npm run docker:up
```

### 9. Verify Everything Works

**Backend Health Check:**
```bash
curl http://localhost:3001/api/health
```

Response:
```json
{
  "success": true,
  "message": "Backend is running"
}
```

**Frontend**:
Open http://localhost:5173 in your browser

**Login with demo user:**
- Email: `admin@dms.local`
- Password: `Admin@12345`

---

## Demo Users

After running `npm run db:seed`, these users are available:

| Email | Password | Role | Area |
|-------|----------|------|------|
| admin@dms.local | Admin@12345 | ADMIN | - |
| qm@dms.local | QM@12345 | QUALITY_MANAGER | Quality Assurance |
| owner@dms.local | Owner@12345 | DOCUMENT_OWNER | Operations |
| reviewer@dms.local | Reviewer@12345 | REVIEWER | Quality Assurance |
| approver@dms.local | Approver@12345 | APPROVER | Management |
| reader@dms.local | Reader@12345 | READER | Operations |

---

## Common Tasks

### Add New Node Packages

```bash
# Add to shared types
npm install zod --workspace=@dms/shared

# Add to backend
npm install lodash --workspace=apps/api

# Add to frontend
npm install react-query --workspace=apps/web
```

### Database Migrations

```bash
# Create migration from schema changes
npm run db:migrate:dev

# Push schema to database
npm run db:migrate:deploy

# Reset database (DELETES DATA)
npm run db:reset

# View database in GUI
npm run db:studio
```

### Build Frontend

```bash
npm run build:web

# Output in apps/web/dist/
```

### Build Backend

```bash
npm run build:api

# Output in apps/api/dist/
```

### Run Tests

```bash
# All tests
npm test

# Specific workspace
npm test --workspace=apps/api

# Watch mode
npm run test:watch
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Format code
npm run format
```

---

## Project Structure

```
dms/
├── apps/
│   ├── api/                    # Express backend
│   │   ├── src/
│   │   │   ├── controllers/    # Request handlers
│   │   │   ├── services/       # Business logic
│   │   │   ├── routes/         # API endpoints
│   │   │   ├── middleware/     # Auth, error handling
│   │   │   ├── utils/          # Helpers (JWT, logging, Google Drive)
│   │   │   └── index.ts        # Server entry point
│   │   ├── .env                # Environment variables
│   │   └── package.json
│   │
│   └── web/                    # React frontend
│       ├── src/
│       │   ├── pages/          # Page components
│       │   ├── components/     # Reusable components
│       │   ├── store/          # Zustand state
│       │   ├── services/       # API client
│       │   ├── App.tsx         # Routing
│       │   └── main.tsx        # Entry point
│       ├── .env                # Environment variables
│       └── package.json
│
├── packages/
│   └── shared/                 # Shared types & schemas
│       ├── src/
│       │   └── index.ts        # Enums, DTOs, Zod schemas
│       └── package.json
│
├── prisma/
│   ├── schema.prisma           # Database models
│   └── seed.ts                 # Demo data
│
├── package.json                # Monorepo configuration
├── docker-compose.yml          # PostgreSQL container
├── .env.example                # Environment template
├── README.md                   # Full documentation
├── API.md                      # API documentation
└── DEPLOYMENT.md               # Deployment guide
```

---

## Troubleshooting

### "Port 5173 already in use"

```bash
# Kill process using port 5173
lsof -ti:5173 | xargs kill -9

# Or use different port
PORT=5174 npm run dev:web
```

### "Port 3001 already in use"

```bash
# Kill process using port 3001
lsof -ti:3001 | xargs kill -9

# Or use different port
PORT=3002 npm run dev:api
```

### "PostgreSQL connection refused"

```bash
# Check if Docker is running
docker ps

# Start PostgreSQL
npm run docker:up

# Check logs
docker logs dms-postgres
```

### "Module not found @dms/shared"

```bash
# Ensure shared package is built
npm run build:shared

# Or reinstall
rm -rf node_modules package-lock.json
npm install
```

### Login page shows "Cannot reach API"

```bash
# Verify backend is running
curl http://localhost:3001/api/health

# Check VITE_API_URL in .env
cat apps/web/.env

# Restart frontend dev server
npm run dev:web
```

### Database migrations fail

```bash
# Reset database (WARNING: deletes all data)
npm run db:reset

# Verify schema
npm run db:migrate:deploy

# Reseed demo data
npm run db:seed
```

### Google Drive upload fails

```bash
# Check credentials file exists
ls -la apps/api/credentials-sa.json

# Verify folder is shared with service account
# Check GOOGLE_DRIVE_FOLDER_ID is set
grep GOOGLE_DRIVE_FOLDER_ID apps/api/.env

# Test Drive access
curl http://localhost:3001/api/auth/test-drive
```

---

## Performance Tips

### Frontend Development

```bash
# Enable faster builds
export VITE_ENV=development

# Clear Vite cache if build is slow
rm -rf apps/web/dist
npm run dev:web
```

### Backend Development

```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev:api

# Clear Node modules cache
rm -rf apps/api/dist
npm run build:api
```

### Database Performance

```bash
# Recreate indexes
npm run db:migrate:deploy

# Analyze query performance
npm run db:studio
```

---

## IDE Setup

### VS Code Extensions (Recommended)

- **ES7+ React/Redux/React-Native snippets**
- **PostgreSQL**
- **Prisma**
- **Postman** (for API testing)
- **Thunder Client** (lightweight API client)
- **Better Comments**
- **GitLens**

### TypeScript Workspace

```json
// .vscode/settings.json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  }
}
```

---

## Next Steps

1. **Explore the API**: Open http://localhost:3001/api and check available endpoints
2. **Create a document**: Use the frontend to create and upload a document
3. **Test workflows**: Submit for review and approve documents
4. **Check audit logs**: View all actions in the Audit Logs page (Admin only)
5. **Customize**: Modify theme colors in `tailwind.config.js`
6. **Deploy**: Follow [DEPLOYMENT.md](DEPLOYMENT.md) for production setup

---

## Need Help?

- Check [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Read [API.md](API.md) for detailed endpoint documentation
- Check [README.md](README.md) for full application overview
- Open an issue on GitHub for bugs

Happy coding! 🚀
