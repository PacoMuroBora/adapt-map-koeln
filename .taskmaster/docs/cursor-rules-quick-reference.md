# Cursor Rules Quick Reference by Task

## 🔴 CRITICAL Security Rules (Apply to ALL relevant tasks)

**security-critical.mdc** - MUST follow these 3 patterns:
1. **Local API Access Control**: `overrideAccess: false` when passing `user`
2. **Transaction Safety**: Always pass `req` to nested operations in hooks
3. **Prevent Hook Loops**: Use `context` flags to prevent infinite loops

## Task-Specific Rule Mapping

| Task | Critical Rules | Development Rules |
|------|---------------|-------------------|
| **Task 1** (Collections & RBAC) | security-critical, access-control, access-control-advanced | collections, fields, hooks, adapters, queries |
| **Task 1.2** (Users RBAC) | access-control | collections, fields |
| **Task 1.3** (Question/Questionnaire) | access-control, access-control-advanced | collections, fields |
| **Task 1.4** (Submission/KB) | security-critical (hooks) | hooks, fields, access-control |
| **Task 3** (Geocoding) | - | endpoints |
| **Task 4** (Questionnaire Engine) | - | queries |
| **Task 5** (Submission API) | security-critical (ALL 3) | endpoints, hooks, queries, access-control |
| **Task 6** (Heatmap) | - | endpoints, queries |
| **Task 7** (AI Recommendations) | security-critical (transactions) | endpoints, hooks, queries |
| **Task 8** (Legal Pages) | - | collections (globals), access-control |
| **Task 9** (Admin Tools) | security-critical (Local API) | endpoints, components, access-control, queries |

## Most Important Patterns by Task

### Task 1 - Collections
- ✅ Use `saveToJWT: true` for roles field
- ✅ Field-level access for `adminScoring` (admin-only)
- ✅ Pass `req` in all hooks
- ✅ `overrideAccess: false` for user operations

### Task 5 - Submission API
- ✅ `overrideAccess: false` when creating submission
- ✅ Pass `req` to all nested operations
- ✅ Use `context` to prevent hook loops
- ✅ Validate admin authorization in endpoints

### Task 7 - AI Recommendations
- ✅ Pass `req` when updating submission with AI results
- ✅ Use `context` flag to prevent hook loops
- ✅ Handle errors with retry logic

### Task 9 - Admin Tools
- ✅ Always check `req.user.roles?.includes('admin')`
- ✅ Use `overrideAccess: false` for user-scoped queries
- ✅ Throw `APIError` for unauthorized access

## Quick Checklist

Before implementing any task:
- [ ] Check if task involves Local API → Apply `overrideAccess: false` pattern
- [ ] Check if task involves hooks → Apply transaction safety pattern
- [ ] Check if task involves endpoints → Apply authentication check pattern
- [ ] Review relevant rule files before coding







