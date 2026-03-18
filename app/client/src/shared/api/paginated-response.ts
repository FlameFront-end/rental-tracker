export interface PaginatedResponse<T> {
	hasMore: boolean
	items: T[]
	limit: number
	page: number
	total: number
	totalPages: number
}
