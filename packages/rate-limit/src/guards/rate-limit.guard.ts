import {
	type CanActivate,
	type ExecutionContext,
	HttpException,
	HttpStatus,
	Injectable,
	Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { UserTier } from "@xidoke/types";
import {
	RATE_LIMIT_KEY,
	type RateLimitOptions,
} from "../decorators/rate-limit.decorator";
import { FixedWindowStrategy } from "../strategies/fixed-window";

interface AuthenticatedUser {
	id: bigint;
	tier: UserTier;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
	private readonly logger = new Logger(RateLimitGuard.name);

	constructor(
		private reflector: Reflector,
		private strategy: FixedWindowStrategy,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const options = this.reflector.getAllAndOverride<RateLimitOptions>(
			RATE_LIMIT_KEY,
			[context.getHandler(), context.getClass()],
		);

		if (!options) {
			return true; // No rate limit configured
		}

		const request = context.switchToHttp().getRequest();
		const response = context.switchToHttp().getResponse();
		const user = request.user as AuthenticatedUser | undefined;

		// Skip if authenticated and option is set
		if (options.skipAuthenticated && user) {
			return true;
		}

		// Determine identifier and tier
		const identifier = user ? user.id.toString() : this.getIpAddress(request);
		const tier = user?.tier || "FREE";

		// Check rate limit
		const result = await this.strategy.checkLimit(identifier, tier);

		// Set rate limit headers
		response.setHeader(
			"X-RateLimit-Limit",
			this.strategy.getConfig(tier).limit,
		);
		response.setHeader("X-RateLimit-Remaining", result.remaining);
		response.setHeader("X-RateLimit-Reset", result.resetAt.toISOString());

		if (!result.allowed) {
			this.logger.warn(`Rate limit exceeded for ${identifier} (tier: ${tier})`);

			throw new HttpException(
				{
					statusCode: HttpStatus.TOO_MANY_REQUESTS,
					message: "Rate limit exceeded",
					error: "Too Many Requests",
					retryAfter: result.resetAt.toISOString(),
				},
				HttpStatus.TOO_MANY_REQUESTS,
			);
		}

		return true;
	}

	private getIpAddress(request: any): string {
		return (
			request.headers["x-forwarded-for"]?.split(",")[0] ||
			request.headers["x-real-ip"] ||
			request.connection?.remoteAddress ||
			request.socket?.remoteAddress ||
			"unknown"
		);
	}
}
