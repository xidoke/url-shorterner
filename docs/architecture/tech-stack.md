# URL Shortener - Tech Stack Overview

> Tổng quan về công nghệ sử dụng và vai trò khi scale hệ thống

---

## 📚 Table of Contents

1. [Core Technologies](#core-technologies)
2. [Infrastructure Services](#infrastructure-services)
3. [Caching Strategy](#caching-strategy)
4. [Database & Storage](#database--storage)
5. [Messaging & Events](#messaging--events)
6. [Monitoring & Observability](#monitoring--observability)
7. [Scaling Path](#scaling-path)

---

## 🎯 Core Technologies

### 1. **NestJS** (API Framework)

**Vai trò:**
- Main application framework
- Dependency Injection container
- Module-based architecture
- Built-in support cho Guards, Interceptors, Pipes

**Khi scale:**
- ✅ Easy migration to microservices (NestJS Microservices)
- ✅ Built-in support cho message brokers (Kafka, RabbitMQ)
- ✅ Horizontal scaling: chạy nhiều instances behind load balancer
- ✅ Health checks sẵn có cho Kubernetes probes

**Example:**
```typescript
// Dễ dàng tách thành microservice
@Controller()
export class LinksController {
  // HTTP endpoint
  @Get(':shortCode')
  async redirect() { }

  // Message pattern (khi chuyển sang microservice)
  @MessagePattern({ cmd: 'get_link' })
  async getLink() { }
}
```

---

### 2. **TypeScript** (Language)

**Vai trò:**
- Type safety across entire codebase
- Better IDE support & refactoring
- Catch errors at compile time

**Khi scale:**
- ✅ Shared types across packages (monorepo)
- ✅ Contract-driven development (DTOs, Interfaces)
- ✅ Easy refactoring when splitting services
- ✅ Generated API clients from types

**Example:**
```typescript
// Shared types across services
// packages/types/src/link.types.ts
export interface Link {
  id: bigint;
  shortCode: string;
  longUrl: string;
}

// Both API and Workers use same types
import { Link } from '@xidoke/types';
```

---

### 3. **pnpm + TurboRepo** (Monorepo)

**Vai trò:**
- Fast package management (disk-efficient)
- Workspace support (shared dependencies)
- Build caching (faster CI/CD)

**Khi scale:**
- ✅ Single codebase, multiple deployable apps
- ✅ Shared packages (auth, cache, database)
- ✅ Incremental builds (only changed packages)
- ✅ Easy to extract services later

**Structure:**
```
url-shortener/
├── apps/
│   ├── api/              # Main API (deploy independently)
│   ├── workers/          # Background workers
│   └── admin-dashboard/  # Admin UI
├── packages/
│   ├── auth/            # Shared across all apps
│   ├── cache/           # Shared caching logic
│   └── database/        # Shared database access
```

**Deployment:**
```bash
# Deploy only what changed
turbo build --filter=api...   # Only API if changed
turbo build --filter=workers... # Only workers if changed
```

---

## 🏗️ Infrastructure Services

### 4. **PostgreSQL** (Primary Database)

**Vai trò:**
- ACID transactions (consistency)
- Relational data (users, links, collections)
- JSONB support (flexible metadata)
- Full-text search

**Khi scale:**

**Vertical Scaling:**
- ⬆️ Increase CPU, RAM, SSD
- ⬆️ Connection pooling (PgBouncer)
- Target: 10K-50K QPS

**Horizontal Scaling:**
```
┌─────────────┐
│   Master    │ ← Writes (INSERT, UPDATE, DELETE)
│  (Primary)  │
└─────────────┘
      │
      ├─ Replication ─┐
      │                │
      ▼                ▼
┌──────────┐    ┌──────────┐
│ Replica 1│    │ Replica 2│ ← Reads (SELECT)
└──────────┘    └──────────┘
```

**Implementation:**
```typescript
// Write to master
await prisma.$write.link.create({ data: {...} });

// Read from replica (round-robin)
await prisma.$read.link.findMany({ where: {...} });
```

**Sharding Strategy (100M+ links):**
```
Shard 1: users 0-9        (shortCode starts with 0-9)
Shard 2: users A-M        (shortCode starts with A-M)
Shard 3: users N-Z        (shortCode starts with N-Z)
```

**Capacity:**
- Single instance: ~10K QPS
- With replicas: ~50K QPS
- With sharding: ~500K QPS

---

### 5. **Redis** (L2 Cache + Rate Limiting)

**Vai trò:**
- In-memory cache (sub-millisecond latency)
- Rate limiting counters
- Session storage
- Pub/Sub for cache invalidation

**Khi scale:**

**Single Instance:**
```
┌─────────────┐
│    Redis    │ ← 100K ops/sec
│  (Standalone)│
└─────────────┘
```

**Redis Cluster (Sharding):**
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Master 1  │  │   Master 2  │  │   Master 3  │
│  Slots 0-5K │  │ Slots 5K-10K│  │Slots 10K-16K│
└─────────────┘  └─────────────┘  └─────────────┘
      │                │                │
      ▼                ▼                ▼
 ┌─────────┐      ┌─────────┐      ┌─────────┐
 │ Replica │      │ Replica │      │ Replica │
 └─────────┘      └─────────┘      └─────────┘
```

**Usage:**
```typescript
// L2 Cache
await redis.set(`link:${shortCode}`, JSON.stringify(link), 'EX', 3600);
const cached = await redis.get(`link:${shortCode}`);

// Rate Limiting (Fixed Window)
const key = `rate:user:${userId}:${hour}`;
const count = await redis.incr(key);
await redis.expire(key, 3600);

if (count > LIMIT) throw new TooManyRequestsException();

// Pub/Sub (Cache Invalidation)
await redis.publish('cache:invalidate', JSON.stringify({ key: 'link:abc123' }));
```

**Capacity:**
- Single instance: 100K ops/sec
- Cluster (3 masters): 300K ops/sec
- With replicas: 600K+ ops/sec (read-heavy)

---

### 6. **Snowflake ID Generator** (Distributed IDs)

**Vai trò:**
- Generate unique IDs without coordination
- IDs are sortable by time
- Embedded region & worker info

**Khi scale:**

**Architecture:**
```
Bit Layout: [timestamp:41][region:3][worker:10][sequence:10]

Region 0 (US-EAST):          Region 1 (EU):
  Worker 0 (API-1)             Worker 0 (API-1)
  Worker 1 (API-2)             Worker 1 (API-2)
  ...                          ...
  Worker 1023 (API-N)          Worker 1023 (API-N)
```

**Capacity:**
- 1 worker: 1024 IDs/millisecond = 1M IDs/second
- 8 regions × 1024 workers = 8192 workers
- Total: 8B IDs/second (overkill cho URL shortener)

**Benefits:**
```typescript
const id = snowflake.generateId(); // 7234567890123456789n

// Extract info
snowflake.extractTimestamp(id);  // 2025-01-15T10:30:00Z
snowflake.extractRegionId(id);   // 0 (US-EAST)
snowflake.extractWorkerId(id);   // 42 (API-42)
snowflake.extractSequence(id);   // 123
```

**No Coordination Needed:**
- ✅ No database auto-increment (bottleneck)
- ✅ No Redis atomic counter (network call)
- ✅ Generated locally (ultra-fast)

---

## 💾 Caching Strategy

### Multi-Tier Cache Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Client Request                     │
│                  GET /abc123                          │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
         ┌──────────────────────┐
         │   L1: Local Cache    │ ← In-Memory (Node.js)
         │   LRU, 50ms TTL      │    Latency: <1ms
         │   Size: 1000 keys    │    Hit rate: 20-30%
         └──────────┬───────────┘
                    │ Cache Miss
                    ▼
         ┌──────────────────────┐
         │   L2: Redis Cache    │ ← Network
         │   Cluster, 1h-7d TTL │    Latency: 1-5ms
         │   Size: 1M+ keys     │    Hit rate: 60-70%
         └──────────┬───────────┘
                    │ Cache Miss
                    ▼
         ┌──────────────────────┐
         │  L3: PostgreSQL      │ ← Disk + Network
         │  Indexed shortCode   │    Latency: 10-50ms
         │  All links           │    Hit rate: 10%
         └──────────────────────┘
```

**Implementation:**
```typescript
async function resolveShortCode(shortCode: string): Promise<string> {
  // L1: Local cache (fastest)
  const l1 = localCache.get(shortCode);
  if (l1) return l1.longUrl; // ~0.1ms

  // L2: Redis cache
  const l2 = await redis.get(`link:${shortCode}`);
  if (l2) {
    localCache.set(shortCode, JSON.parse(l2)); // Warm L1
    return JSON.parse(l2).longUrl; // ~2ms
  }

  // L3: Database
  const link = await prisma.link.findUnique({ where: { shortCode } });
  if (!link) throw new NotFoundException();

  // Warm caches
  const data = { longUrl: link.longUrl, status: link.status };
  await redis.set(`link:${shortCode}`, JSON.stringify(data), 'EX', 3600);
  localCache.set(shortCode, data);

  return link.longUrl; // ~20ms
}
```

**Cache Invalidation:**
```typescript
// When link is updated
async function updateLink(id: bigint, data: UpdateLinkDto) {
  const link = await prisma.link.update({ where: { id }, data });

  // Invalidate L2 cache
  await redis.del(`link:${link.shortCode}`);

  // Publish to other servers (invalidate their L1)
  await redis.publish('cache:invalidate', JSON.stringify({
    key: `link:${link.shortCode}`,
  }));

  return link;
}

// Subscribe to cache invalidation
redis.subscribe('cache:invalidate');
redis.on('message', (channel, message) => {
  const { key } = JSON.parse(message);
  localCache.delete(key); // Clear L1
});
```

**Performance:**
```
Target p50 latency: <20ms
├─ L1 hit (30%):    0.5ms  ✅
├─ L2 hit (60%):    3ms    ✅
└─ L3 hit (10%):    25ms   ⚠️

Overall p50: (0.3×0.5) + (0.6×3) + (0.1×25) = 0.15 + 1.8 + 2.5 = 4.45ms ✅
Overall p99: ~30ms (mostly L3 hits)
```

---

## 📊 Database & Storage

### 7. **Prisma ORM**

**Vai trò:**
- Type-safe database queries
- Auto-generated client from schema
- Migration management

**Khi scale:**

**Query Optimization:**
```typescript
// ❌ Bad: N+1 queries
const links = await prisma.link.findMany();
for (const link of links) {
  link.user = await prisma.user.findUnique({ where: { id: link.userId } });
}

// ✅ Good: Single query with join
const links = await prisma.link.findMany({
  include: { user: true },
});

// ✅ Better: Select only needed fields
const links = await prisma.link.findMany({
  select: {
    id: true,
    shortCode: true,
    longUrl: true,
    user: { select: { name: true, email: true } },
  },
});
```

**Connection Pooling:**
```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// .env
DATABASE_URL="postgresql://user:pass@localhost:5432/db?connection_limit=100"
```

**Read Replicas:**
```typescript
// packages/database/src/prisma.service.ts
export class PrismaService {
  private master: PrismaClient;
  private replicas: PrismaClient[];

  // Write operations
  async create(data: any) {
    return this.master.link.create({ data });
  }

  // Read operations (load balanced)
  async findMany(where: any) {
    const replica = this.getRandomReplica();
    return replica.link.findMany({ where });
  }
}
```

---

### 8. **ClickHouse** (Analytics Database)

**Vai trò:**
- OLAP (Online Analytical Processing)
- Columnar storage (high compression)
- Fast aggregation queries

**Khi scale:**

**Why ClickHouse for Analytics?**
```
PostgreSQL (OLTP):            ClickHouse (OLAP):
├─ Row-based storage          ├─ Column-based storage
├─ ACID transactions          ├─ Append-only (no updates)
├─ Normalized data            ├─ Denormalized data
├─ Real-time writes           ├─ Batch inserts
└─ Slow aggregations          └─ Fast aggregations

Query Performance:
PostgreSQL:  COUNT(*) FROM clicks WHERE date = '2025-01-15'  → 5 seconds
ClickHouse:  COUNT(*) FROM clicks WHERE date = '2025-01-15'  → 50ms (100x faster)
```

**Schema:**
```sql
-- Click events (raw data)
CREATE TABLE click_events_raw (
    event_id String,
    link_id UInt64,
    short_code String,
    timestamp DateTime,
    ip_address IPv6,
    user_agent String,
    referer String,
    country_code FixedString(2),
    device_type LowCardinality(String),
    date Date MATERIALIZED toDate(timestamp)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (link_id, timestamp)
TTL date + INTERVAL 30 DAY TO DISK 's3_cold';

-- Materialized view for fast aggregation
CREATE MATERIALIZED VIEW link_stats_daily
ENGINE = SummingMergeTree()
ORDER BY (link_id, date, country_code)
AS SELECT
    link_id,
    toDate(timestamp) as date,
    country_code,
    count() as click_count,
    uniq(ip_address) as unique_visitors
FROM click_events_raw
GROUP BY link_id, date, country_code;
```

**Usage:**
```typescript
// Write: Batch insert (via Kafka → ClickHouse)
await kafka.publish('click-events', {
  event_id: uuid(),
  link_id: 12345,
  short_code: 'abc123',
  timestamp: Date.now(),
  ip_address: req.ip,
});

// Read: Fast aggregation
const stats = await clickhouse.query(`
  SELECT
    country_code,
    sum(click_count) as total_clicks,
    sum(unique_visitors) as total_visitors
  FROM link_stats_daily
  WHERE link_id = 12345
    AND date >= today() - INTERVAL 30 DAY
  GROUP BY country_code
  ORDER BY total_clicks DESC
`);
```

**Capacity:**
- Single server: 100M rows/sec insert
- Queries: <100ms for billions of rows
- Compression: 10-50x (1TB data → 20-100GB)

---

## 🔄 Messaging & Events

### 9. **Kafka** (Message Broker)

**Vai trò:**
- Async event streaming
- Decouple services
- Event sourcing
- High throughput

**Khi scale:**

**Architecture:**
```
┌─────────────┐
│  API Server │
└──────┬──────┘
       │ Publish event
       ▼
┌────────────────────────────────────────┐
│           Kafka Cluster                │
│  ┌──────────┐  ┌──────────┐  ┌──────┐ │
│  │ Broker 1 │  │ Broker 2 │  │Broker3││
│  └──────────┘  └──────────┘  └──────┘ │
│       │              │            │    │
│  Topic: click-events               │    │
│  Partitions: 10                    │    │
│  Replication: 3                    │    │
└────────┬───────────────────────────┘
         │ Consume events
         ▼
┌─────────────────────────────────────┐
│        Consumer Groups              │
├─────────────────┬───────────────────┤
│  Analytics      │   Notifications   │
│  Worker         │   Worker          │
│  (ClickHouse)   │   (Email/SMS)     │
└─────────────────┴───────────────────┘
```

**Events:**
```typescript
// Producer (API)
await kafka.publish('click-events', {
  event_id: uuid(),
  link_id: 12345,
  short_code: 'abc123',
  timestamp: Date.now(),
  ip_address: req.ip,
  user_agent: req.headers['user-agent'],
});

await kafka.publish('link-created', {
  link_id: 12345,
  user_id: 678,
  short_code: 'abc123',
  long_url: 'https://example.com',
});

// Consumer (Analytics Worker)
@Consumer('click-events', { groupId: 'analytics-group' })
async handleClickEvent(event: ClickEvent) {
  // Insert to ClickHouse
  await clickhouse.insert('click_events_raw', event);

  // Update Redis counters
  await redis.incr(`stats:link:${event.link_id}:clicks`);
}

// Consumer (Notifications Worker)
@Consumer('link-created', { groupId: 'notifications-group' })
async handleLinkCreated(event: LinkCreatedEvent) {
  // Send confirmation email
  await emailService.send(event.user_id, 'Link created', {
    shortUrl: `https://short.url/${event.short_code}`,
  });
}
```

**Scaling:**
```
1 Partition:  1 consumer max  (10K msgs/sec)
10 Partitions: 10 consumers max (100K msgs/sec)
100 Partitions: 100 consumers max (1M msgs/sec)
```

**Capacity:**
- Single broker: 100K msgs/sec
- Cluster (3 brokers): 300K+ msgs/sec
- Retention: 7 days (configurable)

---

## 📈 Monitoring & Observability

### 10. **Prometheus + Grafana** (Metrics)

**Vai trò:**
- Time-series metrics
- Alerting
- Visualization

**Metrics:**
```typescript
// Counters
redirectCount.inc({ status: 'success' });
redirectCount.inc({ status: 'not_found' });

// Histograms (latency)
redirectLatency.observe(25); // 25ms

// Gauges (current values)
activeSessions.set(1500);
cacheHitRate.set(0.85);
```

**Dashboards:**
```
┌─────────────────────────────────────┐
│    Redirect Performance             │
├─────────────────────────────────────┤
│ p50: 15ms  p95: 40ms  p99: 80ms    │
│ QPS: 10,000 req/sec                 │
│ Cache Hit Rate: 85%                 │
│   ├─ L1: 30%                        │
│   └─ L2: 55%                        │
└─────────────────────────────────────┘
```

---

### 11. **Winston + ELK Stack** (Logging)

**Vai trò:**
- Structured logging
- Centralized log aggregation
- Search & analysis

**Architecture:**
```
┌────────────────┐
│   API Servers  │
│   (Winston)    │ ─→ Log to file/stdout
└────────────────┘
         │
         ▼
┌────────────────┐
│   Filebeat     │ ─→ Ship logs
└────────────────┘
         │
         ▼
┌────────────────┐
│ Logstash       │ ─→ Parse & transform
└────────────────┘
         │
         ▼
┌────────────────┐
│ Elasticsearch  │ ─→ Store & index
└────────────────┘
         │
         ▼
┌────────────────┐
│    Kibana      │ ─→ Search & visualize
└────────────────┘
```

**Structured Logs:**
```typescript
logger.info('Link created', {
  linkId: '12345',
  shortCode: 'abc123',
  userId: '678',
  duration: 150,
  timestamp: new Date().toISOString(),
});

// Search in Kibana: linkId:12345 AND userId:678
```

---

### 12. **OpenTelemetry** (Distributed Tracing)

**Vai trò:**
- Trace requests across services
- Find performance bottlenecks
- Debug distributed systems

**Trace Example:**
```
Request: GET /abc123
├─ Redirect Service      (5ms)
│  ├─ L1 Cache check     (0.5ms) ✅ Hit
│  └─ Return result      (0.1ms)
│
└─ Click Tracking        (2ms, async)
   ├─ Kafka publish      (1ms)
   └─ Redis increment    (1ms)

Total: 5ms (user sees)
Background: 2ms (async)
```

---

## 🚀 Scaling Path

### Stage 1: Single Server (Current)
**Capacity: 1K-10K requests/sec**
```
┌──────────────────────────────────┐
│        Single EC2 Instance       │
│  ┌────────────────────────────┐  │
│  │      NestJS API            │  │
│  │   + Local Cache (L1)       │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │      PostgreSQL            │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

**Bottleneck:** CPU, Database connections

---

### Stage 2: Horizontal Scaling + Redis (Sprint 2-3)
**Capacity: 10K-50K requests/sec**
```
         ┌─────────────────┐
         │  Load Balancer  │
         └────────┬────────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
        ▼         ▼         ▼
   ┌────────┐ ┌────────┐ ┌────────┐
   │ API-1  │ │ API-2  │ │ API-3  │
   │ (L1)   │ │ (L1)   │ │ (L1)   │
   └───┬────┘ └───┬────┘ └───┬────┘
       │          │          │
       └──────────┼──────────┘
                  │
            ┌─────┴─────┐
            │   Redis   │ (L2 Cache)
            │  Cluster  │
            └─────┬─────┘
                  │
          ┌───────┴────────┐
          │   PostgreSQL   │
          │    (Master)    │
          └────────────────┘
```

**Improvements:**
- ✅ Stateless API servers (scale horizontally)
- ✅ Shared cache (Redis)
- ✅ Session affinity not needed

---

### Stage 3: Database Replicas + CDN (6 months)
**Capacity: 50K-100K requests/sec**
```
         ┌─────────────────┐
         │   CloudFront    │ (CDN for static assets)
         └────────┬────────┘
                  │
         ┌────────┴────────┐
         │  Load Balancer  │
         └────────┬────────┘
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
   ┌────────┐ ┌────────┐ ┌────────┐
   │ API-1  │ │ API-2  │ │ API-3  │
   └────────┘ └────────┘ └────────┘
        │         │         │
        └─────────┼─────────┘
                  │
         ┌────────┴────────┐
         │  Redis Cluster  │
         └────────┬────────┘
                  │
       ┌──────────┴──────────┐
       │                     │
       ▼                     ▼
┌──────────────┐      ┌──────────────┐
│   Master     │ ───► │  Replica 1   │
│ (Write only) │      │ (Read only)  │
└──────────────┘      └──────────────┘
                             │
                             ▼
                      ┌──────────────┐
                      │  Replica 2   │
                      │ (Read only)  │
                      └──────────────┘
```

**Improvements:**
- ✅ Read scaling (replicas)
- ✅ CDN for static content
- ✅ Geo-distribution starting

---

### Stage 4: Microservices + Multi-Region (12-18 months)
**Capacity: 100K-1M requests/sec**
```
US-EAST Region:
┌─────────────────────────────────────────────────────┐
│  ┌───────────┐   ┌───────────┐   ┌──────────────┐  │
│  │  API GW   │   │  Redirect │   │  Analytics   │  │
│  │ (Kong)    │──▶│  Service  │   │  Service     │  │
│  └───────────┘   └─────┬─────┘   └──────┬───────┘  │
│                        │                 │           │
│  ┌──────────────────┬──┴─────────┬───────┴────────┐ │
│  │  Redis Cluster   │  DB Master │  ClickHouse    │ │
│  └──────────────────┴────────────┴────────────────┘ │
└─────────────────────────────────────────────────────┘
                       │
                       │ Replication
                       │
EU Region:
┌─────────────────────────────────────────────────────┐
│  ┌───────────┐   ┌───────────┐   ┌──────────────┐  │
│  │  API GW   │   │  Redirect │   │  Analytics   │  │
│  │ (Kong)    │──▶│  Service  │   │  Service     │  │
│  └───────────┘   └─────┬─────┘   └──────┬───────┘  │
│                        │                 │           │
│  ┌──────────────────┬──┴─────────┬───────┴────────┐ │
│  │  Redis Cluster   │ DB Replica │  ClickHouse    │ │
│  └──────────────────┴────────────┴────────────────┘ │
└─────────────────────────────────────────────────────┘

Global:
┌─────────────────────────────────────────┐
│         Kafka Cluster (3 regions)        │
│   Event streaming across all regions    │
└─────────────────────────────────────────┘
```

**Services:**
- **API Gateway** - Routing, auth, rate limiting
- **Redirect Service** - Core redirect (most critical)
- **Link Service** - CRUD operations
- **Analytics Service** - Click tracking, reporting
- **User Service** - Authentication, profiles

**Benefits:**
- ✅ Independent scaling per service
- ✅ Technology diversity (right tool for job)
- ✅ Fault isolation
- ✅ Team autonomy

---

## 📊 Performance Targets by Stage

| Metric | Stage 1 | Stage 2 | Stage 3 | Stage 4 |
|--------|---------|---------|---------|---------|
| **QPS** | 1K | 10K | 50K | 100K+ |
| **Redirect p50** | 30ms | 15ms | 10ms | 5ms |
| **Redirect p99** | 100ms | 50ms | 30ms | 20ms |
| **Cache hit rate** | 60% | 80% | 90% | 95% |
| **DB connections** | 100 | 500 | 2000 | 10000+ |
| **Servers** | 1 | 3-5 | 10-20 | 50+ |
| **Regions** | 1 | 1 | 2 | 3+ |

---

## 🎯 Summary

### Công Nghệ Chính

1. **NestJS** - Framework, easy to scale
2. **TypeScript** - Type safety, shared code
3. **pnpm + TurboRepo** - Monorepo management
4. **PostgreSQL** - Primary database (OLTP)
5. **Redis** - Cache + Rate limiting
6. **Snowflake** - Distributed ID generation
7. **Prisma** - Type-safe ORM
8. **ClickHouse** - Analytics (OLAP)
9. **Kafka** - Event streaming
10. **Prometheus** - Metrics
11. **Winston + ELK** - Logging
12. **OpenTelemetry** - Tracing

### Migration Path

```
Sprint 1 → Sprint 2-3 → 6 months → 12-18 months
─────────────────────────────────────────────
Single     Horizontal   Database    Microservices
Server     Scaling      Replicas    Multi-Region
(1K QPS)   (10K QPS)    (50K QPS)   (100K+ QPS)
```

### Key Principles

1. **Start Simple** - Single server first
2. **Measure First** - Add complexity when needed
3. **Horizontal Scaling** - Stateless services
4. **Cache Aggressively** - Multi-tier caching
5. **Async Everything** - Use queues for background work
6. **Monitor Always** - Metrics, logs, traces

---

Bạn cần tôi detail thêm phần nào?
