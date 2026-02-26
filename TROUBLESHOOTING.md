# Troubleshooting Guide

## Quick Diagnostics

### 1. Verify All Services Are Running

```bash
# Check frontend
curl http://localhost:5173

# Check backend
curl http://localhost:3001/api/health

# Check database
docker ps | grep postgres
```

Expected results:
- Frontend: HTML page (React app)
- Backend: `{ "success": true, "message": "Backend is running" }`
- Database: Container status "Up"

---

## Common Issues

## Authentication & Login

### Issue: "Cannot reach API" on login page

**Symptoms:**
- Login page shows error message
- No network requests visible in DevTools

**Solutions:**

```bash
# 1. Verify backend is running
curl http://localhost:3001/api/health

# 2. Check VITE_API_URL in frontend .env
cat apps/web/.env
# Should contain: VITE_API_URL=http://localhost:3001/api

# 3. Restart frontend dev server
npm run dev:web

# 4. Check CORS configuration in backend
# apps/api/src/index.ts should have:
# app.use(cors({ origin: process.env.CORS_ORIGIN }));

# 5. Verify CORS_ORIGIN in backend .env
cat apps/api/.env
# Should contain: CORS_ORIGIN=http://localhost:5173
```

### Issue: "Invalid credentials" on every login attempt

**Symptoms:**
- Correct username/password rejected
- "Invalid password" or "User not found" error

**Solutions:**

```bash
# 1. Check if demo users exist
npm run db:studio
# Navigate to "users" table, verify admin@dms.local exists

# 2. Reseed database with demo users
npm run db:reset
npm run db:seed

# 3. Manually create a user (if seeding fails)
npm run db:shell
# Then run:
INSERT INTO "User" (id, email, password, "firstName", "lastName", role, "isActive", "createdAt", "updatedAt")
VALUES ('test-123', 'test@dms.local', '$2b$10$ENCRYPTED_PASSWORD', 'Test', 'User', 'ADMIN', true, NOW(), NOW());

# 4. Check authentication middleware
# Verify bcrypt is comparing passwords correctly
# Test: npm test -- auth.test.ts
```

### Issue: "Refresh token expired" immediately after login

**Symptoms:**
- Login succeeds but user is logged out after page refresh
- 401 Unauthorized after token refresh attempt

**Solutions:**

```bash
# 1. Check JWT secrets are set
cat apps/api/.env | grep JWT_SECRET
# Both JWT_SECRET and JWT_REFRESH_SECRET should be present

# 2. Verify token expiration times
# In apps/api/src/utils/jwt.ts:
# - Access token: 24h
# - Refresh token: 7d

# 3. Check localStorage in browser DevTools
# Application → Storage → Local Storage → http://localhost:5173
# Should contain: auth-storage (with tokens and user)

# 4. Verify token refresh endpoint
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token-here"
  }'
```

---

## Database Issues

### Issue: "Cannot connect to database" / Connection refused

**Symptoms:**
- Backend fails to start
- Error: `connect ECONNREFUSED 127.0.0.1:5432`
- Prisma migration fails

**Solutions:**

```bash
# 1. Check if PostgreSQL container is running
docker ps
# Should show: dms-postgres (or similar)

# 2. If not running, start it
npm run docker:up

# 3. Wait a few seconds for database to be ready
sleep 10

# 4. Check container logs
docker logs dms-postgres
# Look for: "database system is ready to accept connections"

# 5. If still not connecting, check DATABASE_URL
cat apps/api/.env | grep DATABASE_URL
# Should be: postgresql://dms_user:dms_password@localhost:5432/dms_db

# 6. Test connection manually
psql postgresql://dms_user:dms_password@localhost:5432/dms_db -c "SELECT 1;"
# Should return: 1

# 7. Reset Docker database (WARNING: deletes all data)
docker compose down -v
npm run docker:up
npm run db:migrate
npm run db:seed
```

### Issue: "Database migration failed"

**Symptoms:**
- Error during `npm run db:migrate`
- Prisma schema out of sync with database

**Solutions:**

```bash
# 1. Check for pending migrations
npm run db:migrate:status

# 2. Reset to clean state (DELETES ALL DATA)
npm run db:reset

# 3. Run migrations again
npm run db:migrate

# 4. Reseed demo data
npm run db:seed

# 5. If still failing, check schema validity
npm run db:studio
# Opens Prisma Studio - verify all models are present

# 6. Manual reset (if above fails)
# Delete container and volume
docker compose down -v

# Rebuild
npm run docker:up
npm run db:push  # Sync schema with database
npm run db:seed
```

