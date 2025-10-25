import { Injectable, Logger } from "@nestjs/common";
import type { RateLimitStorage } from "../interfaces/rate-limiter.interface";

interface CacheEntry {
	count: number;
	expiresAt: number;
}

@Injectable()
export class MemoryStorage implements RateLimitStorage {
	private readonly logger = new Logger(MemoryStorage.name);
	private cache = new Map<string, CacheEntry>();

	constructor() {
		// Cleanup expired entries every minute
		setInterval(() => this.cleanup(), 60000);
	}

	async increment(key: string, windowMs: number): Promise<number> {
		const now = Date.now();
		const entry = this.cache.get(key);

		if (!entry || entry.expiresAt <= now) {
			// Create new entry
			this.cache.set(key, {
				count: 1,
				expiresAt: now + windowMs,
			});
			return 1;
		}

		// Increment existing entry
		entry.count++;
		return entry.count;
	}

	async get(key: string): Promise<number> {
		const now = Date.now();
		const entry = this.cache.get(key);

		if (!entry || entry.expiresAt <= now) {
			return 0;
		}

		return entry.count;
	}

	async reset(key: string): Promise<void> {
		this.cache.delete(key);
	}

	private cleanup(): void {
		const now = Date.now();
		let cleaned = 0;

		for (const [key, entry] of this.cache.entries()) {
			if (entry.expiresAt <= now) {
				this.cache.delete(key);
				cleaned++;
			}
		}

		if (cleaned > 0) {
			this.logger.debug(`Cleaned up ${cleaned} expired rate limit entries`);
		}
	}
}
