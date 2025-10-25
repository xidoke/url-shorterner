# URL Shortener - Architecture V2 (Scalable)

> Cấu trúc cải tiến dựa trên monorepo-api-scalable-structure.md

## 📐 Cấu Trúc Đề Xuất

### Current (Sprint 1) vs Proposed (Sprint 2+)

```
Current Structure                    →    Proposed Structure
─────────────────────────────────────────────────────────────
packages/
├── database/                        →    packages/
├── shared/                               ├── database/
└── typescript-config/                    │   ├── prisma/
                                          │   ├── repositories/    # NEW
                                          │   └── replication/     # NEW
                                          │
                                          ├── auth/                # NEW - Priority 1
                                          │   ├── strategies/
                                          │   ├── guards/
                                          │   ├── decorators/
                                          │   └── rbac/
                                          │
                                          ├── rate-limit/          # NEW - Priority 1
                                          │   ├── guards/
                                          │   ├── storage/
                                          │   └── strategies/
                                          │
                                          ├── cache/               # ENHANCE
                                          │   ├── providers/       # Redis, Memory
                                          │   ├── decorators/      # @Cacheable
                                          │   └── strategies/      # Cache-aside, Write-through
                                          │
                                          ├── queue/               # NEW - Priority 2
                                          │   ├── providers/       # BullMQ
                                          │   ├── decorators/
                                          │   └── interfaces/
                                          │
                                          ├── monitoring/          # ENHANCE
                                          │   ├── metrics/         # Prometheus
                                          │   ├── tracing/         # OpenTelemetry
                                          │   └── logging/         # Winston
                                          │
                                          ├── api-standards/       # NEW - Priority 1
                                          │   ├── errors/
                                          │   ├── responses/
                                          │   └── validation/
                                          │
                                          ├── websocket/           # NEW - Priority 3
                                          │   ├── gateways/
                                          │   └── adapters/
                                          │
                                          ├── types/               # RENAME from shared
                                          ├── config/              # ENHANCE
                                          └── utils/               # ENHANCE
```

## 🎯 Sprint 2 Implementation Plan

### Phase 1: Authentication & Security (Week 1-2)

#### 1.1. Create Auth Package

```bash
packages/auth/
├── src/
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   └── api-key.strategy.ts
│   │
│   ├── guards/
│   │   ├── auth.guard.ts              # JWT authentication
│   │   ├── roles.guard.ts             # Role-based access
│   │   └── permissions.guard.ts       # Permission-based access
│   │
│   ├── decorators/
│   │   ├── current-user.decorator.ts  # Extract user from request
│   │   ├── roles.decorator.ts         # @Roles('admin')
│   │   └── public.decorator.ts        # @Public() - skip auth
│   │
│   ├── rbac/
│   │   ├── role.service.ts
│   │   ├── permission.service.ts
│   │   └── role-permission.map.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── token.service.ts
│   │   └── password.service.ts
│   │
│   └── index.ts
└── package.json
```

**Implementation:**

```typescript
// packages/auth/src/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor() {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: process.env.JWT_SECRET,
		});
	}

	async validate(payload: any) {
		return {
			id: payload.sub,
			email: payload.email,
			tier: payload.tier,
		};
	}
}

// packages/auth/src/guards/auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {
	constructor(private reflector: Reflector) {
		super();
	}

	canActivate(context: ExecutionContext) {
		// Check if route is public
		const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
		if (isPublic) return true;

		return super.canActivate(context);
	}
}

// packages/auth/src/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const Public = () => SetMetadata('isPublic', true);

// packages/auth/src/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// packages/auth/src/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
		if (!requiredRoles) return true;

		const request = context.switchToHttp().getRequest();
		const user = request.user;

		return requiredRoles.some((role) => user.tier === role);
	}
}
```

**Usage in Controllers:**

```typescript
// apps/api/src/modules/links/links.controller.ts
import { AuthGuard, Roles, RolesGuard, CurrentUser } from '@xidoke/auth';

@Controller('api/v1/links')
@UseGuards(AuthGuard, RolesGuard) // Apply globally
export class LinksController {
	@Post()
	@Roles('PAID', 'ENTERPRISE') // Only paid users
	async create(
		@Body() dto: CreateLinkDto,
		@CurrentUser() user: User, // Extract user from JWT
	) {
		return this.linksService.create(dto, user.id);
	}

	@Get(':shortCode/analytics')
	@Roles('ENTERPRISE') // Only enterprise users
	async getAnalytics(@Param('shortCode') shortCode: string) {
		return this.analyticsService.getStats(shortCode);
	}

	@Get('public')
	@Public() // Skip authentication
	async getPublicLinks() {
		return this.linksService.findPublic();
	}
}
```

#### 1.2. Create Rate Limit Package

```bash
packages/rate-limit/
├── src/
│   ├── guards/
│   │   └── rate-limit.guard.ts
│   │
│   ├── storage/
│   │   ├── redis.storage.ts
│   │   └── memory.storage.ts
│   │
│   ├── strategies/
│   │   ├── fixed-window.ts
│   │   ├── sliding-window.ts
│   │   └── token-bucket.ts
│   │
│   ├── decorators/
│   │   └── rate-limit.decorator.ts
│   │
│   ├── interfaces/
│   │   └── rate-limiter.interface.ts
│   │
│   └── index.ts
└── package.json
```

