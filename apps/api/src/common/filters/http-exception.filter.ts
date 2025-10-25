import {
	type ArgumentsHost,
	Catch,
	type ExceptionFilter,
	HttpException,
	HttpStatus,
	Logger,
} from "@nestjs/common";
import type { Response } from "express";

/**
 * HTTP Exception Filter
 * Catches and formats HTTP exceptions
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger("ExceptionFilter");

	catch(exception: HttpException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest();
		const status = exception.getStatus();
		const exceptionResponse = exception.getResponse();

		const errorResponse = {
			statusCode: status,
			timestamp: new Date().toISOString(),
			path: request.url,
			method: request.method,
			message:
				typeof exceptionResponse === "string"
					? exceptionResponse
					: (exceptionResponse as any).message || exception.message,
			error:
				typeof exceptionResponse === "object" && "error" in exceptionResponse
					? (exceptionResponse as any).error
					: HttpStatus[status],
		};

		// Log error
		this.logger.error(
			`${request.method} ${request.url} - ${status} - ${errorResponse.message}`,
		);

		response.status(status).json(errorResponse);
	}
}
