# API Documentation

## Overview

The DMS API is a RESTful API built with Express.js and TypeScript. It handles authentication, document management, user management, notifications, and audit logging.

## Base URL

- **Development**: `http://localhost:3001/api`
- **Production**: Set via `API_URL` environment variable

## Authentication

All protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### Token Structure

Access tokens are valid for 24 hours. Use the refresh token endpoint to get a new access token without re-logging in.

## Endpoints

### Auth

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ADMIN",
      "area": "Operations",
      "isActive": true
    }
  }
}
```

#### Get Current User
```
GET /auth/me
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "ADMIN",
    "area": "Operations",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### Documents

#### Create Document
```
POST /documents
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "DOC-001",
  "title": "Standard Operating Procedure",
  "description": "Process documentation",
  "type": "SOP",
  "area": "Operations"
}

Response (201 Created):
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "DOC-001",
    "title": "Standard Operating Procedure",
    "status": "DRAFT",
    "currentVersionLabel": "v1.0",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### List Documents
```
GET /documents?page=1&limit=20&status=DRAFT&area=Operations&type=SOP&search=keyword
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "data": {
    "items": [...],
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

#### Get Document
```
GET /documents/:documentId
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "DOC-001",
    "status": "DRAFT",
    "versions": [...],
    "comments": [...]
  }
}
```

#### Update Document
```
PATCH /documents/:documentId
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description",
  "area": "NewArea",
  "nextReviewDate": "2024-12-31"
}

Response (200 OK):
{
  "success": true,
  "data": { /* updated document */ }
}
```

#### Upload File
```
POST /documents/:documentId/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary file data (PDF, DOCX, XLSX)>

Response (200 OK):
{
  "success": true,
  "data": { /* updated document with googleDriveFileId */ }
}
```

#### Download File
```
GET /documents/:documentId/download
Authorization: Bearer <token>

Response (200 OK):
<binary file content>
Content-Disposition: attachment; filename="DOC-001_v1.0.pdf"
```

### Document Workflow

#### Submit for Review
```
POST /documents/:documentId/submit-review
Authorization: Bearer <token>
Content-Type: application/json

{
  "reviewers": ["reviewer-id-1", "reviewer-id-2"],
  "comments": "Please review"
}

Response (200 OK):
{
  "success": true,
  "data": { /* document with status IN_REVIEW */ }
}
```

#### Approve/Request Changes
```
POST /documents/:documentId/reviews/:reviewTaskId/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "APPROVE",
  "comments": "Looks good"
}

Response (200 OK):
{
  "success": true,
  "data": { "success": true }
}
```

#### Publish Document
```
POST /documents/:documentId/publish
Authorization: Bearer <token>
Content-Type: application/json

{
  "comments": "Publishing version 1.0"
}

Response (200 OK):
{
  "success": true,
  "data": { /* document with status PUBLISHED */ }
}
```

### Notifications

#### Get Notifications
```
GET /notifications?page=1&limit=20&unreadOnly=false
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "type": "DOCUMENT_SUBMITTED",
        "title": "Document Review Request",
        "message": "...",
        "createdAt": "2024-01-01T00:00:00Z",
        "readAt": null
      }
    ],
    "total": 5,
    "totalPages": 1
  }
}
```

#### Mark as Read
```
PATCH /notifications/:notificationId/read
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "data": { /* notification with readAt set */ }
}
```

#### Mark All as Read
```
POST /notifications/mark-all-read
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "message": "All notifications marked as read"
}
```

#### Get Unread Count
```
GET /notifications/unread/count
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "data": { "count": 3 }
}
```

### Audit Logs (Admin & QA Manager only)

#### Get Audit Logs
```
GET /audit?page=1&limit=50&action=LOGIN&userId=uuid&entityType=Document
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "action": "LOGIN",
        "entityType": "User",
        "user": {
          "id": "uuid",
          "email": "user@example.com",
          "firstName": "John",
          "lastName": "Doe"
        },
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 100,
    "totalPages": 2
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Rate Limiting

Currently not implemented but recommended for production. Add to middleware:

```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 attempts
});
```

## Testing Endpoints

Test the health endpoint:
```bash
curl http://localhost:3001/health
```

Test Google Drive access:
```bash
curl http://localhost:3001/health/drive
```

## Pagination

All list endpoints support pagination:

- `page` (default: 1): Page number
- `limit` (default: 20, max: 100): Items per page

Response includes:
- `items`: Array of results
- `total`: Total number of items
- `page`: Current page
- `limit`: Items per page
- `totalPages`: Total number of pages

## Filtering

Different endpoints support different filters:

**Documents**: `status`, `area`, `type`, `search`  
**Audit Logs**: `action`, `userId`, `entityType`  
**Notifications**: `unreadOnly`

## Schema Examples

### Document Types
```
SOP (Standard Operating Procedure)
POLICY
WI (Work Instruction)
FORM
RECORD
```

### Document Statuses
```
DRAFT
IN_REVIEW
APPROVED
PUBLISHED
OBSOLETE
```

### User Roles
```
ADMIN
QUALITY_MANAGER
DOCUMENT_OWNER
REVIEWER
APPROVER
READER
```

### Review Actions
```
APPROVE
REQUEST_CHANGES
```

---

For detailed type definitions, see `packages/shared/src/index.ts`
