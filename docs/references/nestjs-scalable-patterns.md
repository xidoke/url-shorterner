# Monorepo Structure - API & Scalability Focus

## Cấu Trúc Thư Mục

```
my-monorepo/
├── apps/
│   ├── api/                          # NestJS REST + GraphQL API
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── modules/
│   │   │   │   ├── auth/            # Authentication module
│   │   │   │   ├── users/
│   │   │   │   ├── posts/
│   │   │   │   └── ...
│   │   │   ├── graphql/             # GraphQL resolvers
│   │   │   │   ├── schema.gql
│   │   │   │   ├── resolvers/
│   │   │   │   └── types/
│   │   │   └── rest/                # REST controllers
│   │   │       └── v1/
│   │   ├── test/
│   │   ├── package.json
│   │   └── nest-cli.json
│   │
│   ├── workers/                      # Message queue workers
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── processors/
│   │   │   │   ├── email.processor.ts
│   │   │   │   ├── notification.processor.ts
│   │   │   │   ├── analytics.processor.ts
│   │   │   │   └── media.processor.ts
│   │   │   └── consumers/
│   │   └── package.json
│   │
│   ├── web/                          # Next.js web app
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   └── lib/
│   │   ├── public/
│   │   └── package.json
│   │
│   └── admin/                        # Admin dashboard
│       └── ...
│
├── packages/
│   ├── auth/                         # Authentication & Authorization
│   │   ├── src/
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   ├── oauth.strategy.ts
│   │   │   │   └── api-key.strategy.ts
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts
│   │   │   │   ├── roles.guard.ts
│   │   │   │   └── permissions.guard.ts
│   │   │   ├── decorators/
│   │   │   │   ├── current-user.decorator.ts
│   │   │   │   ├── roles.decorator.ts
│   │   │   │   └── permissions.decorator.ts
│   │   │   ├── rbac/                # RBAC implementation
│   │   │   │   ├── role.service.ts
│   │   │   │   ├── permission.service.ts
│   │   │   │   └── role-permission.map.ts
│   │   │   ├── rebac/               # ReBAC implementation (future)
│   │   │   │   ├── relation.service.ts
│   │   │   │   └── graph.service.ts
│   │   │   ├── interfaces/
│   │   │   │   ├── auth-provider.interface.ts
│   │   │   │   └── permission-checker.interface.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── rate-limit/                   # Rate limiting
│   │   ├── src/
│   │   │   ├── guards/
│   │   │   │   ├── rate-limit.guard.ts
│   │   │   │   └── throttle.guard.ts
│   │   │   ├── storage/
│   │   │   │   ├── redis.storage.ts
│   │   │   │   └── memory.storage.ts
│   │   │   ├── strategies/
│   │   │   │   ├── fixed-window.ts
│   │   │   │   ├── sliding-window.ts
│   │   │   │   └── token-bucket.ts
│   │   │   ├── decorators/
│   │   │   │   └── rate-limit.decorator.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── cache/                        # Caching layer
│   │   ├── src/
│   │   │   ├── providers/
│   │   │   │   ├── redis.provider.ts
│   │   │   │   └── memcached.provider.ts
│   │   │   ├── decorators/
│   │   │   │   ├── cacheable.decorator.ts
│   │   │   │   └── cache-evict.decorator.ts
│   │   │   ├── strategies/
│   │   │   │   ├── cache-aside.ts
│   │   │   │   ├── write-through.ts
│   │   │   │   └── write-behind.ts
│   │   │   ├── interfaces/
│   │   │   │   └── cache-provider.interface.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── database/                     # Database layer
│   │   ├── src/
│   │   │   ├── prisma/
│   │   │   │   ├── schema.prisma
│   │   │   │   ├── migrations/
│   │   │   │   └── seeds/
│   │   │   ├── repositories/        # Repository pattern
│   │   │   │   ├── base.repository.ts
│   │   │   │   └── user.repository.ts
│   │   │   ├── replication/         # Master-Slave setup
│   │   │   │   ├── read-replica.service.ts
│   │   │   │   └── write-master.service.ts
│   │   │   ├── connection/
│   │   │   │   ├── pool.config.ts
│   │   │   │   └── retry.strategy.ts
│   │   │   ├── interceptors/
│   │   │   │   └── query-logger.interceptor.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── id-generator/                 # Distributed ID generation
│   │   ├── src/
│   │   │   ├── snowflake/
│   │   │   │   ├── snowflake.service.ts
│   │   │   │   └── snowflake.config.ts
│   │   │   ├── uuid/
│   │   │   │   └── uuid.service.ts
│   │   │   ├── nanoid/
│   │   │   │   └── nanoid.service.ts
│   │   │   ├── interfaces/
│   │   │   │   └── id-generator.interface.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── queue/                        # Message queue
│   │   ├── src/
│   │   │   ├── providers/
│   │   │   │   ├── bullmq.provider.ts
│   │   │   │   ├── rabbitmq.provider.ts
│   │   │   │   └── sqs.provider.ts
│   │   │   ├── decorators/
│   │   │   │   ├── queue-processor.decorator.ts
│   │   │   │   └── queue-job.decorator.ts
│   │   │   ├── interfaces/
│   │   │   │   ├── queue-provider.interface.ts
│   │   │   │   └── job-options.interface.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── monitoring/                   # Monitoring & Observability
│   │   ├── src/
│   │   │   ├── metrics/
│   │   │   │   ├── prometheus.service.ts
│   │   │   │   └── custom-metrics.ts
│   │   │   ├── tracing/
│   │   │   │   ├── opentelemetry.service.ts
│   │   │   │   └── jaeger.config.ts
│   │   │   ├── logging/
│   │   │   │   ├── winston.config.ts
│   │   │   │   └── context-logger.ts
│   │   │   ├── health/
│   │   │   │   ├── health.controller.ts
│   │   │   │   └── health-indicators.ts
│   │   │   ├── interceptors/
│   │   │   │   └── performance.interceptor.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── cdn/                          # CDN integration
│   │   ├── src/
│   │   │   ├── providers/
│   │   │   │   ├── cloudflare.provider.ts
│   │   │   │   ├── cloudfront.provider.ts
│   │   │   │   └── fastly.provider.ts
│   │   │   ├── services/
│   │   │   │   ├── asset-upload.service.ts
│   │   │   │   ├── purge.service.ts
│   │   │   │   └── url-signing.service.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── api-standards/                # API standards & conventions
│   │   ├── src/
│   │   │   ├── errors/
│   │   │   │   ├── error-codes.ts
│   │   │   │   ├── error-handler.ts
│   │   │   │   └── custom-exceptions.ts
│   │   │   ├── responses/
│   │   │   │   ├── response-wrapper.ts
│   │   │   │   └── pagination.dto.ts
│   │   │   ├── validation/
│   │   │   │   ├── query-params.validator.ts
│   │   │   │   └── custom-validators.ts
│   │   │   ├── transformers/
│   │   │   │   ├── date.transformer.ts
│   │   │   │   └── enum.transformer.ts
│   │   │   ├── filters/
│   │   │   │   └── http-exception.filter.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── websocket/                    # WebSocket real-time
│   │   ├── src/
│   │   │   ├── gateways/
│   │   │   │   ├── base.gateway.ts
│   │   │   │   └── notification.gateway.ts
│   │   │   ├── adapters/
│   │   │   │   ├── redis.adapter.ts
│   │   │   │   └── cluster.adapter.ts
│   │   │   ├── guards/
│   │   │   │   └── ws-auth.guard.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── analytics/                    # Analytics
│   │   ├── src/
│   │   │   ├── services/
│   │   │   │   ├── event-tracking.service.ts
│   │   │   │   └── metrics-aggregation.service.ts
│   │   │   ├── providers/
│   │   │   │   ├── clickhouse.provider.ts
│   │   │   │   └── bigquery.provider.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── types/                        # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── entities/
│   │   │   ├── dtos/
│   │   │   ├── enums/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── config/                       # Shared configurations
│   │   ├── biome/
│   │   │   └── biome.json
│   │   ├── typescript/
│   │   │   ├── base.json
│   │   │   ├── nest.json
│   │   │   └── next.json
│   │   └── package.json
│   │
│   └── utils/                        # Shared utilities
│       ├── src/
│       │   ├── crypto/
│       │   ├── date/
│       │   ├── string/
│       │   └── index.ts
│       └── package.json
│
├── tooling/
│   ├── scripts/
│   │   ├── setup-db-replication.sh
│   │   ├── deploy-worker.sh
│   │   └── health-check.sh
│   └── generators/
│       ├── module/
│       └── service/
│
├── infrastructure/                   # Infrastructure as Code
│   ├── terraform/
│   │   ├── modules/
│   │   │   ├── database/
│   │   │   ├── cache/
│   │   │   ├── load-balancer/
│   │   │   └── cdn/
│   │   └── environments/
│   │       ├── dev/
│   │       ├── staging/
│   │       └── prod/
│   └── kubernetes/
│       ├── api/
│       ├── workers/
│       └── monitoring/
│
├── docs/
│   ├── architecture/
│   │   ├── ADR-001-database-replication.md
│   │   ├── ADR-002-caching-strategy.md
│   │   ├── ADR-003-auth-system.md
│   │   └── scaling-guide.md
│   ├── api/
│   │   ├── rest/
│   │   │   ├── endpoints.md
│   │   │   └── error-codes.md
│   │   └── graphql/
│   │       └── schema.md
│   └── deployment/
│       ├── load-balancer-setup.md
│       └── multi-datacenter.md
│
├── .ai/                              # AI-friendly documentation
│   ├── project-structure.md
│   ├── coding-conventions.md
│   ├── common-tasks.md
│   └── troubleshooting.md
│
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.json
├── biome.json
└── README.md
```

