/**
 * Link response interface
 */
export interface LinkResponse {
	id: string;
	shortCode: string;
	shortUrl: string;
	longUrl: string;
	title?: string;
	description?: string;
	status: string;
	clickCount: string;
	createdAt: string;
	updatedAt: string;
	expiresAt?: string;
}

/**
 * Paginated links response
 */
export interface PaginatedLinksResponse {
	data: LinkResponse[];
	pagination: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
	};
}