**Implementation:**

```typescript
// packages/rate-limit/src/decorators/rate-limit.decorator.ts
import { SetMetadata } from '@nestjs/common';

export interface RateLimitOptions {
	points: number; // Number of requests
	duration: number; // Time window in seconds
	blockDuration?: number; // Block duration after limit exceeded
}

export const RateLimit = (options: RateLimitOptions) =>
	SetMetadata('rateLimit', options);

// packages/rate-limit/src/guards/rate-limit.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisStorage } from '../storage/redis.storage';
import { TooManyRequestsException } from '@nestjs/common';

@Injectable()
export class RateLimitGuard implements CanActivate {
	constructor(
		private reflector: Reflector,
		private storage: RedisStorage,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const options = this.reflector.get<RateLimitOptions>(
			'rateLimit',
			context.getHandler(),
		);

		if (!options) return true;

		const request = context.switchToHttp().getRequest();
		const user = request.user;

		// Use user ID if authenticated, otherwise use IP
		const identifier = user ? `user:${user.id}` : `ip:${request.ip}`;
		const key = `rate_limit:${identifier}:${request.path}`;

		const count = await this.storage.increment(key, options.duration);

		if (count > options.points) {
			throw new TooManyRequestsException('Rate limit exceeded');
		}

		return true;
	}
}

// packages/rate-limit/src/storage/redis.storage.ts
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisStorage {
	constructor(private redis: Redis) {}

	async increment(key: string, ttl: number): Promise<number> {
		const multi = this.redis.multi();
		multi.incr(key);
		multi.expire(key, ttl);
		const results = await multi.exec();

		return results[0][1] as number;
	}

	async reset(key: string): Promise<void> {
		await this.redis.del(key);
	}
}
```

**Usage:**

```typescript
// apps/api/src/modules/links/links.controller.ts
import { RateLimit, RateLimitGuard } from '@xidoke/rate-limit';

@Controller('api/v1/links')
@UseGuards(AuthGuard, RateLimitGuard)
export class LinksController {
	@Post()
	@RateLimit({ points: 10, duration: 3600 }) // 10 requests per hour
	async create(@Body() dto: CreateLinkDto, @CurrentUser() user: User) {
		return this.linksService.create(dto, user.id);
	}

	@Get()
	@RateLimit({ points: 100, duration: 60 }) // 100 requests per minute
	async findAll(@Query() query: QueryDto) {
		return this.linksService.findAll(query);
	}
}
```

#### 1.3. Create API Standards Package

```bash
packages/api-standards/
├── src/
│   ├── errors/
│   │   ├── error-codes.ts
│   │   ├── error-handler.ts
│   │   └── custom-exceptions.ts
│   │
│   ├── responses/
│   │   ├── api-response.ts
│   │   └── pagination.dto.ts
│   │
│   ├── validation/
│   │   └── custom-validators.ts
│   │
│   ├── filters/
│   │   └── http-exception.filter.ts
│   │
│   └── index.ts
└── package.json
```

**Implementation:**

```typescript
// packages/api-standards/src/errors/error-codes.ts
export enum ErrorCode {
	// Authentication (1xxx)
	INVALID_CREDENTIALS = 1001,
	TOKEN_EXPIRED = 1002,
	UNAUTHORIZED = 1003,

	// Rate Limiting (2xxx)
	RATE_LIMIT_EXCEEDED = 2001,

	// Validation (3xxx)
	INVALID_INPUT = 3001,
	INVALID_URL = 3002,
	SHORT_CODE_TAKEN = 3003,

	// Resources (4xxx)
	LINK_NOT_FOUND = 4001,
	USER_NOT_FOUND = 4002,

	// Server (5xxx)
	INTERNAL_ERROR = 5001,
	SERVICE_UNAVAILABLE = 5002,
}

// packages/api-standards/src/responses/api-response.ts
export class ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: {
		code: ErrorCode;
		message: string;
		details?: any;
	};
	meta?: {
		timestamp: string;
		path: string;
		pagination?: {
			page: number;
			pageSize: number;
			total: number;
			totalPages: number;
		};
	};

	static success<T>(data: T, meta?: any): ApiResponse<T> {
		return {
			success: true,
			data,
			meta: {
				timestamp: new Date().toISOString(),
				...meta,
			},
		};
	}

	static error(code: ErrorCode, message: string, details?: any): ApiResponse<never> {
		return {
			success: false,
			error: { code, message, details },
			meta: {
				timestamp: new Date().toISOString(),
			},
		};
	}
}

// packages/api-standards/src/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '../responses/api-response';
import { ErrorCode } from '../errors/error-codes';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
	catch(exception: HttpException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const status = exception.getStatus();
		const exceptionResponse = exception.getResponse();

		const errorCode = (exceptionResponse as any).code || ErrorCode.INTERNAL_ERROR;
		const message = exception.message;

		response.status(status).json(
			ApiResponse.error(errorCode, message, {
				statusCode: status,
			}),
		);
	}
}
```

