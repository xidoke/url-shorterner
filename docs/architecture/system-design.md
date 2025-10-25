# System Design - URL Shortener

> High-level architecture for scalable URL shortening service

---

## 🎯 System Requirements

### Functional Requirements

1. **URL Shortening**
   - Create short URL from long URL
   - Custom aliases (optional)
   - Expiration dates (optional)
   - Collections/folders

2. **URL Redirect**
   - Fast redirect (<20ms p50)
   - Status tracking (active/expired/disabled)
   - Click tracking

3. **Analytics**
   - Click counts
   - Geographic distribution
   - Device/browser stats
   - Time-series data

4. **User Management**
   - Authentication (JWT)
   - Tier-based access (FREE, PAID, ENTERPRISE)
   - Rate limiting per tier

### Non-Functional Requirements

| Requirement | Target | Current |
|-------------|--------|---------|
| Availability | 99.9% | TBD |
| Latency (p50) | <20ms | TBD |
| Latency (p99) | <50ms | TBD |
| Throughput | 100K QPS | 1K QPS |
| Data Durability | 99.999% | ✅ |
| Scalability | 100M links | 0 |

---

## 🏗️ High-Level Architecture

### Current Architecture (Sprint 1)

```
                    ┌─────────────────┐
                    │   Client App    │
                    │  (Web/Mobile)   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   NestJS API    │
                    │   (Port 3000)   │
                    └────────┬────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
                ▼            ▼            ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │   L1     │  │ Snowflake│  │  Prisma  │
        │  Cache   │  │    ID    │  │   ORM    │
        │ (Local)  │  │Generator │  │          │
        └──────────┘  └──────────┘  └────┬─────┘
                                          │
                                          ▼
                                  ┌──────────────┐
                                  │ PostgreSQL   │
                                  │   Database   │
                                  └──────────────┘
```

### Target Architecture (Sprint 2-3)

```
                    ┌─────────────────┐
                    │   Client App    │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │ Load Balancer   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌─────────┐    ┌─────────┐    ┌─────────┐
        │ API-1   │    │ API-2   │    │ API-3   │
        │ (L1)    │    │ (L1)    │    │ (L1)    │
        └────┬────┘    └────┬────┘    └────┬────┘
             │              │              │
             └──────────────┼──────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
        ┌──────────────┐        ┌──────────────┐
        │ Redis Cluster│        │    Kafka     │
        │   (L2 Cache) │        │   (Events)   │
        └──────┬───────┘        └──────┬───────┘
               │                       │
               │                       ▼
               │               ┌──────────────┐
               │               │  Analytics   │
               │               │   Worker     │
               │               └──────┬───────┘
               │                      │
               │                      ▼
               │              ┌──────────────┐
               │              │ ClickHouse   │
               │              │  (Analytics) │
               │              └──────────────┘
               │
               ▼
        ┌──────────────┐
        │  PostgreSQL  │
        │   (Master)   │
        └──────┬───────┘
               │
        ┌──────┴───────┐
        │              │
        ▼              ▼
   ┌────────┐    ┌────────┐
   │Replica1│    │Replica2│
   └────────┘    └────────┘
```

---

## 🔄 Data Flow

### 1. Create Short Link Flow

```
Client
  │
  ├─→ POST /api/v1/links { longUrl: "..." }
  │
  ▼
API Server
  │
  ├─→ 1. Validate URL
  ├─→ 2. Check authentication
  ├─→ 3. Check rate limit (Redis)
  ├─→ 4. Generate Snowflake ID
  ├─→ 5. Encode to Base62
  ├─→ 6. Save to PostgreSQL
  ├─→ 7. Warm L2 cache (Redis)
  ├─→ 8. Publish event (Kafka) - async
  │
  ▼
Response: { shortCode: "abc123", shortUrl: "short.url/abc123" }
```

### 2. Redirect Flow (Performance Critical)

```
Client
  │
  ├─→ GET /abc123
  │
  ▼
API Server
  │
  ├─→ L1 Cache check (Local Memory)
  │   ├─ Hit? → Return longUrl (0.5ms)
  │   └─ Miss ↓
  │
  ├─→ L2 Cache check (Redis)
  │   ├─ Hit? → Warm L1 → Return longUrl (3ms)
  │   └─ Miss ↓
  │
  ├─→ Database query (PostgreSQL)
  │   ├─ Found? → Warm L1, L2 → Return longUrl (20ms)
  │   └─ Not found → 404
  │
  ├─→ Track click (async, fire-and-forget)
  │   └─→ Publish to Kafka → Analytics Worker → ClickHouse
  │
  ▼
Response: 302 Redirect to longUrl
```

### 3. Analytics Flow

```
Click Event
  │
  ├─→ Published to Kafka topic: "click-events"
  │
  ▼
Analytics Worker (Consumer)
  │
  ├─→ Enrich with GeoIP data
  ├─→ Parse user agent
  ├─→ Batch insert to ClickHouse
  ├─→ Update Redis counters
  │
  ▼
ClickHouse (Materialized Views)
  │
  ├─→ Aggregate by day/country/device
  └─→ Pre-compute common queries
```

---

## 📊 Database Design

### PostgreSQL (Transactional)

**Purpose:** CRUD operations, user data, link metadata

**Tables:**
- `users` - User accounts
- `links` - Short link mappings
- `collections` - Link organization
- `idempotency_keys` - Request deduplication

**Capacity:** 10K-50K QPS with replicas

### Redis (Cache + Rate Limiting)

**Purpose:** L2 cache, rate limiting, session storage

