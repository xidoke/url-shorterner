# Current Sprint - Sprint 2: Authentication & Security

> **Status:** Planning
> **Duration:** 2 weeks (Nov 1-15, 2025)
> **Previous:** [Sprint 1 - Foundation](./sprints/sprint-1.md) ✅ COMPLETED

---

## 🎯 Sprint Goal

Build authentication, authorization, and security infrastructure to enable:
- User registration & login
- JWT-based authentication
- Role-based access control (RBAC)
- Rate limiting per user tier
- API standardization

---

## 📋 Sprint Backlog

### Priority 1: Authentication Package (Week 1)

#### P1.1: Create @xidoke/auth Package
**Story:** As a developer, I need a reusable auth package for all apps

**Tasks:**
- [ ] Create `packages/auth/` structure
- [ ] Implement JWT strategy (Passport.js)
- [ ] Create AuthGuard with JWT verification
- [ ] Create RolesGuard for RBAC
- [ ] Create decorators: @Public(), @Roles(), @CurrentUser()
- [ ] Write unit tests for auth package

**Acceptance Criteria:**
- ✅ JWT tokens generated on login
- ✅ Protected routes require valid token
- ✅ @Public() decorator bypasses auth
- ✅ @Roles('PAID') restricts by tier
- ✅ Test coverage >80%

**Files to Create:**
```
packages/auth/
├── src/
│   ├── strategies/jwt.strategy.ts
│   ├── guards/auth.guard.ts
│   ├── guards/roles.guard.ts
│   ├── decorators/public.decorator.ts
│   ├── decorators/roles.decorator.ts
│   ├── decorators/current-user.decorator.ts
│   ├── services/auth.service.ts
│   ├── services/token.service.ts
│   └── index.ts
└── package.json
```

**Dependencies:**
```json
{
  "@nestjs/jwt": "^10.2.0",
  "@nestjs/passport": "^10.0.3",
  "passport-jwt": "^4.0.1",
  "bcrypt": "^5.1.1"
}
```

---

#### P1.2: User Authentication Endpoints
**Story:** As a user, I can register and login to create short links

**Tasks:**
- [ ] Create AuthController with register/login/logout
- [ ] Implement password hashing (bcrypt)
- [ ] Generate JWT tokens with user payload
- [ ] Refresh token mechanism
- [ ] Email verification flow (optional)

**API Endpoints:**
```typescript
POST   /api/v1/auth/register    # Create new user
POST   /api/v1/auth/login       # Get JWT token
POST   /api/v1/auth/refresh     # Refresh token
POST   /api/v1/auth/logout      # Invalidate token
GET    /api/v1/auth/me          # Get current user
```

**Acceptance Criteria:**
- ✅ User can register with email + password
- ✅ Login returns JWT access + refresh tokens
- ✅ Password stored as bcrypt hash (not plain text)
- ✅ Duplicate email rejected
- ✅ Invalid credentials return 401

---

#### P1.3: Protect Existing Routes
**Story:** As a system, I enforce authentication on all link operations

**Tasks:**
- [ ] Add @UseGuards(AuthGuard) to LinksController
- [ ] Extract user from JWT in @CurrentUser()
- [ ] Update LinksService to use authenticated userId
- [ ] Add ownership check for update/delete operations

**Acceptance Criteria:**
- ✅ Creating link requires authentication
- ✅ Listing links shows only user's own links
- ✅ Updating/deleting link checks ownership
- ✅ Redirect endpoint remains public (@Public())

---

### Priority 2: Rate Limiting Package (Week 1-2)

#### P2.1: Create @xidoke/rate-limit Package
**Story:** As a system, I prevent abuse with rate limiting

**Tasks:**
- [ ] Create `packages/rate-limit/` structure
- [ ] Implement Redis-based rate limiter
- [ ] Create RateLimitGuard with tier-based limits
- [ ] Create @RateLimit() decorator
- [ ] Fallback to memory storage if Redis unavailable

**Files to Create:**
```
packages/rate-limit/
├── src/
│   ├── guards/rate-limit.guard.ts
│   ├── storage/redis.storage.ts
│   ├── storage/memory.storage.ts
│   ├── strategies/fixed-window.ts
│   ├── decorators/rate-limit.decorator.ts
│   └── index.ts
└── package.json
```

**Rate Limits by Tier:**
```typescript
FREE: {
  createLink: 10 per hour,
  apiCalls: 100 per minute
}
PAID: {
  createLink: 1000 per hour,
  apiCalls: 10000 per minute
}
ENTERPRISE: {
  createLink: unlimited,
  apiCalls: unlimited
}
```

**Acceptance Criteria:**
- ✅ Rate limit enforced per user + tier
- ✅ Anonymous users limited by IP
- ✅ 429 status code when limit exceeded
- ✅ Response includes X-RateLimit-* headers
- ✅ Redis failure falls back to memory

---

#### P2.2: Apply Rate Limits
**Story:** As an API, I protect against abuse

