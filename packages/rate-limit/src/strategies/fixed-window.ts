import { Injectable } from "@nestjs/common";
import type { UserTier } from "@xidoke/types";
import type {
	RateLimitConfig,
	RateLimitResult,
	RateLimitStorage,
} from "../interfaces/rate-limiter.interface";

@Injectable()
export class FixedWindowStrategy {
	private readonly configs: Record<UserTier, RateLimitConfig> = {
		FREE: {
			tier: "FREE",
			limit: 10, // 10 requests per hour
			windowMs: 60 * 60 * 1000, // 1 hour
		},
		PAID: {
			tier: "PAID",
			limit: 1000, // 1000 requests per hour
			windowMs: 60 * 60 * 1000,
		},
		ENTERPRISE: {
			tier: "ENTERPRISE",
			limit: Number.MAX_SAFE_INTEGER, // Unlimited
			windowMs: 60 * 60 * 1000,
		},
	};

	constructor(private storage: RateLimitStorage) {}

	async checkLimit(
		identifier: string,
		tier: UserTier,
	): Promise<RateLimitResult> {
		const config = this.configs[tier];
		const key = this.generateKey(identifier, tier);

		const currentCount = await this.storage.increment(key, config.windowMs);

		const allowed = currentCount <= config.limit;
		const remaining = Math.max(0, config.limit - currentCount);
		const resetAt = new Date(Date.now() + config.windowMs);

		return {
			allowed,
			remaining,
			resetAt,
		};
	}

	private generateKey(identifier: string, tier: UserTier): string {
		const window = Math.floor(Date.now() / this.configs[tier].windowMs);
		return `rate:${tier}:${identifier}:${window}`;
	}

	getConfig(tier: UserTier): RateLimitConfig {
		return this.configs[tier];
	}
}
