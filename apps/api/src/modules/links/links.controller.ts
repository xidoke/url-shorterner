import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
	Query,
} from "@nestjs/common";
import type { CreateLinkDto } from "./dto/create-link.dto";
import type { UpdateLinkDto } from "./dto/update-link.dto";
import { LinksService } from "./links.service";

/**
 * Links Controller
 * Handles CRUD operations for links
 */
@Controller("api/v1/links")
export class LinksController {
	constructor(private readonly linksService: LinksService) {}

	/**
	 * Create a new short link
	 */
	@Post()
	async create(@Body() createLinkDto: CreateLinkDto) {
		// TODO: Add authentication and rate limiting
		// TODO: Get user from request context
		const userId = 1n; // Placeholder
		return this.linksService.create(createLinkDto, userId);
	}

	/**
	 * Get all links for current user
	 */
	@Get()
	async findAll(@Query("page") page = "1", @Query("pageSize") pageSize = "10") {
		// TODO: Get user from request context
		const userId = 1n; // Placeholder
		return this.linksService.findAllByUser(
			userId,
			Number.parseInt(page, 10),
			Number.parseInt(pageSize, 10),
		);
	}

	/**
	 * Get a specific link by ID
	 */
	@Get(":id")
	async findOne(@Param("id") id: string) {
		// TODO: Get user from request context
		const userId = 1n; // Placeholder
		return this.linksService.findOne(BigInt(id), userId);
	}

	/**
	 * Update a link
	 */
	@Put(":id")
	async update(@Param("id") id: string, @Body() updateLinkDto: UpdateLinkDto) {
		// TODO: Get user from request context
		const userId = 1n; // Placeholder
		return this.linksService.update(BigInt(id), updateLinkDto, userId);
	}

	/**
	 * Delete a link (soft delete)
	 */
	@Delete(":id")
	async remove(@Param("id") id: string) {
		// TODO: Get user from request context
		const userId = 1n; // Placeholder
		return this.linksService.remove(BigInt(id), userId);
	}

	/**
	 * Get link statistics
	 */
	@Get(":id/stats")
	async getStats(@Param("id") id: string) {
		// TODO: Get user from request context
		const userId = 1n; // Placeholder
		return this.linksService.getStats(BigInt(id), userId);
	}
}
