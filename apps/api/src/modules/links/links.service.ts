import {
	ConflictException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { isValidUrl } from "@xidoke/types";
import { LocalCacheService } from "../../infrastructure/cache/local-cache.service";
import { Base62Service } from "../../infrastructure/id-generator/base62.service";
import { SnowflakeService } from "../../infrastructure/id-generator/snowflake.service";
import type { CreateLinkDto } from "./dto/create-link.dto";
import type { UpdateLinkDto } from "./dto/update-link.dto";
import type {
	LinkResponse,
	PaginatedLinksResponse,
} from "./interfaces/link.interface";
import { LinksRepository } from "./links.repository";

/**
 * Links Service
 * Business logic for link operations
 */
@Injectable()
export class LinksService {
	constructor(
		private readonly repository: LinksRepository,
		private readonly snowflake: SnowflakeService,
		private readonly base62: Base62Service,
		private readonly cache: LocalCacheService,
	) {}

	/**
	 * Create a new short link
	 */
	async create(dto: CreateLinkDto, userId: bigint): Promise<LinkResponse> {
		// Validate URL
		if (!isValidUrl(dto.longUrl)) {
			throw new ConflictException("Invalid URL format");
		}

		// Generate ID and short code
		const id = this.snowflake.generateId();
		const shortCode = dto.customAlias || this.base62.encode(id);

		// Check if custom alias is already taken
		if (dto.customAlias) {
			const existing = await this.repository.findByShortCode(dto.customAlias);
			if (existing) {
				throw new ConflictException("Short code already taken");
			}
		}

		// Create link
		const link = await this.repository.create({
			id,
			shortCode,
			longUrl: dto.longUrl,
			userId,
			collectionId: dto.collectionId ? BigInt(dto.collectionId) : null,
			title: dto.title,
			description: dto.description,
			expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
		});

		return this.formatResponse(link);
	}

	/**
	 * Find all links for a user
	 */
	async findAllByUser(
		userId: bigint,
		page = 1,
		pageSize = 10,
	): Promise<PaginatedLinksResponse> {
		const { links, total } = await this.repository.findByUser(
			userId,
			page,
			pageSize,
		);

		return {
			data: links.map((link) => this.formatResponse(link)),
			pagination: {
				page,
				pageSize,
				total,
				totalPages: Math.ceil(total / pageSize),
			},
		};
	}

	/**
	 * Find a link by ID
	 */
	async findOne(id: bigint, userId: bigint): Promise<LinkResponse> {
		const link = await this.repository.findById(id);

		if (!link) {
			throw new NotFoundException("Link not found");
		}

		// Check ownership
		if (link.userId !== userId) {
			throw new ForbiddenException("You do not own this link");
		}

		return this.formatResponse(link);
	}

	/**
	 * Update a link
	 */
	async update(
		id: bigint,
		dto: UpdateLinkDto,
		userId: bigint,
	): Promise<LinkResponse> {
		const link = await this.repository.findById(id);

		if (!link) {
			throw new NotFoundException("Link not found");
		}

		// Check ownership
		if (link.userId !== userId) {
			throw new ForbiddenException("You do not own this link");
		}

		// Update link
		const updated = await this.repository.update(id, {
			title: dto.title,
			description: dto.description,
			status: dto.status,
			expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
		});

		// Invalidate cache
		this.cache.delete(`link:${link.shortCode}`);

		return this.formatResponse(updated);
	}

	/**
	 * Delete a link (soft delete)
	 */
	async remove(id: bigint, userId: bigint): Promise<{ message: string }> {
		const link = await this.repository.findById(id);

		if (!link) {
			throw new NotFoundException("Link not found");
		}

		// Check ownership
		if (link.userId !== userId) {
			throw new ForbiddenException("You do not own this link");
		}

		// Soft delete
		await this.repository.softDelete(id);

		// Invalidate cache
		this.cache.delete(`link:${link.shortCode}`);

		return { message: "Link deleted successfully" };
	}

	/**
	 * Get link statistics
	 */
	async getStats(id: bigint, userId: bigint) {
		const link = await this.repository.findById(id);

		if (!link) {
			throw new NotFoundException("Link not found");
		}

		// Check ownership
		if (link.userId !== userId) {
			throw new ForbiddenException("You do not own this link");
		}

		// TODO: Implement analytics integration
		return {
			linkId: id.toString(),
			shortCode: link.shortCode,
			totalClicks: link.clickCount.toString(),
			// TODO: Add more analytics data
		};
	}

	/**
	 * Format link entity to response
	 */
	private formatResponse(link: any): LinkResponse {
		return {
			id: link.id.toString(),
			shortCode: link.shortCode,
			shortUrl: `${process.env.BASE_URL || "http://localhost:3000"}/${link.shortCode}`,
			longUrl: link.longUrl,
			title: link.title,
			description: link.description,
			status: link.status,
			clickCount: link.clickCount.toString(),
			createdAt: link.createdAt.toISOString(),
			updatedAt: link.updatedAt.toISOString(),
			expiresAt: link.expiresAt?.toISOString(),
		};
	}
}
