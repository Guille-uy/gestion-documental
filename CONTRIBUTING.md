# Contributing Guide

Welcome to the Document Management System! This guide helps you contribute effectively.

## Getting Started

### 1. Fork and Clone

```bash
# Fork on GitHub, then:
git clone https://github.com/YOUR_USERNAME/dms.git
cd dms

# Add upstream remote for syncing
git remote add upstream https://github.com/ORIGINAL_OWNER/dms.git
```

### 2. Create a Feature Branch

```bash
# Sync with main
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
# or for bug fixes:
git checkout -b fix/issue-description
```

### 3. Local Setup

```bash
npm install
npm run docker:up
npm run db:migrate
npm run db:seed
npm run dev
```

---

## Development Workflow

### Code Style

**TypeScript**
- Use `strict` mode (no `any` types)
- Prefer interfaces over types
- Use meaningful variable names

```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  role: UserRole;
}

async function getUserById(userId: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id: userId } });
}

// ❌ Avoid
const user: any = await db.query('SELECT * FROM users');
function getUser(u: any) { return u; }
```

**React Components**
- Use functional components with hooks
- Use TypeScript for props
- Keep components small and focused

```typescript
// ✅ Good
interface ButtonProps {
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  children: React.ReactNode;
}

export function Button({ onClick, variant = 'primary', disabled, children }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={styles[variant]}
    >
      {children}
    </button>
  );
}

// ❌ Avoid
export const Button = ({ props }: any) => {
  return <button {...props}>{props.children}</button>;
};
```

**Tailwind CSS**
- Use utility classes instead of custom CSS
- Group related classes
- Use responsive prefixes (sm:, md:, lg:)

```tsx
// ✅ Good
<div className="flex flex-col gap-4 sm:flex-row md:gap-6">
  <input className="px-4 py-2 border rounded-lg" />
  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" />
</div>

// ❌ Avoid
<div style={{ display: 'flex', flexDirection: 'column' }}>
  <input style={{ padding: '8px 16px' }} />
  <button style={{ backgroundColor: 'blue' }} />
</div>
```

### Naming Conventions

**Files & Folders**
```
components/              # React components
pages/                   # Page components
services/                # API clients, utilities
store/                   # State management
__tests__/               # Test files
```

**Functions**
```typescript
// Services (business logic)
function getUserById(id: string) { }
function createDocument(data: DocumentDTO) { }
function submitForReview(docId: string, reviewerIds: string[]) { }

// API endpoints (plural nouns)
GET    /api/documents
POST   /api/documents
GET    /api/documents/:id
PATCH  /api/documents/:id
DELETE /api/documents/:id

// Event handlers (on + action)
function onButtonClick() { }
function onFormSubmit(data: FormData) { }
function onDocumentUpload(file: File) { }
```

**Variables**
```typescript
// Booleans (is/has/should prefix)
const isLoading = false;
const hasError = true;
const shouldRefresh = true;

// Arrays (plural)
const users: User[] = [];
const documents: Document[] = [];

// Sets/Maps (with descriptive names)
const userMap = new Map<string, User>();
const rolePermissions = new Set(['read', 'write']);
```

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body

footer
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation
- **style**: Code style (no logic change)
- **refactor**: Code restructure
- **perf**: Performance improvement
- **test**: Add/update tests
- **chore**: Dependencies, config

### Examples

```bash
# Feature
git commit -m "feat(documents): add document versioning support"

# Bug fix
git commit -m "fix(auth): refresh token not persisting after login"

# Documentation
git commit -m "docs(setup): add troubleshooting section

- Add PostgreSQL connection issues
- Add Docker setup section"

# Performance
git commit -m "perf(api): optimize document list query with pagination"
```

---

## Testing Requirements

All code changes must include tests:

```bash
# Run tests
npm test

# Check coverage
npm run test:coverage

# Watch mode while developing
npm run test:watch
```

### Test Coverage Minimums

- New functions: 100% (all paths)
- Bug fixes: Include test reproducing the bug
- Components: At least happy path + error state

### Example Test

```typescript
// File: apps/api/src/services/__tests__/document.test.ts
import { describe, it, expect } from 'vitest';
import * as documentService from '../document';

describe('Document Service', () => {
  describe('createDocument', () => {
    it('should create a new document with valid data', async () => {
      const result = await documentService.createDocument(
        {
          code: 'DOC-001',
          title: 'SOP',
          type: 'SOP',
          area: 'Operations'
        },
        'userId-123'
      );

      expect(result.code).toBe('DOC-001');
      expect(result.status).toBe('DRAFT');
    });

    it('should throw for duplicate code', async () => {
      await expect(
        documentService.createDocument(
          { code: 'DUPLICATE', title: 'Test' },
          'userId-123'
        )
      ).rejects.toThrow('code already exists');
    });
  });
});
```

