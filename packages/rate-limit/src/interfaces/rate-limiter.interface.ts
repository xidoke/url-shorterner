import type { UserTier } from "@xidoke/types";

export interface RateLimitConfig {
	tier: UserTier;
	limit: number;
	windowMs: number;
}

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetAt: Date;
}

export interface RateLimitStorage {
	increment(key: string, windowMs: number): Promise<number>;
	get(key: string): Promise<number>;
	reset(key: string): Promise<void>;
}
