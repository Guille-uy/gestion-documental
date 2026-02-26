# Document Management System (DMS)

A production-ready, ISO 22000-compatible Document Control & Management System built with React, Express, PostgreSQL, and Google Drive integration.

## 🎯 Features

- **User Management & Role-Based Access Control (RBAC)**
  - 6 built-in roles: Admin, Quality Manager, Document Owner, Reviewer, Approver, Reader
  - User management interface for administrators
  - Secure password hashing with bcrypt

- **Document Management**
  - Full CRUD operations for documents
  - Document lifecycle: Draft → In Review → Approved → Published → Obsolete
  - File versioning and history tracking
  - Support for multiple file types (PDF, DOCX, XLSX)

- **Google Drive Integration**
  - Secure document storage in Google Drive
  - Automatic file synchronization
  - Version control and audit trails

- **Workflow & Approvals**
  - Submit documents for review
  - Multi-reviewer approval process
  - Request for changes with feedback loops
  - Document publishing with audit trails

- **Notifications & Alerts**
  - In-app notifications for document events
  - Real-time notification badges
  - Unread notification tracking

- **Audit Logging**
  - Complete audit trail of all system actions
  - Searchable and filterable audit logs
  - User activity tracking

## 📋 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast building and development
- **React Router** for client-side routing
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Axios** for API communication
- **React Hot Toast** for notifications
- **date-fns** for date utilities

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **PostgreSQL** for data persistence
- **Prisma** as ORM
- **JWT** for authentication
- **bcrypt** for password hashing
- **Google APIs** for Drive integration

### Infrastructure
- **Docker & Docker Compose** for local development
- **Git** for version control
- **Netlify** for frontend deployment (CI/CD configured)

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm 9+
- **Docker** and **Docker Compose**
- **Git**
- **Google Cloud Project** with Drive API enabled (for production use)

### Local Development Setup (One Command)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Sistema de Gestión Documental v2"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   # Copy and configure environment files
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

4. **Start PostgreSQL**
   ```bash
   npm run docker:up
   ```

5. **Setup database (migrations + seed)**
   ```bash
   # Run migrations
   npm run db:migrate
   
   # Seed demo data
   npm run db:seed
   ```

6. **Start the development server (frontend + backend together)**
   ```bash
   npm run dev
   ```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api

### Demo Credentials

Use these credentials to log in:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dms.local | Admin@12345 |
| Quality Manager | qm@dms.local | QM@12345 |
| Document Owner | owner@dms.local | Owner@12345 |
| Reviewer | reviewer@dms.local | Reviewer@12345 |
| Approver | approver@dms.local | Approver@12345 |
| Reader | reader@dms.local | Reader@12345 |

## 🔧 Google Drive Setup

### Option 1: Service Account (Recommended for Production)

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project
   - Enable the Google Drive API

2. **Create Service Account**
   - In Cloud Console, go to "Service Accounts"
   - Create a new service account
   - Generate a JSON key file
   - Save it as `apps/api/credentials-sa.json`

3. **Create Google Drive Folder**
   - In Google Drive, create a folder named "CompanyDMS"
   - Copy the folder ID from the URL
   - Share the folder with the service account email

4. **Configure Environment**
   ```bash
   # In apps/api/.env
   GOOGLE_DRIVE_FOLDER_ID=<your-folder-id>
   GOOGLE_APPLICATION_CREDENTIALS=./credentials-sa.json
   ```

5. **Test the connection**
   ```bash
   curl http://localhost:3001/health/drive
   ```

### Option 2: OAuth2 (For Single User)

1. Create OAuth2 credentials in Google Cloud Console
2. Configure the credentials in `apps/api/.env`
3. The app will handle the OAuth flow automatically

## 📁 Project Structure

