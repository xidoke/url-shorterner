import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { LinkEntity } from "./entities/link.entity";

/**
 * Links Repository
 * Database operations for links
 */
@Injectable()
export class LinksRepository {
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Create a new link
	 */
	async create(data: {
		id: bigint;
		shortCode: string;
		longUrl: string;
		userId: bigint;
		collectionId?: bigint | null;
		title?: string;
		description?: string;
		expiresAt?: Date | null;
	}): Promise<LinkEntity> {
		const link = await this.prisma.link.create({
			data,
		});

		return new LinkEntity(link);
	}

	/**
	 * Find link by ID
	 */
	async findById(id: bigint): Promise<LinkEntity | null> {
		const link = await this.prisma.link.findUnique({
			where: { id },
		});

		return link ? new LinkEntity(link) : null;
	}

	/**
	 * Find link by short code
	 */
	async findByShortCode(shortCode: string): Promise<LinkEntity | null> {
		const link = await this.prisma.link.findUnique({
			where: { shortCode },
		});

		return link ? new LinkEntity(link) : null;
	}

	/**
	 * Find all links for a user (with pagination)
	 */
	async findByUser(
		userId: bigint,
		page = 1,
		pageSize = 10,
	): Promise<{ links: LinkEntity[]; total: number }> {
		const [links, total] = await Promise.all([
			this.prisma.link.findMany({
				where: {
					userId,
					status: { not: "DELETED" },
				},
				orderBy: { createdAt: "desc" },
				skip: (page - 1) * pageSize,
				take: pageSize,
			}),
			this.prisma.link.count({
				where: {
					userId,
					status: { not: "DELETED" },
				},
			}),
		]);

		return {
			links: links.map((link) => new LinkEntity(link)),
			total,
		};
	}

	/**
	 * Update a link
	 */
	async update(
		id: bigint,
		data: {
			title?: string;
			description?: string;
			status?: "ACTIVE" | "DELETED" | "EXPIRED" | "DISABLED";
			expiresAt?: Date;
		},
	): Promise<LinkEntity> {
		const link = await this.prisma.link.update({
			where: { id },
			data,
		});

		return new LinkEntity(link);
	}

	/**
	 * Soft delete a link
	 */
	async softDelete(id: bigint): Promise<void> {
		await this.prisma.link.update({
			where: { id },
			data: {
				status: "DELETED",
				deletedAt: new Date(),
			},
		});
	}

	/**
	 * Increment click count
	 */
	async incrementClickCount(id: bigint): Promise<void> {
		await this.prisma.link.update({
			where: { id },
			data: {
				clickCount: { increment: 1 },
			},
		});
	}
}