**Usage:**

```typescript
// apps/api/src/modules/links/links.service.ts
import { ApiResponse, ErrorCode } from '@xidoke/api-standards';
import { NotFoundException, ConflictException } from '@nestjs/common';

export class LinksService {
	async create(dto: CreateLinkDto, userId: bigint) {
		// Check if short code exists
		if (await this.repository.findByShortCode(dto.customAlias)) {
			throw new ConflictException({
				code: ErrorCode.SHORT_CODE_TAKEN,
				message: 'This short code is already taken',
				details: { shortCode: dto.customAlias },
			});
		}

		const link = await this.repository.create(/* ... */);
		return ApiResponse.success(this.formatResponse(link));
	}

	async findOne(id: bigint) {
		const link = await this.repository.findById(id);

		if (!link) {
			throw new NotFoundException({
				code: ErrorCode.LINK_NOT_FOUND,
				message: 'Link not found',
				details: { id: id.toString() },
			});
		}

		return ApiResponse.success(this.formatResponse(link));
	}
}
```

### Phase 2: Database Optimization (Week 3)

#### 2.1. Add Repository Pattern

```typescript
// packages/database/src/repositories/base.repository.ts
export abstract class BaseRepository<T> {
	constructor(protected prisma: PrismaService) {}

	abstract getModel(): any;

	async findById(id: bigint): Promise<T | null> {
		return this.getModel().findUnique({ where: { id } });
	}

	async findMany(where?: any, options?: any): Promise<T[]> {
		return this.getModel().findMany({ where, ...options });
	}

	async create(data: any): Promise<T> {
		return this.getModel().create({ data });
	}

	async update(id: bigint, data: any): Promise<T> {
		return this.getModel().update({ where: { id }, data });
	}

	async delete(id: bigint): Promise<T> {
		return this.getModel().delete({ where: { id } });
	}
}

// apps/api/src/modules/links/links.repository.ts
import { BaseRepository } from '@xidoke/database';

export class LinksRepository extends BaseRepository<Link> {
	getModel() {
		return this.prisma.link;
	}

	// Custom methods
	async findByShortCode(shortCode: string): Promise<Link | null> {
		return this.prisma.link.findUnique({
			where: { shortCode },
		});
	}

	async findActiveByUser(userId: bigint, pagination: PaginationDto) {
		return this.prisma.link.findMany({
			where: {
				userId,
				status: 'ACTIVE',
			},
			skip: (pagination.page - 1) * pagination.pageSize,
			take: pagination.pageSize,
			orderBy: { createdAt: 'desc' },
		});
	}
}
```

#### 2.2. Database Replication (Optional - for high load)

```typescript
// packages/database/src/replication/database.service.ts
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
				db: { url: process.env.DATABASE_URL },
			},
		});

		this.replicas = process.env.DATABASE_REPLICA_URL
			? [
					new PrismaClient({
						datasources: {
							db: { url: process.env.DATABASE_REPLICA_URL },
						},
					}),
			  ]
			: [this.master]; // Fallback to master if no replica
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
```

### Phase 3: Enhanced Caching (Week 3)

```typescript
// packages/cache/src/decorators/cacheable.decorator.ts
export function Cacheable(options: { ttl: number; key?: string }) {
	return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		const originalMethod = descriptor.value;

		descriptor.value = async function (...args: any[]) {
			const cacheKey = options.key || `${propertyKey}:${JSON.stringify(args)}`;
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
export class LinksService {
	@Cacheable({ ttl: 300, key: 'link:{{shortCode}}' })
	async findByShortCode(shortCode: string) {
		return this.repository.findByShortCode(shortCode);
	}
}
```

## 📊 Migration Strategy

### Step 1: Refactor Current Code (Week 1)
- Move auth logic to `packages/auth`
- Move rate limiting to `packages/rate-limit`
- Standardize API responses with `packages/api-standards`

### Step 2: Add New Packages (Week 2-3)
- Implement Queue package
- Enhance Monitoring package
- Add WebSocket package (if needed)

### Step 3: Test & Optimize (Week 4)
- Load testing
- Performance optimization
- Documentation

## 🎯 Benefits of New Structure

1. **Better Separation of Concerns**
   - Each package has single responsibility
   - Easy to test in isolation
   - Can be extracted to separate services later

2. **Code Reusability**
   - Packages can be shared across multiple apps
   - Consistent patterns across codebase

3. **Scalability**
   - Easy to add new features
   - Clear migration path to microservices
   - Database replication ready

4. **Developer Experience**
   - Clear conventions
   - Type-safe across packages
   - Easy onboarding

5. **Production Ready**
   - Proper error handling
   - Rate limiting
   - Monitoring & observability
   - Security best practices

## 📝 Next Steps

1. Review this architecture proposal
2. Decide which packages to implement first (recommend: auth, rate-limit, api-standards)
3. Create implementation tickets
4. Start refactoring in Sprint 2

Would you like me to start implementing any of these packages?