---

## Pull Request Process

### Before Submitting

1. **Sync with upstream**
   ```bash
   git fetch upstream
   git rebase upstream/main
   git push origin feature/your-feature --force-with-lease
   ```

2. **Run checks**
   ```bash
   npm run lint        # Fix linting errors
   npm run type-check  # Check TypeScript
   npm test            # Run tests
   npm run build:web   # Verify build
   ```

3. **Format code**
   ```bash
   npm run format
   ```

### PR Description Template

```markdown
## Description
Brief explanation of changes

## Type
- [ ] Feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Performance improvement
- [ ] Refactor

## Testing
- Describe how to test changes
- Include any test cases added

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] TypeScript strict mode passes
- [ ] No linting errors
- [ ] Merged with latest main

## Screenshots (if UI changes)
Attach screenshots of the changes

## Related Issue
Closes #123
```

### Review Process

1. **Automated checks** must pass (CI/CD)
2. **Code review** by maintainers
3. **Update based on feedback**
4. **Merge** after approval

---

## Adding Features

### Adding a New Endpoint

**1. Update shared types** (`packages/shared/src/index.ts`):

```typescript
// Add request/response schemas
export const CreateDocumentSchema = z.object({
  code: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(['SOP', 'POLICY', 'FORM', 'PROCEDURE', 'OTHER']),
  area: z.string()
});

export type CreateDocumentDTO = z.infer<typeof CreateDocumentSchema>;
```

**2. Add database model** (`prisma/schema.prisma`):

```prisma
model Document {
  id String @id @default(cuid())
  code String @unique
  title String
  type DocumentType
  area String
  status DocumentStatus @default(DRAFT)
  
  // Relations
  createdBy String
  creator User @relation(fields: [createdBy], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**3. Run migration**:

```bash
npm run db:migrate:dev
# Enter migration name: "add_document_model"
```

**4. Create service** (`apps/api/src/services/document.ts`):

```typescript
export async function createDocument(
  data: CreateDocumentDTO,
  userId: string
): Promise<Document> {
  // Validation
  const validated = CreateDocumentSchema.parse(data);
  
  // Business logic
  const doc = await prisma.document.create({
    data: {
      ...validated,
      status: 'DRAFT',
      createdBy: userId
    }
  });
  
  // Audit logging
  await logAuditAction(userId, 'CREATE', 'DOCUMENT', doc.id);
  
  return doc;
}
```

**5. Add controller** (`apps/api/src/controllers/document.ts`):

```typescript
export const createDocument = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  
  const document = await documentService.createDocument(req.body, userId);
  
  res.status(201).json({
    success: true,
    data: document
  });
});
```

**6. Add route** (`apps/api/src/routes/documents.ts`):

```typescript
router.post('/', authMiddleware, createDocument);
```

**7. Add frontend service** (`apps/web/src/services/api.ts`):

```typescript
export async function createDocument(data: CreateDocumentDTO) {
  return api.post('/documents', data);
}
```

**8. Add frontend page/form** (`apps/web/src/pages/CreateDocumentPage.tsx`):

```typescript
async function handleSubmit(formData: CreateDocumentDTO) {
  try {
    const response = await api.createDocument(formData);
    toast.success('Document created!');
    navigate(`/documents/${response.data.id}`);
  } catch (error) {
    toast.error('Failed to create document');
  }
}
```

**9. Add tests**:

```bash
npm test -- document.test.ts
```

---

## Adding React Components

### Component Structure

```typescript
// components/MyComponent.tsx
import { ReactNode } from 'react';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
  children?: ReactNode;
}

/**
 * MyComponent description
 * 
 * @example
 * <MyComponent title="Hello" onAction={() => console.log('clicked')} />
 */
export function MyComponent({ title, onAction, children }: MyComponentProps) {
  return (
    <div className="rounded-lg border p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
      {onAction && (
        <button
          onClick={onAction}
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white"
        >
          Action
        </button>
      )}
    </div>
  );
}
```

### Accessibility

Ensure components are accessible:

```typescript
// ✅ Good
<button
  aria-label="Delete document"
  onClick={onDelete}
>
  <TrashIcon />
</button>

<div role="status" aria-live="polite" aria-busy={isLoading}>
  {isLoading ? 'Loading...' : 'Loaded'}
</div>

// ❌ Avoid
<div className="cursor-pointer" onClick={onDelete}>
  Delete
