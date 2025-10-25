import { Controller, Get } from "@nestjs/common";
import { Public } from "@xidoke/auth";
import { PrismaService } from "../database/prisma.service";
import { MetricsService } from "./metrics.service";

/**
 * Health Check Controller
 * All endpoints are public (no authentication required)
 */
@Controller()
@Public()
export class HealthController {
	constructor(
		private readonly prisma: PrismaService,
		private readonly metrics: MetricsService,
	) {}

	/**
	 * Basic health check
	 */
	@Get("health")
	async health() {
		return {
			status: "ok",
			timestamp: new Date().toISOString(),
		};
	}

	/**
	 * Readiness check (includes database)
	 */
	@Get("health/ready")
	async ready() {
		try {
			// Check database connection
			await this.prisma.$queryRaw`SELECT 1`;

			return {
				status: "ready",
				database: "connected",
				timestamp: new Date().toISOString(),
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			return {
				status: "not ready",
				database: "disconnected",
				error: errorMessage,
				timestamp: new Date().toISOString(),
			};
		}
	}

	/**
	 * Liveness check
	 */
	@Get("health/live")
	async live() {
		return {
			status: "alive",
			timestamp: new Date().toISOString(),
		};
	}

	/**
	 * Prometheus metrics endpoint
	 */
	@Get("metrics")
	async getMetrics() {
		return this.metrics.getMetrics();
	}
}