**Tasks:**
- [ ] Add @RateLimit() to sensitive endpoints
- [ ] Apply stricter limits to public endpoints
- [ ] Monitor rate limit hits (metrics)

**Acceptance Criteria:**
- ✅ Creating links rate limited
- ✅ Login endpoint rate limited (prevent brute force)
- ✅ Redirect endpoint NOT rate limited (performance)

---

### Priority 3: API Standardization (Week 2)

#### P3.1: Create @xidoke/api-standards Package
**Story:** As a developer, I have consistent API responses

**Tasks:**
- [ ] Create ApiResponse wrapper class
- [ ] Standardize error codes
- [ ] Create HttpExceptionFilter
- [ ] Document error handling

**Files to Create:**
```
packages/api-standards/
├── src/
│   ├── responses/api-response.ts
│   ├── errors/error-codes.ts
│   ├── filters/http-exception.filter.ts
│   └── index.ts
└── package.json
```

**Response Format:**
```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z",
    "pagination": { ... }
  }
}

// Error
{
  "success": false,
  "error": {
    "code": 1001,
    "message": "Invalid credentials",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

**Acceptance Criteria:**
- ✅ All endpoints return consistent format
- ✅ Error codes documented
- ✅ Stack traces hidden in production
- ✅ Validation errors properly formatted

---

### Priority 4: Redis Integration (Week 2)

#### P4.1: Setup Redis Service
**Story:** As a system, I use Redis for L2 cache and rate limiting

**Tasks:**
- [ ] Add ioredis dependency
- [ ] Create RedisModule
- [ ] Configure Redis connection
- [ ] Add health check for Redis
- [ ] Docker Compose for local development

**Acceptance Criteria:**
- ✅ Redis connects on startup
- ✅ Connection pooling configured
- ✅ Health check endpoint shows Redis status
- ✅ Docker Compose includes Redis

---

#### P4.2: Implement L2 Cache
**Story:** As a redirect service, I use Redis for fast lookups

**Tasks:**
- [ ] Update RedirectService to check Redis before DB
- [ ] Implement cache warming on link creation
- [ ] Add cache invalidation on update/delete
- [ ] Monitor cache hit rates

**Acceptance Criteria:**
- ✅ Redirect checks Redis before PostgreSQL
- ✅ Cache hit rate >70% after warmup
- ✅ Updates invalidate cache
- ✅ Metrics show L1 + L2 hit rates

---

## 📊 Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Authentication working | ✅ | Manual testing + E2E tests |
| Rate limiting active | ✅ | Hit rate limit, get 429 |
| Redis cache hit rate | >70% | Prometheus metrics |
| API response time | <50ms | Load testing |
| Test coverage | >80% | Jest coverage report |
| Documentation complete | ✅ | Review API docs |

---

## 🧪 Testing Plan

### Unit Tests
- [ ] Auth package: JWT strategy, guards, decorators
- [ ] Rate limit package: Redis storage, guards
- [ ] API standards: Response formatting, error handling

### Integration Tests
- [ ] Auth flow: register → login → protected endpoint
- [ ] Rate limiting: exceed limit → get 429
- [ ] Redis cache: create link → cache hit on redirect

### E2E Tests
- [ ] Full user journey: register → create link → redirect
- [ ] Rate limit enforcement
- [ ] Error handling

---

## 📦 Dependencies to Add

```json
{
  "dependencies": {
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "passport-jwt": "^4.0.1",
    "bcrypt": "^5.1.1",
    "ioredis": "^5.3.2",
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/passport-jwt": "^4.0.1"
  }
}
```

---

## 🚧 Blockers & Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Redis not available | High | Fallback to memory storage |
| JWT secret management | High | Use env vars, secrets manager |
| Rate limit bypass | Medium | Monitor metrics, adjust limits |
| Performance degradation | Medium | Load testing before deploy |

---

## 📅 Daily Standup Questions

**What did I do yesterday?**
- List completed tasks

**What will I do today?**
- Pick next task from backlog

**Any blockers?**
- Redis setup issues?
- Auth flow unclear?
- Need help with testing?

---

## 🎯 Definition of Done

A task is "done" when:
- ✅ Code written and reviewed
- ✅ Unit tests pass (>80% coverage)
- ✅ Integration tests pass
- ✅ Documentation updated
- ✅ No console errors/warnings
- ✅ Biome checks pass
- ✅ Merged to main branch

---

## 📝 Notes & Learnings

### Week 1 Notes
- [To be filled during sprint]

### Week 2 Notes
- [To be filled during sprint]

### Retrospective Topics
- What went well?
- What could be improved?
- Action items for next sprint

---

## 🔗 Related Documents

- [Sprint 1 Complete](./sprints/sprint-1.md) - What we built
- [Tech Stack](../architecture/tech-stack.md) - Technologies used
- [System Design](../architecture/system-design.md) - Architecture overview
- [Architecture V2 Proposal](./architecture-v2-proposal.md) - Future packages

---

**Sprint Start:** TBD
**Sprint End:** TBD
**Last Updated:** 2025-10-25