## File Cấu Hình Chính

### 1. package.json (Root)

```json
{
  "name": "my-monorepo",
  "version": "0.0.0",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  },
  "scripts": {
    "dev": "turbo run dev",
    "dev:api": "turbo run dev --filter=api",
    "dev:workers": "turbo run dev --filter=workers",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "biome check .",
    "lint:fix": "biome check --apply .",
    "format": "biome format --write .",
    "type-check": "turbo run type-check",
    "db:migrate": "turbo run db:migrate --filter=@repo/database",
    "db:seed": "turbo run db:seed --filter=@repo/database",
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "turbo run build && changeset publish"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "@changesets/cli": "^2.27.0",
    "@turbo/gen": "^2.0.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  }
}
```

### 2. turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "globalDependencies": [
    ".env",
    "tsconfig.json",
    "biome.json"
  ],
  "globalEnv": [
    "NODE_ENV",
    "DATABASE_URL",
    "DATABASE_REPLICA_URL",
    "REDIS_URL",
    "JWT_SECRET"
  ],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "type-check": {
      "dependsOn": ["^type-check"]
    },
    "db:migrate": {
      "cache": false
    },
    "db:seed": {
      "cache": false
    }
  }
}
```

### 3. biome.json

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "warn"
      },
      "style": {
        "useConst": "error",
        "useTemplate": "warn"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always"
    }
  }
}
```

