# Testing Guide

## Overview

This guide covers testing strategy, setup, and examples for the Document Management System.

## Testing Stack

- **Unit Tests**: Vitest
- **Integration Tests**: Supertest (API) + Vitest
- **Component Tests**: React Testing Library
- **E2E Tests**: Playwright (optional)
- **API Testing**: Postman / cURL

---

## Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific workspace
npm test --workspace=apps/api
npm test --workspace=apps/web
```

---

## Backend API Testing

### Unit Tests: Services

**File: `apps/api/src/services/__tests__/auth.test.ts`**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as authService from '../auth';
import prismaMock from '../../__mocks__/prisma';

describe('Auth Service', () => {
  
  describe('loginUser', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        id: '123',
        email: 'admin@dms.local',
        password: '$2b$10$hashedpassword',
        role: 'ADMIN',
        isActive: true
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.loginUser(
        'admin@dms.local',
        'Admin@12345'
      );

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('admin@dms.local');
    });

    it('should throw error for invalid email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.loginUser('invalid@dms.local', 'password')
      ).rejects.toThrow('User not found');
    });

    it('should throw error for invalid password', async () => {
      const mockUser = {
        id: '123',
        email: 'admin@dms.local',
        password: '$2b$10$invalidedhash',
        role: 'ADMIN',
        isActive: true
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        authService.loginUser('admin@dms.local', 'WrongPassword')
      ).rejects.toThrow('Invalid password');
    });
  });

  describe('createUser', () => {
    it('should create user with valid data', async () => {
      const userData = {
        email: 'newuser@dms.local',
        password: 'SecurePass123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'REVIEWER',
        area: 'Quality Assurance'
      };

      prismaMock.user.create.mockResolvedValue({
        id: '456',
        ...userData,
        password: '$2b$10$hashedpassword',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await authService.createUser(userData);

      expect(result.email).toBe(userData.email);
      expect(result.role).toBe('REVIEWER');
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: userData.email,
          firstName: userData.firstName
        })
      });
    });

    it('should throw error for duplicate email', async () => {
      prismaMock.user.create.mockRejectedValue(
        new Error('Unique constraint failed on the fields: (`email`)')
      );

      await expect(
        authService.createUser({
          email: 'admin@dms.local',
          password: 'password',
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN'
        })
      ).rejects.toThrow('Email already exists');
    });
  });
});
```

### Integration Tests: API Endpoints

**File: `apps/api/src/routes/__tests__/auth.test.ts`**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Auth API Endpoints', () => {
  const testUser = {
    email: 'test@dms.local',
    password: 'TestPass123',
    firstName: 'Test',
    lastName: 'User',
    role: 'REVIEWER'
  };

  beforeAll(async () => {
    // Create test user
    await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({
      where: { email: testUser.email }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('data.accessToken');
      expect(response.body).toHaveProperty('data.refreshToken');
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    it('should return 401 for invalid credentials', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword'
        })
        .expect(401);
    });

    it('should return 400 for missing email', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          password: 'TestPass123'
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      // First login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      const refreshToken = loginResponse.body.data.refreshToken;

      // Then refresh
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should return 401 for invalid refresh token', async () => {
      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid_token' })
        .expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      // Login first
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      const accessToken = loginResponse.body.data.accessToken;

      // Get current user
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.role).toBe('REVIEWER');
    });

    it('should return 401 without authorization header', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });
  });
});
```

### Document Service Tests

**File: `apps/api/src/services/__tests__/document.test.ts`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import * as documentService from '../document';
import prismaMock from '../../__mocks__/prisma';

describe('Document Service', () => {
  
  describe('createDocument', () => {
    it('should create document with valid data', async () => {
      const userId = 'user-123';
      const docData = {
        code: 'DOC-001',
        title: 'Standard Operating Procedure',
        description: 'SOP for Document Management',
        type: 'SOP',
        area: 'Operations'
      };

      prismaMock.document.create.mockResolvedValue({
        id: 'doc-456',
        ...docData,
        status: 'DRAFT',
        version: '1.0',
        createdBy: userId,
        updatedBy: userId,
        publishedAt: null,
        nextReviewDate: null,
        googleDriveFileId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await documentService.createDocument(docData, userId);

      expect(result.code).toBe('DOC-001');
      expect(result.status).toBe('DRAFT');
      expect(result.version).toBe('1.0');
    });

    it('should throw error for duplicate code', async () => {
      prismaMock.document.create.mockRejectedValue(
        new Error('Unique constraint failed on the fields: (`code`)')
      );

      await expect(
        documentService.createDocument({
          code: 'DOC-001',
          title: 'Test',
          type: 'SOP',
          area: 'Operations'
        }, 'user-123')
      ).rejects.toThrow('Document code already exists');
    });
  });

  describe('submitForReview', () => {
    it('should create review tasks for each reviewer', async () => {
      const documentId = 'doc-456';
      const reviewerIds = ['reviewer-1', 'reviewer-2'];
      const userId = 'user-123';

      prismaMock.document.update.mockResolvedValue({
        id: documentId,
        status: 'IN_REVIEW'
      });

      prismaMock.reviewTask.createMany.mockResolvedValue({
        count: 2
      });

      await documentService.submitForReview(
        documentId,
        reviewerIds,
        'Please review',
        userId
      );

      expect(prismaMock.reviewTask.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            documentId,
            assignedTo: 'reviewer-1',
            status: 'PENDING'
          })
        ])
      });
    });

    it('should notify reviewers', async () => {
      const documentId = 'doc-456';
      const reviewerIds = ['reviewer-1'];

      // Mock document update and notification creation
      await documentService.submitForReview(
        documentId,
        reviewerIds,
        'Please review',
        'user-123'
      );

      // Verify notifications were created
      expect(prismaMock.notification.createMany).toHaveBeenCalled();
    });
  });
});
```

