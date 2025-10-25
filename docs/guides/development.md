# URL Shortener - Setup Guide

## Sprint 1 Project Structure ✅

The project structure for Sprint 1 has been completed with the following architecture:

```
url-shortener/
├── apps/
│   └── api/                                    # NestJS API Application
│       ├── src/
│       │   ├── infrastructure/                 # Infrastructure layer
│       │   │   ├── id-generator/              # Snowflake + Base62
│       │   │   ├── database/                  # Prisma service
│       │   │   ├── cache/                     # Local cache (L1)
│       │   │   └── monitoring/                # Health checks & metrics
│       │   │
│       │   ├── modules/                       # Feature modules
│       │   │   ├── links/                     # Link CRUD operations
│       │   │   ├── redirect/                  # URL redirect service
│       │   │   └── users/                     # User management
│       │   │
│       │   ├── common/                        # Shared utilities
│       │   │   ├── guards/                    # Auth, rate limiting
│       │   │   ├── interceptors/              # Logging, transform
│       │   │   ├── filters/                   # Exception handling
│       │   │   ├── decorators/                # Custom decorators
│       │   │   └── pipes/                     # Validation
│       │   │
│       │   ├── app.module.ts
│       │   └── main.ts
│       │
│       └── package.json
│
└── packages/
    ├── database/                              # Prisma schema & migrations
    │   ├── prisma/
    │   │   └── schema.prisma                 # Database schema
    │   └── seeds/
    │       └── seed.ts
    │
    ├── shared/                                # Shared types & utilities
    │   └── src/
    │       ├── types/                        # TypeScript types
    │       ├── constants/                    # Constants & error codes
    │       └── utils/                        # Validation utilities
    │
    └── typescript-config/                     # Shared TS configs (existing)
```

## Prerequisites

- Node.js >= 20
- pnpm 10.13.1
- PostgreSQL 15+ (local or Docker)

## Installation Steps

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Database

#### Option A: Local PostgreSQL

Create a database:
```bash
createdb urlshortener
```

#### Option B: Docker PostgreSQL

```bash
docker run -d \
  --name postgres-urlshortener \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=urlshortener \
  -p 5432:5432 \
  postgres:15-alpine
```

### 3. Configure Environment Variables

Copy the example env file:
```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
```

Edit `.env` and update:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/urlshortener?schema=public"
PORT=3000
BASE_URL=http://localhost:3000
REGION_ID=0
WORKER_ID=0
```

### 4. Setup Prisma

Generate Prisma Client:
```bash
cd packages/database
pnpm db:generate
```

Run migrations:
```bash
pnpm db:migrate
```

Optional - Seed database:
```bash
pnpm db:seed
```

### 5. Run the Application

Development mode:
```bash
pnpm dev
```

Or run API only:
```bash
pnpm --filter=@xidoke/url-shortener-api start:dev
```

The API will be available at: http://localhost:3000

## Testing the Setup

### Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-25T..."
}
```

### Database Health

```bash
curl http://localhost:3000/health/ready
```

Expected response:
```json
{
  "status": "ready",
  "database": "connected",
  "timestamp": "2025-10-25T..."
}
```

### Create a Link (Basic Test)

```bash
curl -X POST http://localhost:3000/api/v1/links \
  -H "Content-Type: application/json" \
  -d '{
    "longUrl": "https://example.com",
    "title": "Test Link"
  }'
```

