import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";

/**
 * Users Service
 * Business logic for user operations
 */
@Injectable()
export class UsersService {
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Find user by ID
	 */
	async findById(id: bigint) {
		const user = await this.prisma.user.findUnique({
			where: { id },
			select: {
				id: true,
				email: true,
				name: true,
				tier: true,
				createdAt: true,
			},
		});

		if (!user) {
			throw new NotFoundException("User not found");
		}

		return {
			id: user.id.toString(),
			email: user.email,
			name: user.name,
			tier: user.tier,
			createdAt: user.createdAt.toISOString(),
		};
	}

	/**
	 * Find user by email
	 */
	async findByEmail(email: string) {
		const user = await this.prisma.user.findUnique({
			where: { email },
		});

		return user;
	}

	/**
	 * Create a new user
	 */
	async create(data: { email: string; passwordHash: string; name?: string }) {
		const user = await this.prisma.user.create({
			data,
		});

		return user;
	}
}