### 4. apps/api/package.json

```json
{
  "name": "api",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "start:prod": "node dist/main",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "lint": "biome check src",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@repo/auth": "workspace:*",
    "@repo/rate-limit": "workspace:*",
    "@repo/cache": "workspace:*",
    "@repo/database": "workspace:*",
    "@repo/id-generator": "workspace:*",
    "@repo/queue": "workspace:*",
    "@repo/monitoring": "workspace:*",
    "@repo/cdn": "workspace:*",
    "@repo/api-standards": "workspace:*",
    "@repo/websocket": "workspace:*",
    "@repo/analytics": "workspace:*",
    "@repo/types": "workspace:*",
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/graphql": "^12.1.0",
    "@nestjs/apollo": "^12.1.0",
    "@apollo/server": "^4.10.0",
    "graphql": "^16.8.0",
    "express": "^4.18.0",
    "helmet": "^7.1.0",
    "compression": "^1.7.4"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.0",
    "@nestjs/testing": "^10.3.0",
    "@types/node": "^20.11.0",
    "jest": "^29.7.0",
    "typescript": "^5.4.0"
  }
}
```

### 5. packages/auth/package.json

```json
{
  "name": "@repo/auth",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "biome check src",
    "type-check": "tsc --noEmit",
    "test": "jest"
  },
  "dependencies": {
    "@repo/types": "workspace:*",
    "@repo/cache": "workspace:*",
    "@nestjs/common": "^10.3.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.0",
    "bcrypt": "^5.1.0"
  },
  "devDependencies": {
    "@types/passport-jwt": "^4.0.0",
    "@types/bcrypt": "^5.0.0"
  }
}
```

