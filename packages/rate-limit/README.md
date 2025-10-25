# @xidoke/rate-limit

Rate limiting package with Redis support for the URL Shortener monorepo.

## Features

- **Tier-based Rate Limiting**: Different limits for FREE, PAID, ENTERPRISE users
- **Multiple Storage Backends**: Redis (distributed) or Memory (single instance)
- **Fixed Window Strategy**: Simple and efficient rate limiting
- **IP-based Limiting**: Anonymous users limited by IP address
- **Automatic Headers**: X-RateLimit-* headers in responses

## Installation

This is an internal workspace package. Add to your app's dependencies:

```json
{
	"dependencies": {
		"@xidoke/rate-limit": "workspace:*"
	}
}
```

## Usage

### 1. Import RateLimitModule

```typescript
import { Module } from "@nestjs/common";
import { RateLimitModule } from "@xidoke/rate-limit";

@Module({
	imports: [
		RateLimitModule.forRoot({
			useRedis: true, // Use Redis for distributed rate limiting
		}),
	],
})
export class AppModule {}
```

### 2. Apply Rate Limiting to Routes

```typescript
import { Controller, Post, UseGuards } from "@nestjs/common";
import { RateLimitGuard, RateLimit } from "@xidoke/rate-limit";

@Controller("api/v1/links")
@UseGuards(RateLimitGuard)
export class LinksController {
	@Post()
	@RateLimit() // Apply tier-based rate limiting
	async createLink() {
		// FREE: 10/hour, PAID: 1000/hour, ENTERPRISE: unlimited
	}
}
```

### 3. Custom Rate Limits

```typescript
import { RateLimit } from "@xidoke/rate-limit";

@Controller("auth")
export class AuthController {
	@Post("login")
	@RateLimit({
		limit: 5, // 5 attempts
		windowMs: 15 * 60 * 1000, // per 15 minutes
	})
	async login() {
		// Prevent brute force attacks
	}
}
```

### 4. Skip Rate Limiting for Authenticated Users

```typescript
@Get("redirect/:shortCode")
@RateLimit({
	skipAuthenticated: true, // Only limit anonymous users
})
async redirect(@Param("shortCode") shortCode: string) {
	// ...
}
```

## Rate Limit Tiers

Default limits per tier:

| Tier | Limit | Window |
|------|-------|--------|
| FREE | 10 requests | 1 hour |
| PAID | 1000 requests | 1 hour |
| ENTERPRISE | Unlimited | - |

## Response Headers

The guard automatically sets these headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 2025-01-15T11:00:00Z
```

When limit is exceeded, returns 429 Too Many Requests:

```json
{
	"statusCode": 429,
	"message": "Rate limit exceeded",
	"error": "Too Many Requests",
	"retryAfter": "2025-01-15T11:00:00Z"
}
```

## Storage Backends

### Redis Storage (Recommended for Production)

```typescript
RateLimitModule.forRoot({ useRedis: true });
```

Environment variables:
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0
```

### Memory Storage (Development Only)

```typescript
RateLimitModule.forRoot({ useRedis: false });
```

Note: Memory storage does not work across multiple instances.

## Architecture

```
packages/rate-limit/
├── src/
│   ├── guards/
│   │   └── rate-limit.guard.ts      # Rate limiting guard
│   ├── storage/
│   │   ├── redis.storage.ts         # Redis backend
│   │   └── memory.storage.ts        # In-memory backend
│   ├── strategies/
│   │   └── fixed-window.ts          # Fixed window algorithm
│   ├── decorators/
│   │   └── rate-limit.decorator.ts  # @RateLimit() decorator
│   ├── interfaces/
│   │   └── rate-limiter.interface.ts # Type definitions
│   ├── rate-limit.module.ts         # NestJS module
│   └── index.ts                     # Public exports
└── package.json
```

## Dependencies

- `ioredis`: Redis client for distributed rate limiting
- `@xidoke/types`: Shared types (UserTier)

## License

Private package for internal use only.