**Key Patterns:**
```
link:{shortCode}           → Link data (TTL: 1h-7d)
rate:user:{userId}:{hour}  → Rate limit counter (TTL: 1h)
session:{sessionId}        → User session (TTL: 30d)
stats:link:{id}:clicks     → Real-time counters
```

**Capacity:** 100K+ ops/sec per cluster

### ClickHouse (Analytics)

**Purpose:** OLAP, time-series analytics

**Tables:**
- `click_events_raw` - Raw click events (partitioned by month)
- `link_stats_daily` - Materialized view (aggregated by day)
- `link_stats_hourly` - Materialized view (real-time)

**Capacity:** 100M+ rows/sec insert, billions of rows for queries

---

## 🔐 Security

### Authentication & Authorization

```typescript
// JWT Authentication
@Controller('api/v1/links')
@UseGuards(AuthGuard, RolesGuard)
export class LinksController {
  @Post()
  @Roles('PAID', 'ENTERPRISE')
  async create(@CurrentUser() user: User) {
    // Only authenticated PAID/ENTERPRISE users
  }
}
```

### Rate Limiting

```typescript
// Per-user limits based on tier
FREE:       10 links/hour, 100 redirects/minute
PAID:       1000 links/hour, 10000 redirects/minute
ENTERPRISE: Unlimited
```

### Input Validation

```typescript
// DTO validation with class-validator
export class CreateLinkDto {
  @IsUrl()
  @MaxLength(2048)
  longUrl: string;

  @IsOptional()
  @Matches(/^[a-zA-Z0-9-_]{3,20}$/)
  customAlias?: string;
}
```

---

## 📈 Scalability Strategy

### Horizontal Scaling

```
1 Server    → 1K QPS
3 Servers   → 10K QPS
10 Servers  → 50K QPS
100 Servers → 500K+ QPS
```

**How:**
- Stateless API servers (no session affinity needed)
- Load balancer (Round-robin, Least connections)
- Shared state in Redis/PostgreSQL

### Database Scaling

**Phase 1: Connection Pooling**
```typescript
DATABASE_URL="postgresql://...?connection_limit=100"
```

**Phase 2: Read Replicas**
```
Master (Write) → Replica 1, 2, 3 (Read)
```

**Phase 3: Sharding** (100M+ links)
```
Shard by shortCode first character:
- Shard 0-9: Links starting with 0-9
- Shard A-M: Links starting with A-M
- Shard N-Z: Links starting with N-Z
```

### Cache Scaling

**Phase 1: Single Redis** (10K QPS)
```
Redis Standalone → 100K ops/sec
```

**Phase 2: Redis Cluster** (100K QPS)
```
3 Masters + 3 Replicas → 600K ops/sec
```

**Phase 3: Multi-Region** (1M+ QPS)
```
US, EU, APAC: Independent Redis clusters
```

---

## 🎯 Performance Optimization

### 1. Caching Strategy

```
Hit Rate Targets:
- L1 (Local):  20-30% (hot keys)
- L2 (Redis):  60-70% (warm keys)
- L3 (DB):     10% (cold keys)

Overall cache hit rate: 90%+
```

### 2. Database Optimization

```sql
-- Indexes for fast lookup
CREATE INDEX idx_links_short_code ON links(short_code);
CREATE INDEX idx_links_user_created ON links(user_id, created_at DESC);

-- Partial index for active links
CREATE INDEX idx_links_active ON links(short_code)
WHERE status = 'ACTIVE';
```

### 3. Async Processing

```
Click Tracking: Fire-and-forget → Kafka → Background worker
Email Sending: Queue → Background worker
Analytics: Batch processing every 5 minutes
```

---

## 🔍 Monitoring & Observability

### Metrics (Prometheus)

```
redirect_requests_total{status="success|not_found"}
redirect_latency_seconds{quantile="0.5|0.95|0.99"}
cache_hit_rate{tier="l1|l2|l3"}
database_connections{state="active|idle"}
```

### Logs (Winston + ELK)

```json
{
  "level": "info",
  "message": "Redirect",
  "shortCode": "abc123",
  "latency": 15,
  "cacheHit": "l2",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Tracing (OpenTelemetry)

```
Trace: GET /abc123
├─ Span: Redis GET (2ms)
├─ Span: Kafka PUBLISH (1ms)
└─ Total: 5ms
```

---

## 🚀 Migration Path

### Current → Target

```
Sprint 1:  Single server + PostgreSQL
  ↓
Sprint 2:  + Redis + Authentication
  ↓
Sprint 3:  + Kafka + ClickHouse
  ↓
6 months:  + Load balancer + Replicas
  ↓
12 months: + Microservices + Multi-region
```

### Service Extraction Order

1. **Analytics Service** - Independent data processing
2. **Redirect Service** - Performance critical path
3. **Auth Service** - Shared authentication
4. **Link Service** - CRUD operations

---

## 📝 Key Design Decisions

See [Architecture Decision Records](../decisions/) for details:

1. **[Monorepo](../decisions/001-monorepo.md)** - Why monorepo over polyrepo
2. **[Snowflake IDs](../decisions/002-snowflake-ids.md)** - Why Snowflake over UUID/Auto-increment
3. **[Multi-tier Cache](../decisions/003-multi-tier-cache.md)** - Why L1 + L2 + L3
4. **[Event-Driven](../decisions/004-event-driven.md)** - Why Kafka for analytics

---

**Last Updated:** 2025-10-25
**Status:** Sprint 1 Complete, Sprint 2 Planning