### 6. packages/database/prisma/schema.prisma

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema", "postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pg_trgm, pgcrypto]
}

// Read replica configuration
datasource replica {
  provider = "postgresql"
  url      = env("DATABASE_REPLICA_URL")
}

model User {
  id        String   @id @default(dbgenerated("gen_random_uuid()"))
  email     String   @unique
  name      String?
  password  String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  posts     Post[]
  sessions  Session[]
  
  @@index([email])
  @@map("users")
}

model Role {
  id          String       @id @default(dbgenerated("gen_random_uuid()"))
  name        String       @unique
  description String?
  permissions Permission[]
  
  @@map("roles")
}

model Permission {
  id          String   @id @default(dbgenerated("gen_random_uuid()"))
  resource    String   // e.g., "post", "user"
  action      String   // e.g., "create", "read", "update", "delete"
  roles       Role[]
  
  @@unique([resource, action])
  @@map("permissions")
}

model Session {
  id        String   @id @default(dbgenerated("gen_random_uuid()"))
  userId    String
  token     String   @unique
  expiresAt DateTime
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([token])
  @@map("sessions")
}
```

## Kiến Trúc Hệ Thống

### Authentication & Authorization Flow

```typescript
// packages/auth/src/rbac/role.service.ts
import { Injectable } from '@nestjs/common';
import { CacheService } from '@repo/cache';

@Injectable()
export class RoleService {
  constructor(private cache: CacheService) {}

  async getUserPermissions(userId: string): Promise<string[]> {
    const cacheKey = `user:${userId}:permissions`;
    
    // Check cache first
    const cached = await this.cache.get<string[]>(cacheKey);
    if (cached) return cached;

    // Query from database
    const permissions = await this.db.getUserPermissions(userId);
    
    // Cache for 5 minutes
    await this.cache.set(cacheKey, permissions, 300);
    
    return permissions;
  }

  async checkPermission(
    userId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(`${resource}:${action}`);
  }
}

// Migration path to ReBAC
// packages/auth/src/rebac/relation.service.ts
export class RelationService {
  // Future: Implement Zanzibar-like relation checking
  // user:alice has writer relationship with document:doc1
  async checkRelation(
    subject: string,
    relation: string,
    object: string
  ): Promise<boolean> {
    // To be implemented when scaling needs
  }
}
```

### Rate Limiting Strategy

```typescript
// packages/rate-limit/src/guards/rate-limit.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisStorage } from '../storage/redis.storage';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private storage: RedisStorage
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const limit = this.reflector.get('rateLimit', context.getHandler());
    
    const key = `rate_limit:${request.ip}:${request.path}`;
    const count = await this.storage.increment(key, limit.window);
    
    if (count > limit.max) {
      throw new TooManyRequestsException();
    }
    
    return true;
  }
}

// Usage in controller
@RateLimit({ max: 100, window: 60 }) // 100 requests per minute
@Get('posts')
async getPosts() {
  return this.postsService.findAll();
}
```

### Database Replication

```typescript
// packages/database/src/replication/read-replica.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseService {
  private readonly master: PrismaClient;
  private readonly replicas: PrismaClient[];
  private replicaIndex = 0;

  constructor() {
    this.master = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_URL }
      }
    });

    this.replicas = [
      new PrismaClient({
        datasources: {
          db: { url: process.env.DATABASE_REPLICA_URL }
        }
      })
    ];
  }

  // Write operations always go to master
  getMasterClient(): PrismaClient {
    return this.master;
  }

  // Read operations use round-robin replica selection
  getReplicaClient(): PrismaClient {
    const replica = this.replicas[this.replicaIndex];
    this.replicaIndex = (this.replicaIndex + 1) % this.replicas.length;
    return replica;
  }
}

// Usage in repository
export class UserRepository {
  constructor(private db: DatabaseService) {}

