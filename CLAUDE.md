# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A production-ready URL shortener service built as a Turborepo monorepo with NestJS, targeting 100K QPS with <20ms p50 latency. Currently in **Sprint 2** focusing on authentication, authorization, and security infrastructure.

## MCP Context7 Integration

This repository has **MCP Context7** enabled to provide access to up-to-date official documentation for all libraries and frameworks used.

**IMPORTANT: Always consult official documentation when:**
- Implementing features with NestJS, Prisma, or other frameworks
- Using library-specific APIs or decorators
- Troubleshooting framework-specific issues
- Following best practices for third-party packages

**How to use Context7:**
```typescript
// Before implementing, fetch docs for accurate API usage:
// Use mcp__context7__resolve-library-id and mcp__context7__get-library-docs

// Example: Check NestJS Passport strategy implementation
// Example: Verify Prisma schema syntax and relations
// Example: Confirm Redis client methods (ioredis)
```

**Priority order for decision-making:**
1. **Official docs via Context7** - Always check first to avoid outdated patterns
2. **Existing codebase patterns** - Follow established conventions in this repo
3. **Project documentation** - Reference `docs/` for architecture decisions

This prevents errors from outdated knowledge and ensures compatibility with current package versions.

## Essential Commands

### Development
```bash
# Install dependencies
pnpm install

# Generate Prisma Client (required before first run)
pnpm --filter=@xidoke/database db:generate

# Start all apps in dev mode
pnpm dev

# Build all apps and packages
pnpm build

# Type checking across workspace
pnpm check-types

# Code quality
pnpm biome:check      # Lint + format
pnpm biome:lint       # Lint only
pnpm biome:format     # Format only
```

### Database Operations
```bash
# Generate Prisma Client
pnpm --filter=@xidoke/database db:generate

# Push schema changes (dev only)
pnpm --filter=@xidoke/database db:push

# Create and apply migrations
pnpm --filter=@xidoke/database db:migrate

# Production migrations
pnpm --filter=@xidoke/database db:migrate:deploy

# Seed database
pnpm --filter=@xidoke/database db:seed

# Open Prisma Studio
pnpm --filter=@xidoke/database db:studio
```

### Testing (API)
```bash
cd apps/api

# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:cov

# E2E tests
pnpm test:e2e

# Debug tests
pnpm test:debug
```

### Working with Specific Packages
```bash
# Use Turbo filters for package-specific commands
turbo build --filter=@xidoke/auth
turbo dev --filter=@xidoke/url-shortener-api
```

## Architecture

### Monorepo Structure

This is a **pnpm + Turborepo** monorepo with:

- **`apps/api/`** - NestJS backend API (main application)
- **`packages/database/`** - Prisma schema and database client
- **`packages/types/`** - Shared TypeScript types, constants, and utilities
- **`packages/auth/`** - JWT authentication, guards, decorators (workspace package)
- **`packages/rate-limit/`** - Redis/memory-based rate limiting (workspace package)
- **`packages/api-standards/`** - Standardized API responses and error handling (workspace package)
- **`packages/typescript-config/`** - Shared TypeScript configurations

### Application Architecture (apps/api/src/)

The API follows **NestJS modular architecture** organized as:

```
apps/api/src/
├── infrastructure/          # Shared infrastructure concerns
│   ├── database/           # Prisma service and module
│   ├── cache/              # L1 (local) + L2 (Redis) caching
│   ├── id-generator/       # Snowflake ID + Base62 encoding
│   └── monitoring/         # Health checks, metrics
│
├── modules/                # Feature modules (domain logic)
│   ├── links/             # Link CRUD operations
│   ├── redirect/          # High-performance redirect service
│   └── users/             # User management
│
└── common/                # Shared utilities (guards, decorators, etc.)
```

**Key Architectural Patterns:**

