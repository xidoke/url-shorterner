import {
	type CallHandler,
	type ExecutionContext,
	Injectable,
	type NestInterceptor,
} from "@nestjs/common";
import type { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface Response<T> {
	data: T;
	timestamp: string;
	path: string;
}

/**
 * Transform Interceptor
 * Wraps successful responses in a consistent format
 */
@Injectable()
export class TransformInterceptor<T>
	implements NestInterceptor<T, Response<T>>
{
	intercept(
		context: ExecutionContext,
		next: CallHandler,
	): Observable<Response<T>> {
		const request = context.switchToHttp().getRequest();

		return next.handle().pipe(
			map((data) => ({
				data,
				timestamp: new Date().toISOString(),
				path: request.url,
			})),
		);
	}
}
