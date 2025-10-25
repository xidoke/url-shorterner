import {
	type CallHandler,
	type ExecutionContext,
	Injectable,
	type NestInterceptor,
} from "@nestjs/common";
import type { Observable } from "rxjs";
import { map } from "rxjs/operators";
import {
	type ApiSuccessResponse,
	ResponseBuilder,
} from "../responses/api-response";

@Injectable()
export class TransformInterceptor<T>
	implements NestInterceptor<T, ApiSuccessResponse<T>>
{
	intercept(
		_context: ExecutionContext,
		next: CallHandler,
	): Observable<ApiSuccessResponse<T>> {
		return next.handle().pipe(
			map((data) => {
				// If data is already wrapped, return as-is
				if (data && typeof data === "object" && "success" in data) {
					return data as ApiSuccessResponse<T>;
				}

				// Otherwise, wrap in standard response format
				return ResponseBuilder.success(data);
			}),
		);
	}
}