</div>
```

---

## Database Migrations

When changing the schema:

```bash
# Make changes to prisma/schema.prisma
# Then create a migration:
npm run db:migrate:dev
# Enter: "describe_your_change"

# This creates:
# prisma/migrations/[timestamp]_describe_your_change/migration.sql

# On production, run:
npm run db:migrate:deploy
```

### Migration Best Practices

```typescript
// ✅ Safe migrations
// - Add new columns with defaults
// - Add constraints that are nullable first
// - Create indexes on frequently queried columns

// ❌ Risky migrations
// - Removing columns without backup
// - Adding NOT NULL without default
// - Large ALTER TABLE on production
```

---

## Performance Considerations

### Query Optimization

```typescript
// ✅ Efficient - use include/select
const docs = await prisma.document.findMany({
  include: { createdBy: true, versions: { take: 1 } },
  where: { status: 'PUBLISHED' }
});

// ❌ Inefficient - N+1 queries
const docs = await prisma.document.findMany();
for (const doc of docs) {
  const user = await prisma.user.findUnique({
    where: { id: doc.createdBy }
  });
}
```

### Frontend Optimization

```typescript
// ✅ Good - memoize expensive computations
const memoizedValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

// ✅ Good - debounce search
const debouncedSearch = useCallback(
  debounce((query: string) => {
    searchDocuments(query);
  }, 300),
  []
);

// ❌ Avoid - recalculating on every render
const value = expensiveCalculation(data);
```

---

## Documentation

Update docs when adding features:

1. **Code comments** for complex logic
2. **JSDocs** for functions
3. **README section** for new features
4. **API documentation** for endpoints

```typescript
/**
 * Submits a document for review
 * 
 * @param documentId - ID of document to review
 * @param reviewerIds - Array of user IDs to assign as reviewers
 * @param comments - Optional comments for reviewers
 * @param userId - ID of user submitting
 * @returns Updated document with IN_REVIEW status
 * @throws {NotFoundError} If document not found
 * @throws {ConflictError} If document is not in DRAFT status
 * 
 * @example
 * const doc = await submitForReview(
 *   'doc-123',
 *   ['reviewer-1', 'reviewer-2'],
 *   'Please review and approve',
 *   'user-456'
 * );
 */
export async function submitForReview(
  documentId: string,
  reviewerIds: string[],
  comments?: string,
  userId?: string
): Promise<Document> {
  // implementation
}
```

---

## Security Guidelines

### Input Validation

```typescript
// ✅ Validate with Zod
const data = CreateDocumentSchema.parse(req.body);

// ✅ Use parameterized queries (Prisma does this)
const user = await prisma.user.findUnique({
  where: { email: userInput.email }
});

// ❌ Avoid string concatenation
const user = await db.query(`SELECT * FROM users WHERE email = '${email}'`);
```

### Authentication

```typescript
// ✅ Protect routes with auth middleware
router.post('/documents', authMiddleware, createDocument);

// ✅ Check authorization
if (document.createdBy !== req.user.id) {
  throw new AuthorizationError('Not document owner');
}

// ❌ Don't trust client-side permissions
// Always verify on backend!
```

### Data Privacy

```typescript
// ✅ Never log sensitive data
logger.info('User login', { userId: user.id });

// ❌ Avoid logging credentials
logger.info('Login', { email, password }); // NEVER!
```

---

## Useful Commands

```bash
# Development
npm run dev              # Start all services
npm run dev:api         # Backend only
npm run dev:web         # Frontend only

# Testing
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report

# Quality
npm run lint            # Check linting
npm run type-check      # TypeScript errors
npm run format          # Format code

# Database
npm run db:migrate      # Run migrations
npm run db:reset        # Reset database
npm run db:studio       # Open Prisma Studio
npm run db:seed         # Seed demo data

# Building
npm run build           # Build all
npm run build:api       # Build backend
npm run build:web       # Build frontend

# Cleanup
npm run clean           # Remove build artifacts
```

---

## Getting Help

- **Questions?** Open a discussion on GitHub
- **Bug?** Create an issue with reproduction steps
- **Feature idea?** Start a discussion first

### Issue Template

```markdown
**Description**
Clear description of the issue

**Steps to Reproduce**
1. Do this
2. Then that
3. Observe problem

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [Windows/macOS/Linux]
- Node.js: v18.x.x
- npm: 9.x.x
```

---

## Code of Conduct

- Be respectful to all contributors
- No spam, harassment, or discrimination
- Provide constructive feedback
- Help others learn

---

Thank you for contributing! 🎉