### Issue: "Unique constraint violation" on document creation

**Symptoms:**
- Can't create document with same code
- Error: `Unique constraint failed on the fields: (\`code\`)`

**Solutions:**

```bash
# 1. Document code must be unique
# Use a different code: DOC-001, DOC-002, etc.

# 2. Check existing documents
npm run db:studio
# Go to "documents" table and check "code" values

# 3. If demo data has conflicts, reset
npm run db:reset
npm run db:seed

# 4. In tests, use unique IDs
// ❌ Wrong - reuses same code
const doc1 = await createDocument({ code: 'TEST' });
const doc2 = await createDocument({ code: 'TEST' }); // Fails!

// ✅ Right - unique codes
const doc1 = await createDocument({ code: 'TEST-001' });
const doc2 = await createDocument({ code: 'TEST-002' });
```

---

## File Upload & Google Drive

### Issue: "Failed to upload file" / Google Drive error

**Symptoms:**
- Upload button shows error
- Backend logs: "Google Drive API error"
- Status: 500 Internal Server Error

**Solutions:**

```bash
# 1. Check Google Drive credentials file exists
ls -la apps/api/credentials-sa.json
# File should exist and be valid JSON

# 2. Verify Google Drive folder is shared
# In Google Drive, open "CompanyDMS" folder
# Check sharing settings → Editor access to service account email

# 3. Get folder ID correctly
# Open CompanyDMS in Google Drive
# Copy folder ID from URL: /folders/FOLDER_ID_HERE

# 4. Update .env with correct folder ID
nano apps/api/.env
# GOOGLE_DRIVE_FOLDER_ID=<correct-id>

# 5. Test Google Drive connection
curl http://localhost:3001/api/auth/test-drive
# Should return: { "success": true, "message": "Google Drive access is working" }

# 6. Check Google Cloud permissions
# In Google Cloud Console:
# - Service Account has Drive API access
# - Keys are valid and not expired
# - Domain delegation enabled (if using GSuite)

# 7. Verify file upload middleware
# Check multer configuration in apps/api/src/routes/documents.ts
# Max file size should be > file being uploaded

# 8. Check backend logs for detailed error
npm run dev:api
# Upload file and watch console output
```

### Issue: "File uploaded but can't download"

**Symptoms:**
- Upload succeeds
- Download button fails
- Error: "File not found in Google Drive"

**Solutions:**

```bash
# 1. Check file reference in database
npm run db:studio
# Go to "documents" table
# Verify "googleDriveFileId" is populated with Google Drive file ID

# 2. Verify file exists in Google Drive
# Check CompanyDMS folder manually
# File should match name uploaded

# 3. Check Stream handling
# Download endpoint uses fs.createReadStream()
# Ensure Content-Type and Content-Length headers are set

# 4. Test with cURL
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/documents/DOC_ID/download \
  -o test-download.pdf

# 5. Check backend logs
npm run dev:api
# Attempt download and check for errors
```

---

## Frontend Build & Deployment

### Issue: "Vite build fails" / "dist folder empty"

**Symptoms:**
- `npm run build:web` shows errors
- Vite build hangs or crashes

**Solutions:**

```bash
# 1. Clear Vite cache
rm -rf apps/web/dist
rm -rf apps/web/.vite

# 2. Clear node_modules if necessary
rm -rf apps/web/node_modules
npm install

# 3. Check TypeScript errors first
npm run type-check --workspace=apps/web

# 4. Fix any TypeScript issues before building
# Missing types, incorrect imports, etc.

# 5. Build with verbose output
npm run build:web -- --debug

# 6. Check Vite config
cat apps/web/vite.config.ts
# Should have: build.outDir = 'dist'

# 7. Check package.json main entry point
cat apps/web/package.json | grep -A2 main
```

### Issue: "Blank page after deployment to Netlify"

**Symptoms:**
- Homepage shows nothing
- Browser console shows no errors
- Network tab shows 200 OK for HTML

**Solutions:**

```bash
# 1. Check Netlify build logs
# Netlify UI → Deploys → Latest → View Logs
# Look for build errors

# 2. Verify netlify.toml is correct
cat apps/web/netlify.toml
# Should have:
# - build.command = "npm run build"
# - build.publish = "apps/web/dist"
# - Redirect rules for SPA

# 3. Check environment variables in Netlify UI
# Settings → Environment
# VITE_API_URL should be set to backend URL

# 4. Clear Netlify cache
# Netlify UI → Settings → Clear cache & redeploy

# 5. Test build locally
npm run build:web
# Then serve locally:
npx http-server apps/web/dist -p 3000

# 6. Check for missing environment variables at build time
# Netlify should show VITE_API_URL during build
# npm run build v-web -- --debug

# 7. Verify React Router paths
# apps/web/src/App.tsx should have correct routes
# Netlify redirects should fallback index.html for all routes
```