```
"Sistema de Gestión Documental v2"/
├── apps/
│   ├── api/                    # Express backend
│   │   ├── src/
│   │   │   ├── controllers/    # Route handlers
│   │   │   ├── services/       # Business logic
│   │   │   ├── routes/         # API routes
│   │   │   ├── middleware/     # Auth, error handling
│   │   │   ├── utils/          # Helpers (JWT, logger, errors)
│   │   │   └── index.ts        # Server entry point
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                    # React frontend
│       ├── src/
│       │   ├── components/     # Reusable UI components
│       │   ├── pages/          # Page components
│       │   ├── store/          # Zustand state
│       │   ├── services/       # API client
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── index.html
│       ├── .env.example
│       └── vite.config.ts
│
├── packages/
│   └── shared/                 # Shared types & schemas
│       ├── src/
│       │   └── index.ts        # Exports types, enums, DTOs
│       └── package.json
│
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── seed.ts                 # Seeding script
│   └── migrations/             # Database migrations
│
├── .github/
│   └── workflows/              # CI/CD pipelines
│
├── docker-compose.yml          # PostgreSQL setup
├── package.json                # Root monorepo config
└── README.md                   # This file
```

## 🗄️ Database Schema

Key tables:
- **User**: User accounts with roles and permissions
- **Document**: Document metadata and versioning
- **DocumentVersion**: Version history for documents
- **ReviewTask**: Review assignments and status
- **Notification**: User notifications
- **AuditLog**: Complete audit trail
- **DocumentComment**: Comments and feedback

## 🔐 Security Features

- ✅ JWT-based authentication with access/refresh tokens
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ Role-based access control (RBAC) with 6 roles
- ✅ Rate limiting on login endpoint (recommended to add)
- ✅ CORS configuration by environment
- ✅ Input validation with Zod schemas
- ✅ Never expose Google credentials to frontend
- ✅ Audit logging for all sensitive actions
- ✅ SQL injection protection via Prisma ORM

## 📊 API Endpoints

### Authentication
```
POST   /api/auth/login                    # Login user
POST   /api/auth/refresh                  # Refresh access token
GET    /api/auth/me                       # Get current user
```

### Users (Admin only)
```
POST   /api/auth/users                    # Create user
GET    /api/auth/users                    # List all users
GET    /api/auth/users/:id                # Get user details
PATCH  /api/auth/users/:id                # Update user
DELETE /api/auth/users/:id                # Soft delete user
```

### Documents
```
POST   /api/documents                     # Create document
GET    /api/documents                     # List documents (with filters)
GET    /api/documents/:documentId         # Get document details
PATCH  /api/documents/:documentId         # Update document
POST   /api/documents/:documentId/upload  # Upload file
GET    /api/documents/:documentId/download # Download file
```

### Workflow
```
POST   /api/documents/:documentId/submit-review    # Submit for review
POST   /api/documents/:documentId/reviews/:reviewTaskId/approve  # Approve/Request changes
POST   /api/documents/:documentId/publish          # Publish document
```

### Notifications
```
GET    /api/notifications                 # List notifications
GET    /api/notifications/unread/count    # Get unread count
PATCH  /api/notifications/:id/read        # Mark as read
POST   /api/notifications/mark-all-read   # Mark all as read
DELETE /api/notifications/:id             # Delete notification
```

### Audit
```
GET    /api/audit                         # List audit logs (filtered)
```

## 🚀 Deployment

