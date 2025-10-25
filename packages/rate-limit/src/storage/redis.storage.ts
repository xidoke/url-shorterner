import { Injectable, Logger } from "@nestjs/common";
import Redis from "ioredis";
import type { RateLimitStorage } from "../interfaces/rate-limiter.interface";

@Injectable()
export class RedisStorage implements RateLimitStorage {
	private readonly logger = new Logger(RedisStorage.name);
	private redis: Redis;

	constructor() {
		this.redis = new Redis({
			host: process.env.REDIS_HOST || "localhost",
			port: Number.parseInt(process.env.REDIS_PORT || "6379", 10),
			password: process.env.REDIS_PASSWORD,
			db: Number.parseInt(process.env.REDIS_DB || "0", 10),
			retryStrategy(times) {
				const delay = Math.min(times * 50, 2000);
				return delay;
			},
		});

		this.redis.on("error", (err) => {
			this.logger.error(`Redis error: ${err.message}`);
		});

		this.redis.on("connect", () => {
			this.logger.log("Redis connected");
		});
	}

	async increment(key: string, windowMs: number): Promise<number> {
		const ttlSeconds = Math.ceil(windowMs / 1000);

		const pipeline = this.redis.pipeline();
		pipeline.incr(key);
		pipeline.expire(key, ttlSeconds);

		const results = await pipeline.exec();

		if (!results || !results[0] || results[0][1] === null) {
			throw new Error("Failed to increment rate limit counter");
		}

		return results[0][1] as number;
	}

	async get(key: string): Promise<number> {
		const value = await this.redis.get(key);
		return value ? Number.parseInt(value, 10) : 0;
	}

	async reset(key: string): Promise<void> {
		await this.redis.del(key);
	}

	async disconnect(): Promise<void> {
		await this.redis.quit();
	}
}
