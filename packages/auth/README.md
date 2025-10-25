# @xidoke/auth

Authentication and authorization package for the URL Shortener monorepo.

## Features

- **JWT Authentication**: Passport.js-based JWT strategy
- **Guards**: AuthGuard and RolesGuard for route protection
- **Decorators**: @Public(), @Roles(), @CurrentUser()
- **Services**: Password hashing (bcrypt), token generation/verification

## Installation

This is an internal workspace package. Add to your app's dependencies:

```json
{
	"dependencies": {
		"@xidoke/auth": "workspace:*"
	}
}
```

## Usage

### 1. Import AuthModule

```typescript
import { Module } from "@nestjs/common";
import { AuthModule } from "@xidoke/auth";

@Module({
	imports: [AuthModule],
})
export class AppModule {}
```

### 2. Protect Routes with Guards

```typescript
import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard, RolesGuard, Roles, CurrentUser, AuthenticatedUser } from "@xidoke/auth";

@Controller("api/v1/links")
@UseGuards(AuthGuard, RolesGuard)
export class LinksController {
	@Get()
	@Roles("PAID", "ENTERPRISE")
	async getLinks(@CurrentUser() user: AuthenticatedUser) {
		// Only PAID/ENTERPRISE users can access
		return { userId: user.id, tier: user.tier };
	}
}
```

### 3. Public Routes

```typescript
import { Public } from "@xidoke/auth";

@Controller("redirect")
export class RedirectController {
	@Get(":shortCode")
	@Public() // Skip authentication
	async redirect(@Param("shortCode") shortCode: string) {
		// ...
	}
}
```

### 4. Password Hashing

```typescript
import { PasswordService } from "@xidoke/auth";

@Injectable()
export class UsersService {
	constructor(private passwordService: PasswordService) {}

	async createUser(email: string, password: string) {
		const hashedPassword = await this.passwordService.hash(password);
		// Save to database
	}

	async validatePassword(password: string, hashedPassword: string) {
		return this.passwordService.compare(password, hashedPassword);
	}
}
```

### 5. Token Generation

```typescript
import { TokenService } from "@xidoke/auth";

@Injectable()
export class AuthService {
	constructor(private tokenService: TokenService) {}

	async login(userId: bigint, email: string, tier: UserTier) {
		const accessToken = this.tokenService.generateAccessToken(userId, email, tier);
		const refreshToken = this.tokenService.generateRefreshToken(userId);

		return { accessToken, refreshToken };
	}
}
```

## Environment Variables

```bash
JWT_SECRET=your-secret-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=7d
```

## Architecture

```
packages/auth/
├── src/
│   ├── strategies/
│   │   └── jwt.strategy.ts         # Passport JWT strategy
│   ├── guards/
│   │   ├── auth.guard.ts           # JWT authentication guard
│   │   └── roles.guard.ts          # Role-based access control
│   ├── decorators/
│   │   ├── public.decorator.ts     # @Public() - skip auth
│   │   ├── roles.decorator.ts      # @Roles() - require tiers
│   │   └── current-user.decorator.ts # @CurrentUser() - inject user
│   ├── services/
│   │   ├── password.service.ts     # Bcrypt password hashing
│   │   └── token.service.ts        # JWT token generation
│   ├── interfaces/
│   │   └── jwt-payload.interface.ts # JWT payload types
│   ├── auth.module.ts              # NestJS module
│   └── index.ts                    # Public exports
└── package.json
```

## Dependencies

- `@nestjs/jwt`: JWT token handling
- `@nestjs/passport`: Passport.js integration
- `passport-jwt`: JWT authentication strategy
- `bcrypt`: Password hashing
- `@xidoke/types`: Shared types (UserTier)
- `@xidoke/database`: Database access (if needed)

## License

Private package for internal use only.
