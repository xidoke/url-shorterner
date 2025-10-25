/**
 * Shared constants
 */

export * from "./errors.constants";

// Rate limiting constants
export const RATE_LIMITS = {
	FREE: {
		CREATE_LINK: 10, // per hour
		UPDATE_LINK: 20,
		DELETE_LINK: 5,
	},
	PAID: {
		CREATE_LINK: 1000,
		UPDATE_LINK: 5000,
		DELETE_LINK: 100,
	},
	ENTERPRISE: {
		CREATE_LINK: Number.POSITIVE_INFINITY,
		UPDATE_LINK: Number.POSITIVE_INFINITY,
		DELETE_LINK: Number.POSITIVE_INFINITY,
	},
} as const;

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
	HOT_LINK: 7 * 24 * 3600, // 7 days (>10k clicks)
	WARM_LINK: 24 * 3600, // 24 hours (>100 clicks)
	COLD_LINK: 3600, // 1 hour
	LOCAL_CACHE: 0.05, // 50ms
} as const;

// Short code configuration
export const SHORT_CODE = {
	MIN_LENGTH: 3,
	MAX_LENGTH: 20,
	DEFAULT_LENGTH: 7,
	CHARSET: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
} as const;
