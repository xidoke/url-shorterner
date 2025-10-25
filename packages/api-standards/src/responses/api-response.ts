export interface ApiResponseMeta {
	timestamp: string;
	pagination?: PaginationMeta;
}

export interface PaginationMeta {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

export interface ApiSuccessResponse<T> {
	success: true;
	data: T;
	meta: ApiResponseMeta;
}

export interface ApiErrorResponse {
	success: false;
	error: {
		code: number;
		message: string;
		details?: any;
	};
	meta: ApiResponseMeta;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export class ResponseBuilder {
	static success<T>(
		data: T,
		pagination?: PaginationMeta,
	): ApiSuccessResponse<T> {
		return {
			success: true,
			data,
			meta: {
				timestamp: new Date().toISOString(),
				pagination,
			},
		};
	}

	static error(code: number, message: string, details?: any): ApiErrorResponse {
		return {
			success: false,
			error: {
				code,
				message,
				details,
			},
			meta: {
				timestamp: new Date().toISOString(),
			},
		};
	}

	static paginated<T>(
		data: T[],
		page: number,
		limit: number,
		total: number,
	): ApiSuccessResponse<T[]> {
		const totalPages = Math.ceil(total / limit);

		return ResponseBuilder.success(data, {
			page,
			limit,
			total,
			totalPages,
			hasNext: page < totalPages,
			hasPrev: page > 1,
		});
	}
}
