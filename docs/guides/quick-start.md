# Quick Start Guide

## Sprint 1 Setup Complete ✅

All foundational structure has been created. Follow these steps to get started:

## 1. Install Dependencies

```bash
pnpm install
```

## 2. Setup Database

### Option A: Docker (Recommended)

```bash
docker run -d \
  --name postgres-urlshortener \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=urlshortener \
  -p 5432:5432 \
  postgres:15-alpine
```

### Option B: Local PostgreSQL

```bash
createdb urlshortener
```

## 3. Configure Environment

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
```

Edit `.env` if needed:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/urlshortener?schema=public"
```

## 4. Setup Prisma

```bash
cd packages/database
pnpm db:generate
pnpm db:migrate
cd ../..
```

## 5. Run the Application

```bash
pnpm dev
```

Application will be available at: http://localhost:3000

## 6. Test the Setup

### Health Check
```bash
curl http://localhost:3000/health
```

### Create a Link
```bash
curl -X POST http://localhost:3000/api/v1/links \
  -H "Content-Type: application/json" \
  -d '{
    "longUrl": "https://example.com",
    "title": "My First Link"
  }'
```

### Test Redirect
```bash
# Use the shortCode from the response above
curl -L http://localhost:3000/[shortCode]
```

## What's Available

### API Endpoints

**Health & Monitoring:**
- GET `/health` - Health check
- GET `/health/ready` - Database readiness
- GET `/metrics` - Metrics endpoint

**Links:**
- POST `/api/v1/links` - Create link
- GET `/api/v1/links` - List links (paginated)
- GET `/api/v1/links/:id` - Get link details
- PUT `/api/v1/links/:id` - Update link
- DELETE `/api/v1/links/:id` - Delete link
- GET `/api/v1/links/:id/stats` - Link statistics

**Redirect:**
- GET `/:shortCode` - Redirect to long URL

**Users:**
- GET `/api/v1/users/me` - Current user profile

## Project Structure

```
url-shortener/
├── apps/api/                    # NestJS API
│   └── src/
│       ├── infrastructure/      # Core services
│       ├── modules/            # Feature modules
│       └── common/             # Shared utilities
│
└── packages/
    ├── database/               # Prisma schema
    └── shared/                 # Shared types
```

## Key Features Implemented

✅ Snowflake ID generation + Base62 encoding
✅ Multi-tier caching (L1 local cache)
✅ Link CRUD operations
✅ Fast redirect service (<20ms target)
✅ Health check endpoints
✅ Input validation
✅ Error handling
✅ Request logging

## Development Commands

```bash
# Run in dev mode
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm check-types

# Code formatting
pnpm biome:check

# Run tests
pnpm --filter=@xidoke/url-shortener-api test
```

## Database Commands

```bash
cd packages/database

# Generate Prisma Client
pnpm db:generate

# Create migration
pnpm db:migrate

# Seed database
pnpm db:seed

# Open Prisma Studio
pnpm db:studio
```

## Troubleshooting

**Port 3000 in use:**
```bash
lsof -ti:3000 | xargs kill -9
```

**Database connection error:**
Check PostgreSQL is running:
```bash
docker ps | grep postgres
```

**Module not found:**
```bash
rm -rf node_modules
pnpm install
```

## Next Steps

See [SPRINT-1-COMPLETE.md](SPRINT-1-COMPLETE.md) for:
- Complete feature list
- Architecture decisions
- Sprint 2 roadmap
- Performance targets

See [SETUP.md](SETUP.md) for:
- Detailed setup instructions
- API documentation
- Testing guide
- Contributing guidelines

## Need Help?

1. Check [SETUP.md](SETUP.md) for detailed instructions
2. Check [CLAUDE.md](CLAUDE.md) for project overview
3. Check [SPRINT-1-COMPLETE.md](SPRINT-1-COMPLETE.md) for implementation details

---

**Ready to code!** 🚀