### Issue: "API calls fail after Netlify deployment"

**Symptoms:**
- Works locally but fails on Netlify
- CORS error or 404 on API calls
- Error: "Cannot reach API"

**Solutions:**

```bash
# 1. Check frontend VITE_API_URL
# Netlify UI → Settings → Environment → VITE_API_URL
# Should be: https://your-backend-domain.com/api

# 2. Verify backend URL is accessible
curl https://your-backend-domain.com/api/health

# 3. Check CORS configuration on backend
# apps/api/src/index.ts should have:
# cors({ origin: 'https://your-frontend-domain.com' })

# 4. Update backend CORS for production
cat apps/api/.env
# CORS_ORIGIN should be Netlify domain

# 5. Check Netlify proxy rules (if using)
cat apps/web/netlify.toml
# Alternative: proxy API to backend

# 6. Test locally with simulated production build
npm run build:web
npx http-server apps/web/dist

# Then test with backend at different origin
# This will trigger CORS checks
```

---

## Network & Port Issues

### Issue: "Port 5173 already in use" (Frontend)

**Symptoms:**
- `npm run dev:web` fails immediately
- Error: `EADDRINUSE :::5173`

**Solutions:**

```bash
# 1. Find what's using port 5173
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5173 | xargs kill -9

# 2. Use different port
PORT=5174 npm run dev:web

# 3. Update frontend configuration
# apps/web/vite.config.ts
export default {
  server: {
    port: 5174,
    ...
  }
}
```

### Issue: "Port 3001 already in use" (Backend)

**Symptoms:**
- `npm run dev:api` fails
- Error: `EADDRINUSE :::3001`

**Solutions:**

```bash
# 1. Find what's using port 3001
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# 2. Use different port
PORT=3002 npm run dev:api

# 3. Multiple backend instances running
# Check if old node process is still running
ps aux | grep node

# 4. Kill all node processes (be careful!)
# macOS/Linux
killall node

# 5. Update API configuration
cat apps/api/.env
PORT=3002
```

### Issue: "Localhost DNS resolution issues"

**Symptoms:**
- Frontend can't reach `http://localhost:3001`
- Error: `getaddrinfo ENOTFOUND localhost`

**Solutions:**

```bash
# 1. Check /etc/hosts file (macOS/Linux)
grep localhost /etc/hosts
# Should contain:
# 127.0.0.1       localhost
# ::1             localhost

# 2. Add if missing (macOS/Linux)
echo "127.0.0.1 localhost" | sudo tee -a /etc/hosts

# 3. Windows hosts file
# File: C:\Windows\System32\drivers\etc\hosts
# Add: 127.0.0.1       localhost

# 4. Try using IP instead
# Instead of localhost, try 127.0.0.1
# VITE_API_URL=http://127.0.0.1:3001/api

# 5. Flush DNS cache (macOS)
dscacheutil -flushcache
```

---

## Performance Issues

### Issue: "Application is slow" / laggy UI

**Symptoms:**
- Page takes > 3 seconds to load
- UI typing is delayed
- Infinite loading spinner

**Solutions:**

```bash
# 1. Check network tab in DevTools
# Identify slow API calls
# Look for requests > 1000ms

# 2. Check backend performance
npm run dev:api
# Look for slow database queries
# Enable Prisma query logging:
# DATABASE_URL=file:./dev.db?logQueries=true

# 3. Database query optimization
# Add indexes to frequently searched columns
# In prisma/schema.prisma:
model Document {
  id String @id @default(cuid())
  code String @unique
  status DocumentStatus @db.Enum
  
  @@index([status])
  @@index([createdBy])
}

# 4. Frontend optimization
npm run build:web -- --analyze

# 5. Check for N+1 queries
# Example: fetching documents and users separately
# Instead: use Prisma include/select
const docs = await prisma.document.findMany({
  include: { createdBy: true },  // Fetch in single query
});

# 6. Enable caching
# Set appropriate Cache-Control headers:
res.set('Cache-Control', 'public, max-age=3600');

# 7. Use pagination
# Don't load all documents at once
const docs = await prisma.document.findMany({
  take: 10,
  skip: (page - 1) * 10,
});
```

### Issue: "Memory usage keeps growing" (Memory leak)

