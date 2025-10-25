# ADR 001: Monorepo Architecture

**Status:** Accepted
**Date:** 2025-10-25
**Deciders:** Development Team

---

## Context

We need to decide on the repository structure for our URL shortener system, which will eventually have multiple applications (API, workers, admin dashboard) and shared packages (auth, cache, database).

**Options Considered:**
1. **Polyrepo** - Separate repository for each service
2. **Monorepo** - Single repository with multiple packages
3. **Hybrid** - Monorepo for core, separate repos for apps

---

## Decision

We chose **Monorepo** with TurboRepo and pnpm workspaces.

---

## Rationale

### Pros of Monorepo

1. **Code Sharing**
   - Shared packages (auth, cache, database) in `packages/`
   - Single source of truth for types and interfaces
   - No version conflicts

2. **Atomic Changes**
   - Update API + Worker in single PR
   - Guaranteed compatibility across services
   - Easy refactoring

3. **Developer Experience**
   - Single `git clone`
   - Unified tooling (TypeScript, ESLint, testing)
   - One CI/CD pipeline

4. **Build Performance**
   - TurboRepo caching (build once, reuse)
   - Incremental builds (only changed packages)
   - Parallel task execution

### Cons We Accepted

1. **Larger Repository**
   - Mitigated by: Sparse checkout, good organization

2. **More Complex CI/CD**
   - Mitigated by: TurboRepo filters (`--filter=api...`)

3. **Potential for Tight Coupling**
   - Mitigated by: Clear package boundaries, no circular deps

---

## Implementation

### Structure

```
url-shortener/
├── apps/
│   ├── api/              # Main API
│   ├── workers/          # Background workers
│   └── admin-dashboard/  # Admin UI
├── packages/
│   ├── auth/            # Shared auth
│   ├── cache/           # Shared cache
│   ├── database/        # Shared database
│   └── types/           # Shared types
├── turbo.json           # TurboRepo config
└── pnpm-workspace.yaml  # Workspace config
```

### Tools

- **pnpm**: Fast, disk-efficient package manager
- **TurboRepo**: Build orchestration and caching
- **TypeScript**: Project references for type safety

---

## Consequences

### Positive

✅ Easier to maintain type consistency
✅ Faster development (shared code)
✅ Single CI/CD pipeline
✅ Better code reuse

### Negative

⚠️ Larger git history over time
⚠️ Need discipline to avoid tight coupling
⚠️ More complex initial setup

### Neutral

- Team needs to learn TurboRepo
- Need clear package ownership
- Requires good documentation

---

## Migration Path

**If we need to split later:**

1. Extract package to separate repo
2. Publish to private npm registry
3. Update imports to use published package
4. Remove from monorepo

**Example:**
```typescript
// Before (monorepo)
import { AuthGuard } from '@xidoke/auth';

// After (polyrepo)
import { AuthGuard } from '@company/auth-package';
```

This is straightforward thanks to package-based structure.

---

## Alternatives Considered

### Polyrepo

**Pros:**
- Independent versioning
- Smaller repositories
- Team autonomy

**Cons:**
- Complex dependency management
- Duplicate code
- Breaking changes harder to coordinate

**Why Rejected:** Too much overhead for early-stage project

### Hybrid

**Pros:**
- Flexibility
- Can separate later

**Cons:**
- Worst of both worlds
- Inconsistent tooling

**Why Rejected:** Adds complexity without clear benefits

---

## References

- [TurboRepo Documentation](https://turbo.build/repo/docs)
- [Monorepo Best Practices](https://monorepo.tools/)
- [pnpm Workspaces](https://pnpm.io/workspaces)

---

## Review Schedule

- **Next Review:** After 6 months (May 2026)
- **Trigger:** If team >10 people or >5 services
