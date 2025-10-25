import {
	type ArgumentsHost,
	Catch,
	type ExceptionFilter,
	HttpException,
	HttpStatus,
	Logger,
} from "@nestjs/common";
import type { Response } from "express";
import { AppException } from "../errors/custom-exceptions";
import { ErrorCode } from "../errors/error-codes";
import { ResponseBuilder } from "../responses/api-response";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(HttpExceptionFilter.name);

	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest();

		let status = HttpStatus.INTERNAL_SERVER_ERROR;
		let errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
		let message = "Internal server error";
		let details: any;

		if (exception instanceof AppException) {
			// Custom application exception
			status = exception.getStatus();
			errorCode = exception.errorCode;
			message = exception.message;
			details = exception.details;
		} else if (exception instanceof HttpException) {
			// NestJS HTTP exception
			status = exception.getStatus();
			const exceptionResponse = exception.getResponse();

			if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
				const responseObj = exceptionResponse as any;
				message = responseObj.message || exception.message;
				details = responseObj;
			} else {
				message = exception.message;
			}

			// Map status codes to error codes
			errorCode = this.mapStatusToErrorCode(status);
		} else if (exception instanceof Error) {
			// Generic error
			message = exception.message;
			this.logger.error(
				`Unhandled error: ${exception.message}`,
				exception.stack,
			);
		} else {
			// Unknown error
			this.logger.error("Unknown error type", exception);
		}

		// Hide stack traces in production
		if (process.env.NODE_ENV === "production") {
			delete details?.stack;
		}

		// Log the error
		this.logger.error(
			`${request.method} ${request.url} - ${status} - ${message}`,
			exception instanceof Error ? exception.stack : undefined,
		);

		// Send response
		const errorResponse = ResponseBuilder.error(errorCode, message, details);

		response.status(status).json(errorResponse);
	}

	private mapStatusToErrorCode(status: HttpStatus): ErrorCode {
		switch (status) {
			case HttpStatus.UNAUTHORIZED:
				return ErrorCode.UNAUTHORIZED;
			case HttpStatus.FORBIDDEN:
				return ErrorCode.FORBIDDEN;
			case HttpStatus.NOT_FOUND:
				return ErrorCode.LINK_NOT_FOUND;
			case HttpStatus.BAD_REQUEST:
				return ErrorCode.VALIDATION_FAILED;
			case HttpStatus.TOO_MANY_REQUESTS:
				return ErrorCode.RATE_LIMIT_EXCEEDED;
			default:
				return ErrorCode.INTERNAL_SERVER_ERROR;
		}
	}
}
