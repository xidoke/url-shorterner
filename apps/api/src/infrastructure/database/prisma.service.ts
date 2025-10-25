import {
	Injectable,
	type OnModuleDestroy,
	type OnModuleInit,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/**
 * Prisma Service
 * Manages database connection lifecycle
 */
@Injectable()
export class PrismaService
	extends PrismaClient
	implements OnModuleInit, OnModuleDestroy
{
	constructor() {
		super({
			log:
				process.env.NODE_ENV === "development"
					? ["query", "info", "warn", "error"]
					: ["error"],
		});
	}

	async onModuleInit() {
		await this.$connect();
	}

	async onModuleDestroy() {
		await this.$disconnect();
	}

	/**
	 * Clean database (for testing)
	 */
	async cleanDatabase() {
		if (process.env.NODE_ENV === "production") {
			throw new Error("Cannot clean database in production");
		}

		// Delete in correct order to respect foreign key constraints
		await this.$transaction([
			this.idempotencyKey.deleteMany(),
			this.link.deleteMany(),
			this.collection.deleteMany(),
			this.user.deleteMany(),
		]);
	}
}
