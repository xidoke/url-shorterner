import type { UserTier } from "@xidoke/types";

export interface JwtPayload {
	sub: string; // User ID (as string)
	email: string;
	tier: UserTier;
	iat?: number; // Issued at
	exp?: number; // Expiration
}

export interface AuthenticatedUser {
	id: bigint;
	email: string;
	tier: UserTier;
}
