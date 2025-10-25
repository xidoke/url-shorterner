import { HttpException, HttpStatus } from "@nestjs/common";
import { ERROR_MESSAGES, ErrorCode } from "./error-codes";

export class AppException extends HttpException {
	constructor(
		public readonly errorCode: ErrorCode,
		message?: string,
		public readonly details?: any,
		statusCode?: HttpStatus,
	) {
		super(
			{
				errorCode,
				message: message || ERROR_MESSAGES[errorCode],
				details,
			},
			statusCode || AppException.getStatusCodeForErrorCode(errorCode),
		);
	}

	private static getStatusCodeForErrorCode(errorCode: ErrorCode): HttpStatus {
		// Map error codes to HTTP status codes
		if (errorCode >= 1000 && errorCode < 2000) {
			return HttpStatus.UNAUTHORIZED;
		}
		if (errorCode >= 2000 && errorCode < 3000) {
			return HttpStatus.TOO_MANY_REQUESTS;
		}
		if (errorCode >= 3000 && errorCode < 4000) {
			return HttpStatus.BAD_REQUEST;
		}
		if (errorCode >= 4000 && errorCode < 5000) {
			return HttpStatus.NOT_FOUND;
		}
		if (errorCode >= 5000 && errorCode < 6000) {
			return HttpStatus.CONFLICT;
		}
		return HttpStatus.INTERNAL_SERVER_ERROR;
	}
}

// Specific exception classes
export class AuthenticationException extends AppException {
	constructor(message?: string, details?: any) {
		super(
			ErrorCode.INVALID_CREDENTIALS,
			message,
			details,
			HttpStatus.UNAUTHORIZED,
		);
	}
}

export class RateLimitException extends AppException {
	constructor(resetAt: Date) {
		super(
			ErrorCode.RATE_LIMIT_EXCEEDED,
			undefined,
			{ resetAt },
			HttpStatus.TOO_MANY_REQUESTS,
		);
	}
}

export class ValidationException extends AppException {
	constructor(message?: string, details?: any) {
		super(
			ErrorCode.VALIDATION_FAILED,
			message,
			details,
			HttpStatus.BAD_REQUEST,
		);
	}
}

export class ResourceNotFoundException extends AppException {
	constructor(errorCode: ErrorCode, message?: string) {
		super(errorCode, message, undefined, HttpStatus.NOT_FOUND);
	}
}

export class OwnershipException extends AppException {
	constructor() {
		super(
			ErrorCode.OWNERSHIP_REQUIRED,
			undefined,
			undefined,
			HttpStatus.FORBIDDEN,
		);
	}
}
