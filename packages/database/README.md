# @xidoke/database

Database schemas, migrations, and seed data for URL Shortener.

## Setup

```bash
# Generate Prisma Client
pnpm db:generate

# Push schema to database (dev only)
pnpm db:push

# Create and run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Open Prisma Studio
pnpm db:studio
```

## Environment Variables

Required:
- `DATABASE_URL`: PostgreSQL connection string

Example:
```
DATABASE_URL="postgresql://user:password@localhost:5432/urlshortener?schema=public"
```
