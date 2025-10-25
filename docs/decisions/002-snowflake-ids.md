# ADR 002: Snowflake ID Generation

**Status:** Accepted
**Date:** 2025-10-25
**Deciders:** Development Team

---

## Context

We need a strategy for generating unique IDs for links. Requirements:
- Globally unique (distributed system)
- Sortable by creation time
- URL-safe when encoded
- High performance (no coordination)
- Support for 100M+ links

**Options Considered:**
1. **Auto-increment** (PostgreSQL SERIAL)
2. **UUID v4** (Random)
3. **UUID v7** (Time-ordered)
4. **Snowflake** (Twitter's approach)
5. **ULID** (Universally Unique Lexicographically Sortable ID)

---

## Decision

We chose **Snowflake IDs** with **Base62 encoding**.

---

## Rationale

### Why Snowflake?

#### 1. **Time-Ordered**
```
ID: 7234567890123456789
Timestamp: 2025-01-15 10:30:00
Region: 0 (US-EAST)
Worker: 42
Sequence: 123

Links created at same time have sequential IDs
Perfect for pagination, indexing
```

#### 2. **No Coordination Needed**
```typescript
// Generate locally (0.1ms)
const id = snowflake.generateId();

// vs UUID from database (10-50ms)
const id = await db.query('SELECT uuid_generate_v4()');

// vs Auto-increment (requires lock)
const id = await db.query('INSERT ... RETURNING id');
```

#### 3. **Embedded Metadata**
```typescript
const id = snowflake.generateId();

// Can extract info without database query
snowflake.extractTimestamp(id);  // 2025-01-15T10:30:00Z
snowflake.extractRegionId(id);   // 0 (US-EAST)
snowflake.extractWorkerId(id);   // 42
snowflake.extractSequence(id);   // 123

// Useful for debugging, monitoring, sharding
```

#### 4. **Scalability**
```
Bit Layout: [41 timestamp][3 region][10 worker][10 sequence]

Capacity:
- 8 regions (US, EU, APAC, etc.)
- 1024 workers per region
- 1024 IDs per millisecond per worker
= 8 billion IDs/second (overkill for URL shortener)

Real-world:
- 1 worker = 1 million IDs/second
- 10 workers = 10 million IDs/second
```

#### 5. **URL-Safe with Base62**
```typescript
// Snowflake ID
const id = 7234567890123456789n;

// Base62 encode
const shortCode = base62.encode(id);
// Result: "3D2k8Pq" (7 characters)

// URL-safe, no special characters
https://short.url/3D2k8Pq
```

---

## Implementation

### Snowflake Service

```typescript
@Injectable()
export class SnowflakeService {
  private readonly EPOCH = 1704067200000; // 2024-01-01
  private sequence = 0n;
  private lastTimestamp = 0n;

  constructor(
    @Inject('REGION_ID') private regionId: bigint,  // 0-7
    @Inject('WORKER_ID') private workerId: bigint,  // 0-1023
  ) {}

  generateId(): bigint {
    let timestamp = BigInt(Date.now()) - this.EPOCH;

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1n) & 1023n;
      if (this.sequence === 0n) {
        // Wait for next millisecond
        while (timestamp <= this.lastTimestamp) {
          timestamp = BigInt(Date.now()) - this.EPOCH;
        }
      }
    } else {
      this.sequence = 0n;
    }

    this.lastTimestamp = timestamp;

    // Combine parts
    const id = (timestamp << 23n) |
               (this.regionId << 20n) |
               (this.workerId << 10n) |
               this.sequence;

    return id;
  }
}
```

### Base62 Encoding

```typescript
@Injectable()
export class Base62Service {
  private readonly CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  encode(id: bigint): string {
    if (id === 0n) return '0000000';

    let result = '';
    while (id > 0n) {
      result = this.CHARSET[Number(id % 62n)] + result;
      id = id / 62n;
    }

    return result.padStart(7, '0'); // 7 characters
  }

  decode(shortCode: string): bigint {
    let id = 0n;
    for (const char of shortCode) {
      id = id * 62n + BigInt(this.CHARSET.indexOf(char));
    }
    return id;
  }
}
```

---

## Comparison with Alternatives

### Auto-increment

**Pros:**
- Simple
- Sequential

**Cons:**
- ❌ Single point of failure (database)
- ❌ Coordination overhead (locks)
- ❌ Predictable (security concern)
- ❌ Hard to shard

**Why Rejected:** Doesn't scale horizontally

### UUID v4 (Random)

**Pros:**
- Globally unique
- No coordination

**Cons:**
- ❌ Not sortable by time
- ❌ Bad for database indexing (random inserts)
- ❌ Large (16 bytes → 36 characters as string)

**Why Rejected:** Performance issues with indexing

### UUID v7 (Time-ordered)

**Pros:**
- Time-ordered
- Globally unique
- Standard (RFC draft)

**Cons:**
- ⚠️ Still 16 bytes (larger than needed)
- ⚠️ No embedded metadata (region, worker)
- ⚠️ Limited adoption (new standard)

**Why Not Chosen:** Snowflake more battle-tested, metadata useful

### ULID

**Pros:**
- Time-ordered
- Lexicographically sortable
- 26 characters (Crockford Base32)

**Cons:**
- ⚠️ Longer than Base62 Snowflake
- ⚠️ No embedded metadata

**Why Not Chosen:** Snowflake better for our use case

---

## Consequences

### Positive

✅ Fast ID generation (local, <1ms)
✅ No database coordination
✅ Time-ordered (good for indexing)
✅ Embedded metadata (debugging)
✅ Scales to billions of IDs
✅ Short URLs (7 characters)

### Negative

⚠️ Requires region/worker configuration
⚠️ Clock skew can cause issues (mitigated by NTP)
⚠️ Custom implementation (not standard like UUID)

### Neutral

- Need to configure REGION_ID and WORKER_ID
- BigInt support required (Node.js 10.4+)
- Slightly more complex than UUID

---

## Configuration

### Environment Variables

```bash
# Region ID (0-7)
REGION_ID=0  # US-EAST

# Worker ID (0-1023)
# Can use pod ID, instance ID, etc.
WORKER_ID=0

# Or auto-detect from hostname
WORKER_ID=$(hostname | tail -c 4 | xargs printf '%d')
```

### Kubernetes

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: url-shortener-config
data:
  REGION_ID: "0"  # US-EAST region

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  template:
    spec:
      containers:
      - name: api
        env:
        - name: REGION_ID
          valueFrom:
            configMapKeyRef:
              name: url-shortener-config
              key: REGION_ID
        - name: WORKER_ID
          valueFrom:
            fieldRef:
              fieldPath: metadata.name  # Use pod name as worker ID
```

---

## Edge Cases

### Clock Skew

**Problem:** System clock goes backwards

**Solution:**
```typescript
generateId(): bigint {
  let timestamp = BigInt(Date.now()) - this.EPOCH;

  if (timestamp < this.lastTimestamp) {
    throw new Error('Clock moved backwards!');
  }

  // ... rest of code
}
```

### Sequence Overflow

**Problem:** >1024 IDs in same millisecond

**Solution:**
```typescript
if (this.sequence === 0n) {
  // Wait for next millisecond
  while (timestamp <= this.lastTimestamp) {
    timestamp = BigInt(Date.now()) - this.EPOCH;
  }
}
```

### Worker ID Conflicts

**Problem:** Multiple instances with same worker ID

**Solution:**
- Use unique pod IDs in Kubernetes
- Use auto-scaling group instance ID
- Use database to allocate worker IDs
- Monitor duplicate IDs (very rare, detectible)

---

## Monitoring

```typescript
// Metrics to track
snowflake_ids_generated_total
snowflake_sequence_overflows_total
snowflake_clock_skew_errors_total
```

---

## Future Considerations

### If we outgrow Snowflake

**Unlikely, but possible:**

1. **UUID v7** - Standard time-ordered UUIDs
2. **Sharding** - Multiple Snowflake instances with different regions
3. **Hybrid** - Snowflake for internal, custom for public short codes

---

## References

- [Twitter's Snowflake](https://github.com/twitter-archive/snowflake/tree/snowflake-2010)
- [Instagram's ID System](https://instagram-engineering.com/sharding-ids-at-instagram-1cf5a71e5a5c)
- [Discord's Snowflake](https://discord.com/developers/docs/reference#snowflakes)

---

## Review Schedule

- **Next Review:** After 1M links generated
- **Trigger:** Performance issues or ID conflicts
