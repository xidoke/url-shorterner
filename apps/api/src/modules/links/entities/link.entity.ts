import type { Link as PrismaLink } from "@prisma/client";

/**
 * Link Entity
 * Represents a shortened link
 */
export class LinkEntity implements PrismaLink {
	id!: bigint;
	shortCode!: string;
	longUrl!: string;
	userId!: bigint;
	collectionId!: bigint | null;
	title!: string | null;
	description!: string | null;
	status!: "ACTIVE" | "DELETED" | "EXPIRED" | "DISABLED";
	version!: number;
	clickCount!: bigint;
	createdAt!: Date;
	updatedAt!: Date;
	deletedAt!: Date | null;
	expiresAt!: Date | null;

	constructor(partial: Partial<LinkEntity>) {
		Object.assign(this, partial);
	}

	/**
	 * Check if link is expired
	 */
	isExpired(): boolean {
		if (!this.expiresAt) return false;
		return new Date() > this.expiresAt;
	}

	/**
	 * Check if link is active and accessible
	 */
	isAccessible(): boolean {
		return this.status === "ACTIVE" && !this.isExpired();
	}
}