  async findById(id: string) {
    // Read from replica
    return this.db.getReplicaClient().user.findUnique({ where: { id } });
  }

  async create(data: CreateUserDto) {
    // Write to master
    return this.db.getMasterClient().user.create({ data });
  }
}
```

### Caching Strategy

```typescript
// packages/cache/src/decorators/cacheable.decorator.ts
export function Cacheable(options: CacheOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = generateKey(propertyKey, args);
      const cached = await this.cache.get(cacheKey);

      if (cached) return cached;

      const result = await originalMethod.apply(this, args);
      await this.cache.set(cacheKey, result, options.ttl);

      return result;
    };

    return descriptor;
  };
}

// Usage
class PostService {
  @Cacheable({ ttl: 300, key: 'post:{{id}}' })
  async findById(id: string) {
    return this.db.post.findUnique({ where: { id } });
  }
}
```

### Distributed ID Generation

```typescript
// packages/id-generator/src/snowflake/snowflake.service.ts
export class SnowflakeService {
  private sequence = 0;
  private lastTimestamp = -1;

  constructor(
    private workerId: number,
    private datacenterId: number
  ) {}

  generate(): string {
    let timestamp = Date.now();

    if (timestamp < this.lastTimestamp) {
      throw new Error('Clock moved backwards');
    }

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1) & 4095;
      if (this.sequence === 0) {
        timestamp = this.waitNextMillis(this.lastTimestamp);
      }
    } else {
      this.sequence = 0;
    }

    this.lastTimestamp = timestamp;

    const id =
      ((timestamp - 1609459200000) << 22) |
      (this.datacenterId << 17) |
      (this.workerId << 12) |
      this.sequence;

    return id.toString();
  }
}
```

### Message Queue & Workers

```typescript
// packages/queue/src/providers/bullmq.provider.ts
import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';

export class QueueProvider {
  private queues = new Map<string, Queue>();

  async addJob(queueName: string, data: any, options?: JobOptions) {
    const queue = this.getQueue(queueName);
    return queue.add(queueName, data, options);
  }

  registerWorker(queueName: string, processor: ProcessorFn) {
    const worker = new Worker(queueName, processor, {
      connection: new Redis(process.env.REDIS_URL)
    });
    
    return worker;
  }
}

// apps/workers/src/processors/email.processor.ts
export class EmailProcessor {
  async process(job: Job) {
    const { to, subject, body } = job.data;
    await this.emailService.send(to, subject, body);
  }
}
```

### API Standards

```typescript
// packages/api-standards/src/responses/response-wrapper.ts
export class ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;

  static success<T>(data: T, meta?: ApiMeta): ApiResponse<T> {
    return {
      success: true,
      data,
      meta
    };
  }

  static error(error: ApiError): ApiResponse<never> {
    return {
      success: false,
      error
    };
  }
}

// packages/api-standards/src/errors/error-codes.ts
export enum ErrorCode {
  // Authentication (1xxx)
  INVALID_CREDENTIALS = 1001,
  TOKEN_EXPIRED = 1002,
  INSUFFICIENT_PERMISSIONS = 1003,
  
  // Rate Limiting (2xxx)
  RATE_LIMIT_EXCEEDED = 2001,
  
  // Validation (3xxx)
  INVALID_INPUT = 3001,
  MISSING_FIELD = 3002,
  
  // Resources (4xxx)
  NOT_FOUND = 4001,
  ALREADY_EXISTS = 4002,
  
  // Server (5xxx)
  INTERNAL_ERROR = 5001,
  SERVICE_UNAVAILABLE = 5002
}

// Usage
@Get(':id')
async getPost(@Param('id') id: string) {
  const post = await this.postService.findById(id);
  
  if (!post) {
    throw new NotFoundException({
      code: ErrorCode.NOT_FOUND,
      message: 'Post not found',
      details: { id }
    });
  }
  
  return ApiResponse.success(post);
}
```

### GraphQL + REST API

```typescript
// apps/api/src/graphql/resolvers/post.resolver.ts
@Resolver(() => Post)
export class PostResolver {
  constructor(
    private postService: PostService,
    @CurrentUser() private user: User
  ) {}

  @Query(() => [Post])
  @UseGuards(AuthGuard, RateLimitGuard)
  async posts(
    @Args() args: PostsArgs
  ): Promise<Post[]> {
    return this.postService.findAll(args);
  }
}

