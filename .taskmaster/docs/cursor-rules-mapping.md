# Cursor Rules to Tasks Mapping

This document maps the Payload CMS cursor rules to relevant tasks in the project.

## Rule Overview

### Critical Security Rules (HIGH PRIORITY)
- **security-critical.mdc** - Three most critical security patterns
- **access-control.md** - Basic access control patterns
- **access-control-advanced.md** - Advanced access patterns

### Development Patterns
- **collections.md** - Collection configuration patterns
- **fields.md** - Field types and validation
- **hooks.md** - Lifecycle hooks and context
- **endpoints.md** - Custom API endpoints
- **queries.md** - Local API, REST, GraphQL queries
- **components.md** - Custom admin components
- **adapters.md** - Database adapters and transactions
- **field-type-guards.md** - TypeScript type guards
- **plugin-development.md** - Plugin architecture

## Task-to-Rules Mapping

### Task 1: Set up Payload CMS with collections and RBAC

**Relevant Rules:**
- ✅ **security-critical.mdc** - CRITICAL: Apply all 3 security patterns
  - Local API access control (`overrideAccess: false` when passing user)
  - Transaction safety (always pass `req` to nested operations)
  - Prevent infinite hook loops (use `context` flags)
- ✅ **access-control.md** - RBAC patterns, collection/field access
- ✅ **access-control-advanced.md** - Role-based factory functions, performance
- ✅ **collections.md** - Collection setup patterns, auth collections
- ✅ **fields.md** - Field types, validation, conditional fields
- ✅ **hooks.md** - Collection hooks for data processing
- ✅ **adapters.md** - MongoDB adapter, transaction patterns
- ✅ **queries.md** - Local API queries with proper access control

**Key Patterns to Apply:**
1. Users collection: Add `roles` field with `saveToJWT: true`
2. All collections: Implement proper access control (editors vs admins)
3. Submission collection: Use hooks for problem_index calculation
4. All Local API calls: Set `overrideAccess: false` when operating on behalf of users
5. All hooks: Pass `req` to nested operations for transaction safety

### Task 1.1: Verify Payload CMS setup

**Relevant Rules:**
- ✅ **adapters.md** - MongoDB connection verification
- ✅ **payload-overview.md** - Basic config patterns

### Task 1.2: Add roles to Users collection

**Relevant Rules:**
- ✅ **access-control.md** - RBAC pattern with `saveToJWT: true`
- ✅ **collections.md** - Auth collection with RBAC example
- ✅ **fields.md** - Select field with `hasMany: false`

**Key Pattern:**
```typescript
{
  name: 'roles',
  type: 'select',
  options: ['user', 'editor', 'admin'],
  defaultValue: 'user',
  saveToJWT: true, // CRITICAL for fast access checks
  access: {
    update: ({ req: { user } }) => user?.roles?.includes('admin'),
  },
}
```

### Task 1.3: Create Question and Questionnaire collections

**Relevant Rules:**
- ✅ **collections.md** - Basic collection patterns
- ✅ **fields.md** - Array fields, relationships, conditional fields
- ✅ **access-control.md** - Field-level access (adminScoring admin-only)
- ✅ **access-control-advanced.md** - Editor vs admin access patterns

**Key Patterns:**
- Use field-level access for `adminScoring` (admin-only)
- Use conditional fields for editorFields vs adminScoring
- Relationship field with validation (exactly 10 questions)

### Task 1.4: Submission and KnowledgeBaseItem collections

**Relevant Rules:**
- ✅ **hooks.md** - Use hooks for problem_index calculation
- ✅ **security-critical.mdc** - Transaction safety in hooks
- ✅ **fields.md** - JSON fields, point fields (location)
- ✅ **access-control.md** - Privacy-focused access control

**Key Patterns:**
- Use `beforeChange` hook to calculate problem_index
- Pass `req` to all nested operations in hooks
- Use `context` to prevent infinite loops if updating submission in hooks

### Task 1.5: Set up Globals

**Relevant Rules:**
- ✅ **collections.md** - Global configuration patterns
- ✅ **access-control.md** - Global access control
- ✅ **fields.md** - RichText fields for legal content

### Task 2: Next.js frontend

**Relevant Rules:**
- ⚠️ **components.md** - Only if creating admin components (not frontend)

