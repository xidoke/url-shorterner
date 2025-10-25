import { SetMetadata } from "@nestjs/common";

export const RATE_LIMIT_KEY = "rateLimit";

export interface RateLimitOptions {
	limit?: number;
	windowMs?: number;
	skipAuthenticated?: boolean;
}

export const RateLimit = (options?: RateLimitOptions) =>
	SetMetadata(RATE_LIMIT_KEY, options || {});