### Frontend Deployment (Netlify)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin <your-repo>
   git push -u origin main
   ```

2. **Connect to Netlify**
   - Go to [Netlify](https://app.netlify.com)
   - Click "New site from Git"
   - Select your repository
   - Configure build settings:
     - **Build command**: `npm run build:web`
     - **Publish directory**: `apps/web/dist`

3. **Set Environment Variables**
   - In Netlify Settings → Environment, add:
     ```
     VITE_API_URL=<your-backend-url>/api
     ```

4. **Deploy**
   - Netlify will automatically deploy on push to main

### Backend Deployment (Manual or Docker)

1. **Option A: Virtual Machine**
   - SSH into your VM
   - Clone repository
   - Install Node.js
   - Run `npm install && npm run build:api`
   - Use PM2 or systemd to keep process running
   - Configure `.env` with production database URL

2. **Option B: Docker Container**
   ```bash
   docker build -f Dockerfile.api -t dms-api .
   docker run -p 3001:3001 --env-file .env dms-api
   ```

3. **Option C: Cloud Services** (AWS, Google Cloud, Azure)
   - Use their Node.js deployment guides
   - Ensure PostgreSQL is accessible
   - Configure environment variables

## 📝 Environment Variables

### Backend (`apps/api/.env`)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dms_db

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRY=24h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRY=7d

# Server
NODE_ENV=development
PORT=3001
API_URL=http://localhost:3001

# Google Drive
GOOGLE_APPLICATION_CREDENTIALS=./credentials-sa.json
GOOGLE_DRIVE_FOLDER_ID=your-folder-id

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Logging
LOG_LEVEL=debug
```

### Frontend (`apps/web/.env`)
```env
VITE_API_URL=http://localhost:3001/api
```

## 🧪 Testing

Limited test setup. To add tests:

```bash
# Backend tests
npm run test --workspace=apps/api

# Frontend tests
npm run test --workspace=apps/web
```

## 🔄 CI/CD

GitHub Actions workflows are configured in `.github/workflows/`:
- Linting and type checking on PR
- Automated tests (placeholder)
- Netlify deployment on merge to main

## 📚 Useful Commands

```bash
# Development
npm run dev                    # Start frontend + backend
npm run dev:web              # Frontend only
npm run dev:api              # Backend only

# Building
npm run build                # Build all
npm run build:web            # Build frontend
npm run build:api            # Build backend

# Database
npm run db:migrate           # Run migrations
npm run db:seed              # Seed demo data
npm run db:studio            # Open Prisma Studio (GUI)

# Docker
npm run docker:up            # Start PostgreSQL
npm run docker:down          # Stop PostgreSQL
npm run docker:logs          # View PostgreSQL logs

# Code Quality
npm run lint                 # Lint all
npm run test                 # Test all
```

## 🗃️ Database Migrations

Migrations are automatically managed by Prisma. When you update `prisma/schema.prisma`:

```bash
npm run db:migrate
```

This will:
1. Create a new migration file
2. Apply it to your database
3. Generate Prisma Client types

## 🐛 Troubleshooting

### PostgreSQL Connection Failed
```bash
# Check if Docker container is running
docker ps

# Restart PostgreSQL
npm run docker:down
npm run docker:up

# Wait for healthcheck to pass, then run migrations
npm run db:migrate
```

### Missing Environment Variables
```bash
# Copy .env.example to .env and fill in your values
cp apps/api/.env.example apps/api/.env
```

### Port Already in Use
```bash
# Frontend (5173)
lsof -i :5173
kill -9 <PID>

# Backend (3001)
lsof -i :3001
kill -9 <PID>
```

### Google Drive Not Accessible
```bash
# Check drive access
curl http://localhost:3001/health/drive

# Verify credentials file exists
ls -la apps/api/credentials-sa.json

# Check folder ID and permissions
```

## 📖 Additional Documentation

- [Express API Structure](./apps/api/README.md) (can be created)
- [React Frontend Guide](./apps/web/README.md) (can be created)
- [Database Schema](./prisma/README.md) (can be created)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run linting: `npm run lint`
4. Commit with clear messages
5. Push to GitHub
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🎓 Learn More

- [Express Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [Google Drive API](https://developers.google.com/drive/api)

## 👥 Support

For issues, questions, or suggestions:
1. Check existing GitHub issues
2. Create a new issue with detailed information
3. Follow the issue template

---

**Last Updated**: February 2026  
**Version**: 1.0.0
