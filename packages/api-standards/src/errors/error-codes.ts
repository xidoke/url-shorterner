export enum ErrorCode {
	// Authentication errors (1000-1999)
	INVALID_CREDENTIALS = 1001,
	TOKEN_EXPIRED = 1002,
	TOKEN_INVALID = 1003,
	UNAUTHORIZED = 1004,
	FORBIDDEN = 1005,

	// Rate limiting errors (2000-2999)
	RATE_LIMIT_EXCEEDED = 2001,

	// Validation errors (3000-3999)
	VALIDATION_FAILED = 3001,
	INVALID_URL = 3002,
	INVALID_SHORT_CODE = 3003,
	CUSTOM_ALIAS_TAKEN = 3004,

	// Resource errors (4000-4999)
	LINK_NOT_FOUND = 4001,
	USER_NOT_FOUND = 4002,
	COLLECTION_NOT_FOUND = 4003,

	// Business logic errors (5000-5999)
	LINK_EXPIRED = 5001,
	LINK_DISABLED = 5002,
	OWNERSHIP_REQUIRED = 5003,
	TIER_LIMIT_EXCEEDED = 5004,

	// System errors (9000-9999)
	INTERNAL_SERVER_ERROR = 9001,
	DATABASE_ERROR = 9002,
	CACHE_ERROR = 9003,
}

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
	// Authentication
	[ErrorCode.INVALID_CREDENTIALS]: "Invalid email or password",
	[ErrorCode.TOKEN_EXPIRED]: "Access token has expired",
	[ErrorCode.TOKEN_INVALID]: "Invalid access token",
	[ErrorCode.UNAUTHORIZED]: "Authentication required",
	[ErrorCode.FORBIDDEN]: "Insufficient permissions",

	// Rate limiting
	[ErrorCode.RATE_LIMIT_EXCEEDED]:
		"Rate limit exceeded, please try again later",

	// Validation
	[ErrorCode.VALIDATION_FAILED]: "Validation failed",
	[ErrorCode.INVALID_URL]: "Invalid URL format",
	[ErrorCode.INVALID_SHORT_CODE]: "Invalid short code format",
	[ErrorCode.CUSTOM_ALIAS_TAKEN]: "Custom alias already taken",

	// Resources
	[ErrorCode.LINK_NOT_FOUND]: "Link not found",
	[ErrorCode.USER_NOT_FOUND]: "User not found",
	[ErrorCode.COLLECTION_NOT_FOUND]: "Collection not found",

	// Business logic
	[ErrorCode.LINK_EXPIRED]: "Link has expired",
	[ErrorCode.LINK_DISABLED]: "Link has been disabled",
	[ErrorCode.OWNERSHIP_REQUIRED]: "You do not own this resource",
	[ErrorCode.TIER_LIMIT_EXCEEDED]: "Tier limit exceeded, please upgrade",

	// System
	[ErrorCode.INTERNAL_SERVER_ERROR]: "Internal server error",
	[ErrorCode.DATABASE_ERROR]: "Database error occurred",
	[ErrorCode.CACHE_ERROR]: "Cache error occurred",
};
