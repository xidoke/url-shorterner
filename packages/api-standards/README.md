# @xidoke/api-standards

Standardized API responses and error handling for the URL Shortener monorepo.

## Features

- **Consistent Response Format**: All API responses follow the same structure
- **Standardized Error Codes**: Well-defined error codes for all error types
- **Custom Exceptions**: Type-safe exception classes with automatic HTTP status mapping
- **HTTP Exception Filter**: Global exception handler with logging
- **Transform Interceptor**: Automatically wraps responses in standard format
- **Pagination Support**: Built-in pagination DTO and response builder

## Installation

This is an internal workspace package. Add to your app's dependencies:

```json
{
	"dependencies": {
		"@xidoke/api-standards": "workspace:*"
	}
}
```

## Usage

### 1. Apply Global Filter and Interceptor

```typescript
import { NestFactory } from "@nestjs/core";
import { HttpExceptionFilter, TransformInterceptor } from "@xidoke/api-standards";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Global exception filter
	app.useGlobalFilters(new HttpExceptionFilter());

	// Global transform interceptor
	app.useGlobalInterceptors(new TransformInterceptor());

	await app.listen(3000);
}
bootstrap();
```

### 2. Return Data from Controllers

```typescript
import { Controller, Get } from "@nestjs/common";

@Controller("api/v1/links")
export class LinksController {
	@Get()
	async getLinks() {
		// Return plain data - will be wrapped automatically
		return {
			links: [
				{ id: 1, shortCode: "abc123", longUrl: "https://example.com" },
			],
		};
	}
}
```

Response:
```json
{
	"success": true,
	"data": {
		"links": [
			{ "id": 1, "shortCode": "abc123", "longUrl": "https://example.com" }
		]
	},
	"meta": {
		"timestamp": "2025-01-15T10:30:00Z"
	}
}
```

### 3. Use Response Builder for Pagination

```typescript
import { ResponseBuilder, PaginationDto } from "@xidoke/api-standards";

@Controller("api/v1/links")
export class LinksController {
	@Get()
	async getLinks(@Query() pagination: PaginationDto) {
		const links = await this.linksService.findAll(pagination.skip, pagination.take);
		const total = await this.linksService.count();

		return ResponseBuilder.paginated(links, pagination.page, pagination.limit, total);
	}
}
```

Response:
```json
{
	"success": true,
	"data": [...],
	"meta": {
		"timestamp": "2025-01-15T10:30:00Z",
		"pagination": {
			"page": 1,
			"limit": 10,
			"total": 100,
			"totalPages": 10,
			"hasNext": true,
			"hasPrev": false
		}
	}
}
```

### 4. Throw Custom Exceptions

```typescript
import { ResourceNotFoundException, ErrorCode } from "@xidoke/api-standards";

@Injectable()
export class LinksService {
	async findByShortCode(shortCode: string) {
		const link = await this.prisma.link.findUnique({ where: { shortCode } });

		if (!link) {
			throw new ResourceNotFoundException(ErrorCode.LINK_NOT_FOUND);
		}

		return link;
	}
}
```

Error response:
```json
{
	"success": false,
	"error": {
		"code": 4001,
		"message": "Link not found"
	},
	"meta": {
		"timestamp": "2025-01-15T10:30:00Z"
	}
}
```

### 5. Use AppException for Custom Errors

```typescript
import { AppException, ErrorCode } from "@xidoke/api-standards";

throw new AppException(
	ErrorCode.CUSTOM_ALIAS_TAKEN,
	"The alias 'mylink' is already taken",
	{ suggestedAliases: ["mylink1", "mylink2"] },
);
```

## Error Codes

Error codes are organized by category:

| Range | Category |
|-------|----------|
| 1000-1999 | Authentication errors |
| 2000-2999 | Rate limiting errors |
| 3000-3999 | Validation errors |
| 4000-4999 | Resource errors |
| 5000-5999 | Business logic errors |
| 9000-9999 | System errors |

See [error-codes.ts](src/errors/error-codes.ts) for the full list.

## Exception Classes

- `AppException` - Base exception class
- `AuthenticationException` - For authentication failures
- `RateLimitException` - For rate limit exceeded
- `ValidationException` - For validation errors
- `ResourceNotFoundException` - For missing resources
- `OwnershipException` - For ownership violations

## Architecture

```
packages/api-standards/
├── src/
│   ├── responses/
│   │   ├── api-response.ts      # Response builder & types
│   │   └── pagination.dto.ts    # Pagination DTO
│   ├── errors/
│   │   ├── error-codes.ts       # Standardized error codes
│   │   └── custom-exceptions.ts # Exception classes
│   ├── filters/
│   │   └── http-exception.filter.ts # Global exception filter
│   ├── interceptors/
│   │   └── transform.interceptor.ts # Response transformer
│   └── index.ts                 # Public exports
└── package.json
```

## Dependencies

- `@nestjs/common`: Core NestJS functionality
- `class-validator`: DTO validation
- `class-transformer`: DTO transformation
- `@xidoke/types`: Shared types

## License

Private package for internal use only.