---

## Frontend Component Testing

### Component Tests: React Components

**File: `apps/web/src/components/__tests__/Button.test.tsx`**

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button Component', () => {
  
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('should call onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    
    render(<Button onClick={handleClick}>Click</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalled();
  });

  it('should apply variant styles', () => {
    render(<Button variant="primary">Primary</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600');
  });

  it('should show loading spinner when loading', () => {
    render(<Button loading>Loading</Button>);
    
    expect(screen.getByRole('button')).toHaveClass('opacity-50');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Login Page Tests

**File: `apps/web/src/pages/__tests__/LoginPage.test.tsx`**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';
import * as apiService from '../../services/api';

vi.mock('../../services/api');

describe('LoginPage', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should successfully login with valid credentials', async () => {
    const mockResponse = {
      data: {
        accessToken: 'token',
        user: { id: '1', email: 'admin@dms.local' }
      }
    };

    vi.mocked(apiService.login).mockResolvedValue(mockResponse);
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    await user.type(screen.getByLabelText(/email/i), 'admin@dms.local');
    await user.type(screen.getByLabelText(/password/i), 'Admin@12345');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(apiService.login).toHaveBeenCalledWith(
        'admin@dms.local',
        'Admin@12345'
      );
    });
  });

  it('should show error message on failed login', async () => {
    vi.mocked(apiService.login).mockRejectedValue(
      new Error('Invalid credentials')
    );
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    await user.type(screen.getByLabelText(/email/i), 'admin@dms.local');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid|error/i)).toBeInTheDocument();
    });
  });

  it('should display demo credentials', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/admin@dms.local/)).toBeInTheDocument();
    expect(screen.getByText(/Admin@12345/)).toBeInTheDocument();
  });
});
```

---

## API Testing with cURL

### Test Authentication

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dms.local",
    "password": "Admin@12345"
  }'

# Get current user (with token)
TOKEN="<token-from-login>"
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Refresh token
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<refresh-token>"
  }'
```

### Test Document Creation

```bash
# Create document
curl -X POST http://localhost:3001/api/documents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "TEST-001",
    "title": "Test Document",
    "type": "SOP",
    "area": "Operations"
  }'

# List documents
curl -X GET "http://localhost:3001/api/documents?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# Get document details
curl -X GET http://localhost:3001/api/documents/<document-id> \
  -H "Authorization: Bearer $TOKEN"
```

### Test File Upload

```bash
# Upload document file
curl -X POST http://localhost:3001/api/documents/<document-id>/file \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/document.pdf"

# Download document
curl -X GET http://localhost:3001/api/documents/<document-id>/download \
  -H "Authorization: Bearer $TOKEN" \
  -o downloaded-file.pdf
```

### Test Notifications

