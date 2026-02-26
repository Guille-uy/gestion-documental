# Deployment Guide

## Prerequisites

- Git repository pushed to GitHub
- PostgreSQL database (AWS RDS, managed service, or self-hosted)
- Node.js 18+ runtime environment
- Optional: Docker for containerization

## Frontend Deployment (Netlify)

### Step 1: Prepare Repository

Ensure your code is pushed to GitHub with clean history:

```bash
git push origin main
```

### Step 2: Connect to Netlify

1. Go to [Netlify](https://app.netlify.com)
2. Click "New site from Git"
3. Select your GitHub repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `apps/web/dist`
   - **Base directory**: (leave empty for root)

### Step 3: Set Environment Variables

In Netlify UI, go to **Settings → Environment**:

```
VITE_API_URL=https://your-backend-url.com/api
```

### Step 4: Deploy

Netlify will automatically deploy when you push to `main`.

Subsequent pushes trigger automatic deployments.

### Troubleshooting

**Build fails with module not found:**
```bash
# Ensure package versions are compatible
npm install
npm run build
```

**Environment variables not loading:**
- Restart the deploy in Netlify UI
- Clear site cache: **Settings → Delete site data**

## Backend Deployment

### Option 1: AWS EC2 (Recommended)

#### 1. Launch EC2 Instance

```bash
# Using Ubuntu 22.04 LTS
# Instance type: t3.medium or larger
# Security group: open ports 3001 (API)
```

#### 2. Setup Server

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Clone repository
git clone <your-repo> dms
cd dms

# Install dependencies
npm install
npm run build

# Setup environment
cp apps/api/.env.example apps/api/.env
# Edit .env with production values
nano apps/api/.env
```

#### 3. Setup Database

```bash
# Option A: AWS RDS (managed PostgreSQL)
# Create RDS instance from AWS console
# Copy the connection string to DATABASE_URL in .env

# Option B: Install PostgreSQL locally
sudo apt install -y postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE dms_db;
CREATE USER dms_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE dms_db TO dms_user;
\q
```

#### 4. Run Migrations

```bash
npm run db:migrate:deploy
npm run db:seed  # Optional: seed demo data
```

#### 5. Start Application

```bash
# Using PM2
cd apps/api
pm2 start "npm run start" --name "dms-api"  
pm2 save
pm2 startup

# Or manually
npm run start
```

#### 6. Setup Reverse Proxy (Nginx)

```bash
# Install Nginx
sudo apt install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/dms-api

# Add:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/dms-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 7. Setup SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 2: Docker Deployment

#### 1. Build Image

Create `Dockerfile.api`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

#### 2. Build and Run

```bash
docker build -f Dockerfile.api -t dms-api:latest .
docker run -p 3001:3001 \
  --env-file .env \
  --name dms-api \
  -d dms-api:latest
```

#### 3. Docker Compose (Production)

```yaml
version: '3.8'

services:
  api:
    image: dms-api:latest
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://user:password@postgres:5432/dms_db
      NODE_ENV: production
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: dms_db
      POSTGRES_USER: dms_user
      POSTGRES_PASSWORD: secure-password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

Run: `docker-compose up -d`

### Option 3: Railway / Render

Both services have direct GitHub integration:

1. Connect your repository
2. Select `apps/api` as the root
3. Set build command: `npm run build:api`
4. Set start command: `npm run start --workspace=apps/api`
5. Set environment variables
6. Deploy

## Google Drive Setup for Production

### Service Account Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project

2. **Enable Drive API**
   - Search for "Google Drive API"
   - Click Enable

3. **Create Service Account**
   - Go to "Service Accounts"
   - Create new service account
   - Name: "DMS Application"

4. **Generate Keys**
   - In service accounts, select the one you created
   - Go to "Keys" tab
   - Create new JSON key
   - Save as `credentials-sa.json`

5. **Share Google Drive Folder**
   - In Google Drive, create `CompanyDMS` folder
   - Copy its ID from the URL: `1234567890abcdefg`
   - Right-click folder → Share
   - Paste the service account email
   - Give "Editor" access

6. **Configure Environment**
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials-sa.json
   GOOGLE_DRIVE_FOLDER_ID=<your-folder-id>
   ```

## Environment Configuration

Create `.env` files for production:

```env
# .env.production for apps/api
NODE_ENV=production
DATABASE_URL=postgresql://user:password@prod-server:5432/dms_db
JWT_SECRET=<use-strong-random-string>
JWT_REFRESH_SECRET=<use-strong-random-string>
API_URL=https://api.yourdomain.com
CORS_ORIGIN=https://yourdomain.com
GOOGLE_APPLICATION_CREDENTIALS=/secure/path/credentials-sa.json
GOOGLE_DRIVE_FOLDER_ID=<your-folder-id>
LOG_LEVEL=info
PORT=3001
```

## Monitoring & Maintenance

### Logs

```bash
# PM2 logs
pm2 logs dms-api

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Database Backups

```bash
# Manual backup
pg_dump dms_db > backup_$(date +%Y%m%d).sql

# Automated backups (cron)
0 2 * * * pg_dump dms_db > /backups/dms_$(date +\%Y\%m\%d).sql
```

### Monitoring

Recommended tools:
- **PM2 Plus**: PM2 monitoring and alerting
- **Sentry**: Error tracking
- **DataDog**: Infrastructure monitoring
- **New Relic**: APM

## Scaling Considerations

### Load Balancing

For multiple API instances:

```bash
# PM2 Cluster mode
pm2 start "npm run start" --name "dms-api" -i max
```

### Database Connection Pooling

Add to backend:
```javascript
// Using pgBouncer
DATABASE_URL=postgresql://user:password@pgbouncer:6432/dms_db
```

### Caching

Implement Redis for session/notification caching:

```bash
docker run -d -p 6379:6379 redis:alpine
```

## Security Checklist

- [ ] Change JWT secrets to strong random values
- [ ] Enable HTTPS/SSL certificate
- [ ] Configure CORS for specific domains only
- [ ] Enable database encryption
- [ ] Setup firewall rules (only allow necessary ports)
- [ ] Enable audit logging
- [ ] Regular security updates
- [ ] Implement rate limiting
- [ ] Use environment variables for secrets
- [ ] Never commit credentials to Git

## Rollback Procedure

```bash
# PM2 rollback
pm2 restart dms-api

# Docker rollback
docker stop dms-api
docker run -p 3001:3001 --env-file .env dms-api:previous-tag
```

## Health Checks

Monitor endpoints:

```bash
# API health
curl https://your-api.com/health

# Database connectivity
curl https://your-api.com/health/drive
```

## Support

For deployment issues:
1. Check logs
2. Verify environment variables
3. Test database connectivity
4. Check network/firewall rules
5. Review GitHub issues

---

**Recommended for Production:**
- PostgreSQL managed service (AWS RDS, Google Cloud SQL)
- Node.js runtime (AWS AppRunner, Google Cloud Run, Railway)
- CDN for frontend (CloudFlare, AWS CloudFront)
- Error tracking (Sentry)
- Monitoring (DataDog, New Relic)
