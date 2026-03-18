import type { PaginatedResponse } from '../interfaces/paginated-response.interface';

export const createPaginatedResponse = <T>(
  items: T[],
  page: number,
  limit: number,
  total: number,
): PaginatedResponse<T> => ({
  items,
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
  hasMore: page * limit < total,
});
