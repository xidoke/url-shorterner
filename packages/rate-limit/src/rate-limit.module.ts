import { type DynamicModule, Global, Module } from "@nestjs/common";
import { RateLimitGuard } from "./guards/rate-limit.guard";
import type { RateLimitStorage } from "./interfaces/rate-limiter.interface";
import { MemoryStorage } from "./storage/memory.storage";
import { RedisStorage } from "./storage/redis.storage";
import { FixedWindowStrategy } from "./strategies/fixed-window";

export interface RateLimitModuleOptions {
	useRedis?: boolean;
}

@Global()
@Module({})
export class RateLimitModule {
	static forRoot(options: RateLimitModuleOptions = {}): DynamicModule {
		const storageProvider = {
			provide: "RATE_LIMIT_STORAGE",
			useClass: options.useRedis ? RedisStorage : MemoryStorage,
		};

		return {
			module: RateLimitModule,
			providers: [
				storageProvider,
				{
					provide: FixedWindowStrategy,
					useFactory: (storage: RateLimitStorage) => {
						return new FixedWindowStrategy(storage);
					},
					inject: ["RATE_LIMIT_STORAGE"],
				},
				RateLimitGuard,
			],
			exports: [FixedWindowStrategy, RateLimitGuard],
		};
	}
}
