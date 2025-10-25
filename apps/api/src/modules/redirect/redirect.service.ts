import {
	HttpException,
	HttpStatus,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { LocalCacheService } from "../../infrastructure/cache/local-cache.service";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { MetricsService } from "../../infrastructure/monitoring/metrics.service";

interface CachedLink {
	longUrl: string;
	linkId: bigint;
	status: string;
}

/**
 * Redirect Service
 * Handles short code resolution and click tracking
 * Performance critical - uses multi-tier caching
 */
@Injectable()
export class RedirectService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly cache: LocalCacheService,
		private readonly metrics: MetricsService,
	) {}

	/**
	 * Resolve short code to long URL
	 * Uses L1 (local) cache for hot keys
	 */
	async resolveShortCode(
		shortCode: string,
	): Promise<{ longUrl: string; linkId: bigint }> {
		const startTime = Date.now();

		try {
			// L1: Check local cache (in-memory, 50ms TTL)
			const cacheKey = `link:${shortCode}`;
			const cached = this.cache.get<CachedLink>(cacheKey);

			if (cached) {
				this.metrics.cacheHit("l1");
				this.metrics.redirectLatency(Date.now() - startTime);
				return { longUrl: cached.longUrl, linkId: cached.linkId };
			}

			// L2: Database lookup (TODO: Add Redis L2 cache)
			this.metrics.cacheMiss();
			const link = await this.prisma.link.findUnique({
				where: { shortCode },
				select: {
					id: true,
					longUrl: true,
					status: true,
					expiresAt: true,
				},
			});

			if (!link) {
				throw new NotFoundException("Link not found");
			}

			// Check if link is expired
			if (link.expiresAt && new Date() > link.expiresAt) {
				throw new HttpException("This link has expired", HttpStatus.GONE);
			}

			// Check if link is disabled
			if (link.status === "DISABLED") {
				throw new HttpException("This link has been disabled", HttpStatus.GONE);
			}

			// Check if link is deleted
			if (link.status === "DELETED") {
				throw new NotFoundException("Link not found");
			}

			// Cache the result
			const cacheValue: CachedLink = {
				longUrl: link.longUrl,
				linkId: link.id,
				status: link.status,
			};
			this.cache.set(cacheKey, cacheValue, 50); // 50ms TTL

			this.metrics.redirectLatency(Date.now() - startTime);

			return { longUrl: link.longUrl, linkId: link.id };
		} catch (error) {
			this.metrics.redirectLatency(Date.now() - startTime);
			throw error;
		}
	}

	/**
	 * Track click event
	 * Async operation - does not block redirect
	 */
	async trackClick(
		linkId: bigint,
		metadata: {
			ipAddress: string;
			userAgent?: string;
			referer?: string;
		},
	): Promise<void> {
		try {
			// Increment click count in database
			await this.prisma.link.update({
				where: { id: linkId },
				data: {
					clickCount: { increment: 1 },
				},
			});

			// TODO: Publish click event to Kafka for analytics
			console.log("Click tracked:", {
				linkId: linkId.toString(),
				...metadata,
			});
		} catch (error) {
			// Log error but don't throw (fire-and-forget)
			console.error("Failed to track click:", error);
		}
	}
}
