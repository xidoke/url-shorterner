import { Injectable } from "@nestjs/common";

/**
 * Local In-Memory Cache Service (L1 Cache)
 * Simple LRU cache for hot keys with very short TTL
 *
 * For production, consider using node-cache or lru-cache npm packages
 */
@Injectable()
export class LocalCacheService {
	private cache: Map<string, { value: unknown; expiresAt: number }>;
	private readonly maxSize = 1000;
	private readonly defaultTTL = 50; // 50ms

	constructor() {
		this.cache = new Map();
	}

	/**
	 * Get value from cache
	 */
	get<T>(key: string): T | null {
		const item = this.cache.get(key);

		if (!item) {
			return null;
		}

		// Check if expired
		if (Date.now() > item.expiresAt) {
			this.cache.delete(key);
			return null;
		}

		return item.value as T;
	}

	/**
	 * Set value in cache
	 */
	set(key: string, value: unknown, ttlMs = this.defaultTTL): void {
		// Implement LRU eviction if cache is full
		if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
			// Remove oldest entry (first in Map)
			const firstKey = this.cache.keys().next().value as string | undefined;
			if (firstKey) {
				this.cache.delete(firstKey);
			}
		}

		this.cache.set(key, {
			value,
			expiresAt: Date.now() + ttlMs,
		});
	}

	/**
	 * Delete value from cache
	 */
	delete(key: string): void {
		this.cache.delete(key);
	}

	/**
	 * Clear all cache
	 */
	clear(): void {
		this.cache.clear();
	}

	/**
	 * Get cache size
	 */
	size(): number {
		return this.cache.size;
	}
}
