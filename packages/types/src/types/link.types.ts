/**
 * Link-related type definitions
 */

export type LinkStatus = "ACTIVE" | "DELETED" | "EXPIRED" | "DISABLED";

export type UserTier = "FREE" | "PAID" | "ENTERPRISE";

export interface Link {
	id: bigint;
	shortCode: string;
	longUrl: string;
	userId: bigint;
	collectionId?: bigint;
	title?: string;
	description?: string;
	status: LinkStatus;
	version: number;
	clickCount: bigint;
	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
	expiresAt?: Date;
}

export interface CreateLinkInput {
	longUrl: string;
	customAlias?: string;
	collectionId?: number;
	title?: string;
	description?: string;
	expiresAt?: Date;
}

export interface UpdateLinkInput {
	title?: string;
	description?: string;
	status?: LinkStatus;
	expiresAt?: Date;
}

export interface LinkResponse {
	id: string;
	shortCode: string;
	shortUrl: string;
	longUrl: string;
	title?: string;
	description?: string;
	status: LinkStatus;
	clickCount: string;
	createdAt: string;
	updatedAt: string;
	expiresAt?: string;
}
