# Quick Reference Card

One-page cheat sheet for the Document Management System.

---

## 🚀 Start Development (2 minutes)

```bash
npm install && npm run docker:up && npm run db:migrate && npm run db:seed && npm run dev
```

**Frontend**: http://localhost:5173  
**Backend**: http://localhost:3001  
**Demo**: admin@dms.local / Admin@12345

---

## 📋 Demo Users

| Email | Password | Role |
|-------|----------|------|
| admin@dms.local | Admin@12345 | ADMIN |
| qm@dms.local | QM@12345 | QM |
| owner@dms.local | Owner@12345 | Owner |
| reviewer@dms.local | Reviewer@12345 | Reviewer |
| approver@dms.local | Approver@12345 | Approver |
| reader@dms.local | Reader@12345 | Reader |

---

## 🗂️ Project Structure

```
apps/api/          → Express backend
apps/web/          → React frontend
packages/shared/   → Shared types
prisma/            → Database schema
.github/workflows/ → CI/CD
```

---

## 📚 Documentation Guide

| Document | For |
|----------|-----|
| **README.md** | Overview & quick start |
| **SETUP.md** | Local development |
| **API.md** | API endpoints |
| **DEPLOYMENT.md** | Production |
| **TESTING.md** | Writing tests |
| **TROUBLESHOOTING.md** | Fixing issues |
| **CONTRIBUTING.md** | Contributing code |
| **FEATURES.md** | System capabilities |

---

## 💻 Essential Commands

### Development
```bash
npm run dev              # All services
npm run dev:api         # Backend only
npm run dev:web         # Frontend only
npm run docker:down     # Stop services
```

### Database
```bash
npm run db:migrate      # Run migrations
npm run db:reset        # Reset (⚠️ deletes data)
npm run db:studio       # Prisma Studio
npm run db:seed         # Load demo data
```

### Quality
```bash
npm run lint            # Linting
npm run type-check      # TypeScript
npm test                # Tests
npm run format          # Auto-format
```

### Building
```bash
npm run build           # Build all
npm run build:api       # Build backend
npm run build:web       # Build frontend
```

---

## 🔐 Core Workflow

**Document Lifecycle:**
```
DRAFT → Submit for Review → IN_REVIEW → Approve → PUBLISHED → Obsolete
```

**Key Features:**
- ✅ 6 user roles with permissions
- ✅ Document version control
- ✅ Review & approval workflow
- ✅ Google Drive file storage
- ✅ Audit logging (13 actions)
- ✅ ISO 22000 compliance

---

## 🔗 API Quick Reference

### Login
```bash
POST /api/auth/login
{ "email": "...", "password": "..." }
```

### List Documents
```bash
GET /api/documents?page=1&limit=10&status=DRAFT
```

### Create Document
```bash
POST /api/documents
{ "code": "...", "title": "...", "type": "...", "area": "..." }
```

### Upload File
```bash
POST /api/documents/:id/file
FormData: { file: <file> }
```

### Submit for Review
```bash
POST /api/documents/:id/submit-review
{ "reviewerIds": [...], "comments": "..." }
```

### Get Notifications
```bash
GET /api/notifications
```

### Get Audit Logs (Admin/QM)
```bash
GET /api/audit-logs
```

---

## 🧪 Testing Quick Start

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Specific test
npm test -- auth.test.ts
```

---

## 🐛 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Port 5173 in use | `lsof -ti:5173 \| xargs kill -9` |
| Port 3001 in use | `lsof -ti:3001 \| xargs kill -9` |
| DB connection failed | `npm run docker:up` |
| Cannot reach API | Check VITE_API_URL in `.env` |
| Module not found | `npm install` |
| Migration failed | `npm run db:reset && npm run db:migrate` |
| Tests fail | `npm run db:migrate --workspace=apps/api` |

---

## 🚀 Deployment Checklist

**Before pushing to production:**
- [ ] All tests passing: `npm test`
- [ ] TypeScript compiles: `npm run type-check`
- [ ] No linting errors: `npm run lint`
- [ ] Environment variables set
- [ ] Google Drive credentials configured
- [ ] Database backups configured
- [ ] HTTPS enabled
- [ ] JWT secrets changed
- [ ] CORS origins set correctly

**Deploy:**
```bash
# Frontend to Netlify
git push origin main  # Auto-deploys