Expected response:
```json
{
  "id": "...",
  "shortCode": "0000ABC",
  "shortUrl": "http://localhost:3000/0000ABC",
  "longUrl": "https://example.com",
  "title": "Test Link",
  "status": "ACTIVE",
  "clickCount": "0",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Test Redirect

```bash
curl -L http://localhost:3000/0000ABC
```

Should redirect to the long URL.

## Available Scripts

### Root Level

- `pnpm dev` - Run all apps in dev mode
- `pnpm build` - Build all apps
- `pnpm check-types` - Type checking across all packages
- `pnpm biome:check` - Lint and format code

### API Application

- `pnpm --filter=@xidoke/url-shortener-api start:dev` - Dev mode with watch
- `pnpm --filter=@xidoke/url-shortener-api build` - Build for production
- `pnpm --filter=@xidoke/url-shortener-api test` - Run unit tests
- `pnpm --filter=@xidoke/url-shortener-api test:e2e` - Run e2e tests

### Database

- `cd packages/database && pnpm db:generate` - Generate Prisma Client
- `cd packages/database && pnpm db:migrate` - Run migrations
- `cd packages/database && pnpm db:seed` - Seed database
- `cd packages/database && pnpm db:studio` - Open Prisma Studio

## Project Features Implemented (Sprint 1)

### ✅ Infrastructure Layer

1. **ID Generator**
   - Snowflake ID generation (distributed, sortable, 64-bit IDs)
   - Base62 encoding for short codes
   - Configurable region and worker IDs

2. **Database**
   - Prisma ORM integration
   - PostgreSQL schema with:
     - Users (with tiers: FREE, PAID, ENTERPRISE)
     - Links (with status tracking, expiration, soft delete)
     - Collections
     - Idempotency keys
   - Connection lifecycle management

3. **Caching**
   - Local in-memory cache (L1) with LRU eviction
   - 50ms TTL for hot keys
   - Redis placeholder for L2 cache (future)

4. **Monitoring**
   - Health check endpoints (/, /health, /health/ready, /health/live)
   - Metrics service placeholder for Prometheus
   - Performance tracking

### ✅ Feature Modules

1. **Links Module**
   - Create short links with auto-generated or custom aliases
   - List user links with pagination
   - Get link details
   - Update link metadata
   - Soft delete links
   - Get link statistics
   - Repository pattern for data access

2. **Redirect Module**
   - Fast short code resolution (<20ms target)
   - Multi-tier caching (L1 local cache)
   - Async click tracking (fire-and-forget)
   - Status validation (active, expired, disabled)
   - Performance metrics

3. **Users Module**
   - User profile management
   - Tier-based access (FREE, PAID, ENTERPRISE)
   - Basic CRUD operations

### ✅ Common Layer

1. **Guards**
   - Auth guard (placeholder for JWT)
   - Rate limit guard (placeholder for Redis)

2. **Interceptors**
   - Logging interceptor (HTTP request/response logging)
   - Transform interceptor (response formatting)

3. **Filters**
   - HTTP exception filter (error handling)

4. **Decorators**
   - @CurrentUser() - Extract user from request

5. **Pipes**
   - Validation pipe (DTO validation with class-validator)

### ✅ Shared Package

1. **Types**
   - Link types and interfaces
   - Analytics event types
   - Domain events for messaging

2. **Constants**
   - Error codes and messages
   - Rate limiting configs
   - Cache TTL configs
   - Short code configuration

3. **Utilities**
   - URL validation
   - Short code validation
   - Email validation
   - URL sanitization

## What's Next (Sprint 2+)

- [ ] Redis integration (L2 cache)
- [ ] JWT authentication
- [ ] Rate limiting with Redis
- [ ] Kafka integration for analytics
- [ ] ClickHouse for analytics storage
- [ ] Collections management
- [ ] Admin dashboard
- [ ] QR code generation
- [ ] Custom domains

## Troubleshooting

### Port already in use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database connection issues

Check if PostgreSQL is running:
```bash
# If using Docker
docker ps | grep postgres

# If local
pg_isready
```

### Prisma Client not generated

```bash
cd packages/database
pnpm db:generate
```

### Module not found errors

```bash
# Reinstall dependencies
rm -rf node_modules
pnpm install
```

## API Documentation

Once running, you can test the following endpoints:

### Health & Monitoring
- `GET /health` - Basic health check
- `GET /health/ready` - Readiness probe (includes DB check)
- `GET /health/live` - Liveness probe
- `GET /metrics` - Prometheus metrics (placeholder)

### Links Management
- `POST /api/v1/links` - Create a short link
- `GET /api/v1/links` - List user's links (paginated)
- `GET /api/v1/links/:id` - Get link details
- `PUT /api/v1/links/:id` - Update link
- `DELETE /api/v1/links/:id` - Delete link (soft delete)
- `GET /api/v1/links/:id/stats` - Get link statistics

### Redirect
- `GET /:shortCode` - Redirect to long URL

### Users
- `GET /api/v1/users/me` - Get current user profile

## Contributing

Follow the coding standards:
- Use tabs for indentation (Biome configured)
- Run `pnpm biome:check` before committing
- Write tests for new features
- Follow the existing module structure

## License

MIT
