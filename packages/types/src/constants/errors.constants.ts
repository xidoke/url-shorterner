/**
 * Error codes and messages
 */

export const ERROR_CODES = {
	// Link errors
	LINK_NOT_FOUND: "LINK_NOT_FOUND",
	LINK_EXPIRED: "LINK_EXPIRED",
	LINK_DISABLED: "LINK_DISABLED",
	SHORT_CODE_TAKEN: "SHORT_CODE_TAKEN",
	INVALID_SHORT_CODE: "INVALID_SHORT_CODE",
	INVALID_URL: "INVALID_URL",

	// User errors
	USER_NOT_FOUND: "USER_NOT_FOUND",
	UNAUTHORIZED: "UNAUTHORIZED",
	FORBIDDEN: "FORBIDDEN",
	EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",

	// Rate limiting
	RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

	// System errors
	INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
	SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;

export const ERROR_MESSAGES = {
	[ERROR_CODES.LINK_NOT_FOUND]: "Link not found",
	[ERROR_CODES.LINK_EXPIRED]: "This link has expired",
	[ERROR_CODES.LINK_DISABLED]: "This link has been disabled",
	[ERROR_CODES.SHORT_CODE_TAKEN]: "This short code is already taken",
	[ERROR_CODES.INVALID_SHORT_CODE]: "Invalid short code format",
	[ERROR_CODES.INVALID_URL]: "Invalid URL format",

	[ERROR_CODES.USER_NOT_FOUND]: "User not found",
	[ERROR_CODES.UNAUTHORIZED]: "Unauthorized access",
	[ERROR_CODES.FORBIDDEN]: "Forbidden access",
	[ERROR_CODES.EMAIL_ALREADY_EXISTS]: "Email already exists",

	[ERROR_CODES.RATE_LIMIT_EXCEEDED]:
		"Rate limit exceeded. Please try again later",

	[ERROR_CODES.INTERNAL_SERVER_ERROR]: "Internal server error",
	[ERROR_CODES.SERVICE_UNAVAILABLE]: "Service temporarily unavailable",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
