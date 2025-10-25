import {
	type CallHandler,
	type ExecutionContext,
	Injectable,
	Logger,
	type NestInterceptor,
} from "@nestjs/common";
import type { Observable } from "rxjs";
import { tap } from "rxjs/operators";

/**
 * Logging Interceptor
 * Logs HTTP requests and responses
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger = new Logger("HTTP");

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const request = context.switchToHttp().getRequest();
		const { method, url, ip } = request;
		const userAgent = request.get("user-agent") || "";
		const startTime = Date.now();

		return next.handle().pipe(
			tap({
				next: () => {
					const response = context.switchToHttp().getResponse();
					const { statusCode } = response;
					const latency = Date.now() - startTime;

					this.logger.log(
						`${method} ${url} ${statusCode} ${latency}ms - ${userAgent} ${ip}`,
					);
				},
				error: (error) => {
					const latency = Date.now() - startTime;
					this.logger.error(
						`${method} ${url} ${error.status || 500} ${latency}ms - ${error.message}`,
					);
				},
			}),
		);
	}
}