# Backend
docker build -t dms-api .
docker run -p 3001:3001 --env-file .env dms-api
```

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│              (Vite, TypeScript, Zustand)                │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/REST
                         ↓
┌─────────────────────────────────────────────────────────┐
│                 Express Node.js Backend                  │
│         (TypeScript, Prisma, JWT Auth)                  │
└────────┬────────────────────────┬──────────────────────┘
         │                        │
         ↓ SQL                    ↓ Google Drive
┌──────────────────┐      ┌──────────────────┐
│   PostgreSQL     │      │  Google Drive    │
│   (16 Prisma)    │      │  (File Storage)  │
└──────────────────┘      └──────────────────┘
```

---

## 👥 Role Permissions Matrix

| Action | Admin | QM | Owner | Reviewer | Approver | Reader |
|--------|-------|----|----|----------|----------|--------|
| View all docs | ✅ | ✅ | - | - | - | - |
| Create docs | ✅ | ✅ | ✅ | - | - | - |
| Edit docs | ✅ | ✅ | ✅ | - | - | - |
| Upload files | ✅ | ✅ | ✅ | - | - | - |
| Submit review | ✅ | ✅ | ✅ | - | - | - |
| Review docs | ✅ | ✅ | - | ✅ | - | - |
| Approve docs | ✅ | ✅ | - | - | ✅ | - |
| Publish docs | ✅ | ✅ | - | - | ✅ | - |
| Manage users | ✅ | - | - | - | - | - |
| View audit | ✅ | ✅ | - | - | - | - |
| Download files | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🌐 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://dms_user:dms_password@localhost:5432/dms_db
JWT_SECRET=<strong-random-key>
JWT_REFRESH_SECRET=<strong-random-key>
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5173
GOOGLE_DRIVE_FOLDER_ID=<your-folder-id>
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

---

## 🔍 Sample API Requests

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dms.local","password":"Admin@12345"}'
```

### Create Document
```bash
curl -X POST http://localhost:3001/api/documents \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code":"DOC-001",
    "title":"My Document",
    "type":"SOP",
    "area":"Operations"
  }'
```

### Upload File
```bash
curl -X POST http://localhost:3001/api/documents/ID/file \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@document.pdf"
```

---

## 📞 Getting Help

### Quick Links
- **Issues**: GitHub Issues
- **Docs**: See DOCUMENTATION_INDEX.md
- **Setup**: SETUP.md
- **API**: API.md
- **Problems**: TROUBLESHOOTING.md

### Steps to Debug
1. Check TROUBLESHOOTING.md
2. Check logs: `npm run dev`
3. Check database: `npm run db:studio`
4. Check network: Browser DevTools
5. Open GitHub issue with details

---

## 🎯 Next Steps

1. **Just started?**
   - Run quick start command above
   - Login with demo user
   - Explore the dashboard

2. **Want to develop?**
   - Read SETUP.md completely
   - Read CONTRIBUTING.md
   - Create a feature branch

3. **Want to deploy?**
   - Read DEPLOYMENT.md
   - Set up Google Drive
   - Configure environment
   - Deploy to Netlify/backend

4. **Found an issue?**
   - Check TROUBLESHOOTING.md
   - Run tests: `npm test`
   - Check logs
   - Open issue with details

---

## 📖 Document Reference

```
QUICK REFERENCE (you are here)
├── README.md                    (Start here)
├── SETUP.md                     (Dev setup)
├── API.md                       (Endpoints)
├── DEPLOYMENT.md                (Production)
├── TESTING.md                   (Tests)
├── TROUBLESHOOTING.md           (Problems)
├── CONTRIBUTING.md              (Code)
├── FEATURES.md                  (Capabilities)
└── DOCUMENTATION_INDEX.md       (Navigation)
```

---

## ⚡ Pro Tips

- **VS Code?** Install PostgreSQL, Prisma, and REST Client extensions
- **Database GUI?** Run `npm run db:studio` for web UI
- **API testing?** Use REST Client extension in VS Code
- **Debugging?** Set `LOG_LEVEL=debug` in .env
- **Performance?** Use `npm run build` then `npm run preview`
- **Git?** Use `git checkout -b feature/name` for branches

---

## 📋 Useful SQL Queries

```sql
-- Check users
SELECT * FROM "User";

-- Check documents
SELECT code, title, status FROM "Document";

-- Check audit logs (last 10)
SELECT * FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 10;

-- Check notifications
SELECT * FROM "Notification" WHERE "readAt" IS NULL;
```

Access via: `npm run db:studio`

---

**Happy Coding! 🚀**

For detailed info, see [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)