1. **Repository Pattern**: Each feature module has a `.repository.ts` that encapsulates Prisma queries
2. **Service Layer**: Business logic lives in `.service.ts` files
3. **DTO Validation**: All inputs validated using `class-validator` decorators
4. **Workspace Packages**: Shared packages (`@xidoke/*`) are imported from workspace, not npm

### Multi-Tier Caching Strategy

The redirect service implements a **3-tier cache hierarchy**:

1. **L1 (Local Cache)**: In-memory LRU cache per API instance (~1ms latency, 20-30% hit rate)
2. **L2 (Redis)**: Shared cache across all instances (~2-5ms latency, 60-70% hit rate)
3. **L3 (PostgreSQL)**: Source of truth (~10-50ms latency, 10% cache miss)

**Cache invalidation** uses Redis Pub/Sub to notify all API instances when links are updated.

### ID Generation

Uses **Snowflake IDs** for distributed, time-sortable unique identifiers:
- 64-bit: `[timestamp:41][region:3][worker:10][sequence:10]`
- Configured via `REGION_ID` and `WORKER_ID` environment variables
- Converted to **Base62** for short codes (human-friendly URLs)

### Database Schema

PostgreSQL with Prisma ORM:
- **Users**: Email/password auth, tier-based rate limits (FREE/PAID/ENTERPRISE)
- **Links**: Snowflake IDs, short codes (unique), long URLs, soft deletes
- **Collections**: Organize links into groups
- **IdempotencyKeys**: Prevent duplicate link creation (API idempotency)

**Important**: Always run `db:generate` after modifying `schema.prisma` to regenerate the Prisma Client.

### Shared Packages

When working with workspace packages (`packages/auth/`, `packages/rate-limit/`, etc.):

1. **Import via workspace protocol**: `import { AuthGuard } from '@xidoke/auth'`
2. **Modifications rebuild dependents**: TurboRepo handles incremental builds
3. **Package exports**: Check `index.ts` for exported APIs
4. **NestJS modules**: Most packages export a `.module.ts` for DI integration

## Current Sprint Context

**Sprint 2: Authentication & Security** (see `docs/planning/current-sprint.md`)

Focus areas:
1. JWT-based authentication with Passport.js
2. Role-based access control (RBAC) using decorators
3. Rate limiting per user tier (Redis-backed)
4. Standardized API responses and error codes

**Important Sprint Files:**
- `packages/auth/` - Authentication package (in progress)
- `packages/rate-limit/` - Rate limiting package (in progress)
- `packages/api-standards/` - API standardization (in progress)

## Development Guidelines

### Using Official Documentation (Context7)

**Before implementing any feature**, fetch official documentation:

```bash
# For NestJS features (auth, guards, interceptors, etc.)
Use: mcp__context7__resolve-library-id with "nestjs"
Then: mcp__context7__get-library-docs with the library ID

# For Prisma schema or queries
Use: mcp__context7__get-library-docs for Prisma

# For Redis operations (ioredis)
Use: mcp__context7__get-library-docs for ioredis

# For Passport.js strategies
Use: mcp__context7__get-library-docs for passport
```

**Examples of when to check docs:**
- Implementing JWT strategy → Check NestJS Passport docs
- Writing Prisma migrations → Check Prisma migration docs
- Using Redis commands → Check ioredis API reference
- Creating custom decorators → Check NestJS custom decorators guide
- Setting up rate limiting → Check NestJS throttler or Redis patterns

### Adding a New Module

```bash
# Generate NestJS resources
cd apps/api
npx nest generate module modules/feature-name
npx nest generate controller modules/feature-name
npx nest generate service modules/feature-name
```

Then create:
- `dto/` - Input/output DTOs with validation
- `entities/` - TypeScript entity classes
- `interfaces/` - TypeScript interfaces
- `feature-name.repository.ts` - Prisma queries

### Environment Variables