**Symptoms:**
- Memory usage increases over time
- Eventually crashes with "out of memory"

**Solutions:**

```bash
# 1. Monitor memory usage
# Windows Task Manager → Processes → Node.js

# 2. Check for circular references
# In Zustand store, ensure cleanup happens:
export const useAuthStore = create((set) => ({
  logout: () => {
    set({ user: null, tokens: null });
    localStorage.removeItem('auth-storage');
  }
}));

# 3. Close database connections properly
// ✅ Correct - disconnect after migrations
await prisma.$disconnect();

// ❌ Wrong - connection left open
const result = await prisma.user.findMany();

# 4. Clean up event listeners
useEffect(() => {
  const handler = () => console.log('resize');
  window.addEventListener('resize', handler);
  
  return () => {
    window.removeEventListener('resize', handler);  // Cleanup!
  };
}, []);

# 5. Check for dangling promises
// ❌ Wrong - promise never resolves
setTimeout(() => {
  // Never completes
  await db.query('...');
}, 1000);

# 6. Profile with Node inspector
node --inspect apps/api/dist/index.js
```

---

## Development Tools

### Issue: "TypeScript errors not showing"

**Symptoms:**
- Code compiles but has errors
- IDE doesn't show red squiggles
- Tests fail with type errors

**Solutions:**

```bash
# 1. Enable type checking in IDE
# VS Code → Extensions → install "TypeScript Vue Plugin"

# 2. Run type checker
npm run type-check

# 3. Fix all errors
npm run type-check -- --noEmit

# 4. Reset TypeScript cache
rm -rf node_modules/.cache

# 5. Verify tsconfig.json
cat apps/api/tsconfig.json
# Should have: "strict": true
```

### Issue: "Git commits are huge / slow"

**Symptoms:**
- `git commit` takes > 10 seconds
- Committing dist/ or node_modules/

**Solutions:**

```bash
# 1. Verify .gitignore is correct
cat .gitignore
# Should exclude: node_modules/, dist/, .env, coverage/

# 2. Check what's staged
git status

# 3. Remove accidentally committed files
git rm --cached node_modules -r
git rm --cached dist -r

# 4. Update .gitignore and commit
echo "node_modules/" >> .gitignore
git add .gitignore
git commit -m "Remove node_modules from tracking"

# 5. Remove large files from history (if needed)
# Using git filter-branch or BFG
```

---

## Debugging Tools

### Enable Debug Logging

```bash
# Backend
LOG_LEVEL=debug npm run dev:api

# Frontend
VITE_API_BASE_URL=http://localhost:3001/api npm run dev:web
```

### Database Inspection

```bash
# Open Prisma Studio
npm run db:studio

# Then use SQL directly
psql postgresql://dms_user:dms_password@localhost:5432/dms_db

# Example queries
SELECT * FROM "User";
SELECT * FROM "Document" WHERE status = 'DRAFT';
SELECT * FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 10;
```

### API Testing

```bash
# Use REST Client extension in VS Code
# Create test.http file:

@token = <your-jwt-token>

### Login
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "admin@dms.local",
  "password": "Admin@12345"
}

### Get Current User
GET http://localhost:3001/api/auth/me
Authorization: Bearer @token

# Save and click "Send Request"
```

---

## Getting Help

### How to Report a Bug

Provide:
1. Error message (full stack trace)
2. Steps to reproduce
3. Environment (OS, Node version, Docker version)
4. Terminal output (with timestamps)

```bash
# Collect debug info
node --version
npm --version
docker --version
docker logs dms-postgres  # Last 20 lines

# Capture error
npm run dev 2>&1 | tee debug.log
```

### Resources

- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Netlify Docs](https://docs.netlify.com/)

---

## Quick Reference Commands

```bash
# Restart everything
npm run docker:down
npm install
npm run docker:up
npm run db:migrate
npm run db:seed
npm run dev

# Full reset (WARNING: deletes database)
docker compose down -v
rm -rf node_modules
npm install
npm run docker:up
npm run db:migrate
npm run db:seed

# Check health
curl http://localhost:5173
curl http://localhost:3001/api/health
docker ps

# Kill hanging processes
killall node
killall npm

# View logs
docker logs dms-postgres -f
npm run dev:api 2>&1 | grep -i error
npm run dev:web 2>&1 | grep -i error
```

Still stuck? Check the full documentation:
- [SETUP.md](SETUP.md) - Local development
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production setup
- [API.md](API.md) - API reference
- [TESTING.md](TESTING.md) - Testing guide