```bash
# Get notifications
curl -X GET "http://localhost:3001/api/notifications" \
  -H "Authorization: Bearer $TOKEN"

# Mark as read
curl -X PATCH http://localhost:3001/api/notifications/<notification-id>/read \
  -H "Authorization: Bearer $TOKEN"

# Get unread count
curl -X GET "http://localhost:3001/api/notifications/unread/count" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Test Coverage

### Backend Coverage Targets

```bash
# Generate coverage report
npm run test:coverage --workspace=apps/api

# Expected coverage:
# ✓ Statements: > 80%
# ✓ Branches: > 75%
# ✓ Functions: > 80%
# ✓ Lines: > 80%
```

### Frontend Coverage Targets

```bash
# Generate coverage report
npm run test:coverage --workspace=apps/web

# Expected coverage:
# ✓ Statements: > 75%
# ✓ Branches: > 70%
# ✓ Functions: > 75%
# ✓ Lines: > 75%
```

---

## Continuous Integration

### GitHub Actions Test Run

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - run: npm install
      
      - run: npm run lint
      
      - run: npm run type-check
      
      - run: npm test -- --coverage
      
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

## Mocking Strategies

### Mock Prisma Database

**File: `apps/api/src/__mocks__/prisma.ts`**

```typescript
import { vi } from 'vitest';

const prismaMock = {
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn()
  },
  document: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  notification: {
    create: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn()
  },
  reviewTask: {
    create: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn()
  },
  auditLog: {
    create: vi.fn(),
    findMany: vi.fn()
  },
  $disconnect: vi.fn()
};

export default prismaMock;
```

### Mock API Service

**File: `apps/web/src/__mocks__/api.ts`**

```typescript
import { vi } from 'vitest';

export const mockApiService = {
  login: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
  createUser: vi.fn(),
  getUser: vi.fn(),
  getAllUsers: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  createDocument: vi.fn(),
  getDocument: vi.fn(),
  listDocuments: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
  uploadFile: vi.fn(),
  downloadFile: vi.fn(),
  submitForReview: vi.fn(),
  approveReview: vi.fn(),
  publishDocument: vi.fn(),
  getNotifications: vi.fn(),
  markNotificationAsRead: vi.fn(),
  getAuditLogs: vi.fn()
};
```

---

## Performance Testing

### Load Testing with Artillery

**File: `load-test.yml`**

```yaml
config:
  target: "http://localhost:3001/api"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up"
    - duration: 60
      arrivalRate: 100
      name: "Sustained load"

scenarios:
  - name: "Login Flow"
    flow:
      - post:
          url: "/auth/login"
          json:
            email: "admin@dms.local"
            password: "Admin@12345"
          capture:
            - json: "$.data.accessToken"
              as: "token"
      - get:
          url: "/documents"
          headers:
            Authorization: "Bearer {{ token }}"
```

Run:
```bash
npm install -g artillery
artillery run load-test.yml
```

---

## Best Practices

### ✅ DO

- Write tests as you code
- Test edge cases and error conditions
- Use descriptive test names
- Keep tests focused (one assertion per test when possible)
- Mock external dependencies (Google Drive, database)
- Test user workflows end-to-end
- Use realistic test data
- Test authentication and authorization

### ❌ DON'T

- Skip testing critical paths
- Write flaky tests that sometimes pass/fail
- Mock too much (test integration when possible)
- Use real database in unit tests
- Test implementation details instead of behavior
- Write tests without understanding the feature
- Skip async/await testing
- Hardcode test data

---

## Test Checklist

- [ ] All services have unit tests
- [ ] All API endpoints have integration tests
- [ ] All forms have component tests
- [ ] Protected routes require authentication
- [ ] Error handling is tested
- [ ] Validation works correctly
- [ ] Database migrations work
- [ ] File uploads work
- [ ] Notifications are triggered
- [ ] Audit logging works
- [ ] Google Drive integration works
- [ ] RBAC enforcement tested
- [ ] Token refresh works
- [ ] Logout clears auth state
- [ ] Pagination works

---

## Debugging Tests

```bash
# Run single test file
npm test -- auth.test.ts

# Run tests matching pattern
npm test -- --grep "loginUser"

# Debug mode
node --inspect-brk ./node_modules/vitest/vitest.mjs --run

# Verbose output
npm test -- --reporter=verbose

# Write snapshot for comparison
npm test -- --update-snapshot
```

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Supertest](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