Copy `.env.example` to `.env` and configure:
- `DATABASE_URL` - PostgreSQL connection string
- `REGION_ID` / `WORKER_ID` - Snowflake ID generation
- `REDIS_HOST` / `REDIS_PORT` - Redis cache (optional, falls back to local cache)
- `JWT_SECRET` - JWT signing key (Sprint 2)

### Code Quality Tools

- **Biome**: Linting and formatting (replaces ESLint + Prettier)
  - Configured for NestJS with parameter decorators support
  - Rules disabled: `noExplicitAny`, `noStaticOnlyClass`, `noBannedTypes` (NestJS patterns)
  - Auto-organizes imports on save
- **TypeScript**: Strict mode enabled across all packages
- **Jest**: Unit and E2E testing

Always run `pnpm biome:check` before committing.

### Database Migrations

Use Prisma migrations for schema changes:

```bash
# Development: Create migration
pnpm --filter=@xidoke/database db:migrate

# Production: Apply migrations
pnpm --filter=@xidoke/database db:migrate:deploy
```

**Never** use `db:push` in production - it skips migration history.

## Common Patterns

### Protecting Routes with Auth

```typescript
import { UseGuards } from '@nestjs/common';
import { AuthGuard, Roles, CurrentUser } from '@xidoke/auth';

@UseGuards(AuthGuard)
@Controller('links')
export class LinksController {
  @Roles('PAID', 'ENTERPRISE')  // Restrict by tier
  @Post()
  createLink(@CurrentUser() user: User) {
    // user is extracted from JWT
  }

  @Public()  // Bypass auth for this endpoint
  @Get(':shortCode')
  redirect() { }
}
```

### Applying Rate Limits

```typescript
import { RateLimit } from '@xidoke/rate-limit';

@RateLimit({ limit: 10, window: 3600 })  // 10 per hour
@Post('links')
createLink() { }
```

### Standardized API Responses

```typescript
import { ApiResponse } from '@xidoke/api-standards';

return ApiResponse.success(data, { pagination });
// or
throw ApiResponse.error(ErrorCodes.LINK_NOT_FOUND);
```

### Using the Cache Service

```typescript
// Check L1 → L2 → L3 (database)
const link = await cacheService.getOrFetch(
  `link:${shortCode}`,
  () => prisma.link.findUnique({ where: { shortCode } })
);
```

## Performance Considerations

- **Redirect endpoint**: Must be <20ms p50 latency (critical path)
- **L1 cache**: Use for hot paths (most-requested links)
- **Database queries**: Always use indexes on `shortCode`, `userId`
- **Avoid N+1**: Use Prisma `include` or `select` with relations
- **Batch operations**: Use `createMany`, `updateMany` where possible

## Documentation

Comprehensive docs in `docs/`:
- **`INDEX.md`** - Documentation hub (start here)
- **`architecture/tech-stack.md`** - Full technology breakdown and scaling strategy
- **`planning/current-sprint.md`** - Current sprint tasks and priorities
- **`guides/quick-start.md`** - Setup guide
- **`decisions/`** - Architecture Decision Records (ADRs)

When adding features, consider updating relevant documentation.

## Troubleshooting

### Prisma Client not found
```bash
pnpm --filter=@xidoke/database db:generate
```

### Type errors after schema change
```bash
pnpm --filter=@xidoke/database db:generate
pnpm check-types
```

### Redis connection errors
The app falls back to local cache if Redis is unavailable. For development without Redis, simply don't set `REDIS_HOST` in `.env`.

### Biome errors
```bash
pnpm biome:check  # Auto-fix most issues
```

## Scaling Path

Currently **Stage 1** (single server, 1K-10K QPS). Future stages:
- **Stage 2**: Horizontal scaling with Redis (10K-50K QPS)
- **Stage 3**: Database replicas + CDN (50K-100K QPS)
- **Stage 4**: Microservices + multi-region (100K+ QPS)

See `docs/architecture/tech-stack.md` for full scaling strategy.