// apps/api/src/rest/v1/posts.controller.ts
@Controller('api/v1/posts')
@UseGuards(AuthGuard, RateLimitGuard)
export class PostsController {
  @Get()
  async findAll(@Query() query: QueryParamsDto) {
    const posts = await this.postService.findAll(query);
    return ApiResponse.success(posts, {
      pagination: query.pagination
    });
  }
}
```

### WebSocket Real-time

```typescript
// packages/websocket/src/gateways/notification.gateway.ts
@WebSocketGateway({
  cors: { origin: '*' },
  adapter: RedisIoAdapter // For multi-server support
})
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SubscribeDto
  ) {
    await client.join(`user:${data.userId}`);
  }

  async sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
```

### Monitoring & Observability

```typescript
// packages/monitoring/src/metrics/prometheus.service.ts
import { Counter, Histogram, Registry } from 'prom-client';

export class MetricsService {
  private registry: Registry;
  private httpRequestDuration: Histogram;
  private httpRequestTotal: Counter;

  constructor() {
    this.registry = new Registry();
    
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry]
    });

    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry]
    });
  }

  recordRequest(method: string, route: string, status: number, duration: number) {
    this.httpRequestTotal.inc({ method, route, status });
    this.httpRequestDuration.observe({ method, route, status }, duration);
  }

  getMetrics() {
    return this.registry.metrics();
  }
}
```

## Load Balancer Configuration

```nginx
# infrastructure/nginx/nginx.conf
upstream api_servers {
    least_conn;
    server api-1:3000 weight=1;
    server api-2:3000 weight=1;
    server api-3:3000 weight=1;
    
    # Health check
    check interval=3000 rise=2 fall=3 timeout=1000;
}

upstream worker_servers {
    server worker-1:3001;
    server worker-2:3001;
}

server {
    listen 80;
    
    location /api {
        proxy_pass http://api_servers;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    location /graphql {
        proxy_pass http://api_servers/graphql;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Migration Path to Microservices

```
Monorepo Structure (Current)     →     Microservices (Future)
─────────────────────────────────────────────────────────────
apps/api/                              service-auth/
  ├── modules/auth/               →    service-users/
  ├── modules/users/              →    service-posts/
  ├── modules/posts/              →    service-notifications/

Shared packages can be:
1. Kept as internal packages (recommended initially)
2. Published to private npm registry
3. Converted to shared libraries per service

Key principles for easy migration:
- Domain-driven design in modules
- Clear boundaries between modules
- Minimal cross-module dependencies
- Separate databases per domain (logical separation first)
- Message queue for inter-module communication
```

## AI-Friendly Features

```markdown
# .ai/project-structure.md

## Quick Reference

### Adding a new API endpoint
1. Create controller in `apps/api/src/rest/v1/`
2. Create service in corresponding module
3. Add DTOs in `packages/types/src/dtos/`
4. Update Prisma schema if needed
5. Add tests

### Adding a new background job
1. Create processor in `apps/workers/src/processors/`
2. Define job type in `packages/queue/src/types/`
3. Enqueue from API using `queueService.addJob()`

### Adding authentication to route
```typescript
@UseGuards(AuthGuard, PermissionGuard)
@RequirePermission('posts:create')
@Post()
async createPost() { }
```

### Common Commands
- `pnpm dev:api` - Start API server
- `pnpm dev:workers` - Start workers
- `pnpm db:migrate` - Run migrations
- `pnpm test` - Run all tests
```

## Environment Variables

```bash
# .env.example

# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
DATABASE_REPLICA_URL="postgresql://user:pass@replica:5432/db"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Monitoring
PROMETHEUS_PORT=9090
JAEGER_ENDPOINT="http://localhost:14268/api/traces"

# CDN
CDN_URL="https://cdn.example.com"
CDN_API_KEY="your-cdn-api-key"

# Message Queue
QUEUE_REDIS_URL="redis://localhost:6379"

# Snowflake ID
WORKER_ID=1
DATACENTER_ID=1
```

Cấu trúc này đã sẵn sàng để scale và dễ dàng migrate sang microservices khi cần!