### Task 3: Location capture with geocoding

**Relevant Rules:**
- ✅ **endpoints.md** - Create `/api/geocode` and `/api/reverse-geocode` endpoints
- ✅ **security-critical.mdc** - Local API access control in endpoints
- ✅ **queries.md** - Query patterns for geocoding lookups

**Key Patterns:**
- Endpoints are NOT authenticated by default - check `req.user` if needed
- Use `req.payload` for database operations
- Handle errors with `APIError`

### Task 4: Questionnaire engine

**Relevant Rules:**
- ✅ **queries.md** - Fetch questionnaire with proper access control
- ✅ **fields.md** - Field type patterns (for question rendering)
- ⚠️ **components.md** - Only if creating admin components

**Key Patterns:**
- Use `overrideAccess: false` when fetching questionnaire on behalf of user
- Use query constraints for filtering published questionnaires

### Task 5: Submission API and scoring

**Relevant Rules:**
- ✅ **security-critical.mdc** - CRITICAL: All 3 patterns
  - Local API access control in endpoint
  - Transaction safety when creating submission
  - Prevent hook loops if updating submission
- ✅ **endpoints.md** - POST endpoint pattern, error handling
- ✅ **hooks.md** - Use hooks for problem_index calculation
- ✅ **queries.md** - Local API queries with access control
- ✅ **access-control.md** - Submission access control

**Key Patterns:**
```typescript
// In endpoint handler
const submission = await req.payload.create({
  collection: 'submissions',
  data: submissionData,
  req, // Maintains transaction
  overrideAccess: false, // If operating on behalf of user
})
```

### Task 6: Heatmap API

**Relevant Rules:**
- ✅ **endpoints.md** - GET endpoint with caching
- ✅ **queries.md** - Aggregation queries, performance optimization
- ✅ **access-control.md** - Public read access

**Key Patterns:**
- Use query constraints for efficient aggregation
- Implement caching (server-side or Redis)
- Use `select` to limit returned fields for performance

### Task 7: AI recommendation system

**Relevant Rules:**
- ✅ **security-critical.mdc** - Transaction safety when updating submission
- ✅ **endpoints.md** - POST endpoint, error handling, retries
- ✅ **hooks.md** - Use hooks for KB sync (if needed)
- ✅ **queries.md** - Local API queries

**Key Patterns:**
- Update submission with AI results - pass `req` for transaction safety
- Use `context` flag to prevent hook loops if submission hooks trigger updates
- Handle errors gracefully with retry logic

### Task 8: Legal pages and cookie consent

**Relevant Rules:**
- ✅ **collections.md** - Global patterns
- ✅ **access-control.md** - Global access control (editors can update)
- ✅ **fields.md** - RichText fields

### Task 9: Admin tools and export

**Relevant Rules:**
- ✅ **security-critical.mdc** - CRITICAL: Local API access control
- ✅ **endpoints.md** - Admin-only endpoints, authentication checks
- ✅ **access-control.md** - Admin-only access patterns
- ✅ **queries.md** - Query patterns for exports
- ✅ **components.md** - Admin dashboard components

**Key Patterns:**
```typescript
// Always check admin authorization
if (!req.user || !req.user.roles?.includes('admin')) {
  throw new APIError('Unauthorized', 401)
}

// Use overrideAccess: false for user-scoped queries
const submissions = await req.payload.find({
  collection: 'submissions',
  where: query,
  overrideAccess: false, // Respect access control
  req,
})
```

### Task 10: QR code and deployment

**Relevant Rules:**
- ✅ **endpoints.md** - QR generation endpoint
- ⚠️ **adapters.md** - MongoDB indexes configuration

## Critical Security Checklist

For ALL tasks involving Local API or hooks:

- [ ] When passing `user` to Local API, set `overrideAccess: false`
- [ ] Always pass `req` to nested operations in hooks
- [ ] Use `context` flags to prevent infinite hook loops
- [ ] Verify access control is properly configured for each collection
- [ ] Test with different user roles (user, editor, admin)

## Performance Considerations

- Use query constraints over async operations in access control
- Cache expensive operations in `req.context`
- Index frequently queried fields (postal_code, timestamp)
- Use `select` to limit returned fields
- Set `maxDepth` on relationships to prevent over-fetching

