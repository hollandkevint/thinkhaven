---
status: complete
priority: p2
issue_id: "019"
tags: [code-review, typescript, quality]
dependencies: []
---

# Unsafe Type Assertion in isAdminEmail + Missing sub Guard in JWT

## Problem Statement
Two type safety issues:

1. `admin.ts:4` uses `as typeof ADMIN_EMAILS[number]` to cast potentially-undefined input into a string literal type. This lies to the compiler and passes `undefined` into `includes()`.

2. `jwt-verify.ts:21` casts the jose payload to `JwtPayload` which declares `sub: string`, but the parent `JWTPayload` type has `sub: string | undefined`. If a JWT lacks `sub`, it's `undefined` at runtime but typed as `string`.

## Findings
- **TypeScript Reviewer**: Both are real bug vectors. The admin cast hides undefined, the JWT cast hides missing sub.

## Proposed Solutions

### admin.ts fix:
```typescript
export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return (ADMIN_EMAILS as readonly string[]).includes(email.toLowerCase());
}
```

### jwt-verify.ts fix:
```typescript
if (!payload.sub) return null;
return payload as JwtPayload;
```

## Technical Details
- **Files**: `lib/auth/admin.ts:4`, `lib/auth/jwt-verify.ts:21`

## Acceptance Criteria
- [ ] No `as` cast that narrows input types
- [ ] Runtime null guard on `payload.sub`

## Work Log
| Date | Action | Notes |
|------|--------|-------|
| 2026-02-17 | Created | From code review - TypeScript reviewer finding |
