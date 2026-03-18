import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import axiosInstance from '@/shared/api/axiosInstance'
import type { PaginatedResponse } from '@/shared/api/paginated-response'
import { invalidateBookingRelatedQueries } from '@/shared/api/cache-invalidation'

export type BookingStatus = 'paid' | 'pending'

export interface Booking {
	id: string
	assetId: string
	clientName: string
	startDate: string
	endDate: string
	price: number
	status: BookingStatus
	createdAt: string
	updatedAt: string
}

export interface BookingFilters {
	assetId?: string
	date?: string
	status?: BookingStatus
}

export interface BookingFormValues {
	assetId: string
	clientName: string
	startDate: string
	endDate: string
	price: number
	status: BookingStatus
}

interface UpdateBookingPayload {
	bookingId: string
	payload: BookingFormValues
}

interface ExtendBookingPayload {
	bookingId: string
	days: number
}

interface UpdateBookingStatusPayload {
	bookingId: string
	status: BookingStatus
}

interface BookingsListParams {
	filters: BookingFilters
	limit: number
	page: number
}

const DEFAULT_BOOKINGS_PAGE_LIMIT = 12

export const bookingsKeys = {
	all: ['bookings'] as const,
	detail: (bookingId: string) => [...bookingsKeys.all, 'detail', bookingId] as const,
	list: (filters: BookingFilters = {}, limit = DEFAULT_BOOKINGS_PAGE_LIMIT) =>
		[...bookingsKeys.all, 'list', filters, { limit }] as const,
	total: (filters: BookingFilters = {}) => [...bookingsKeys.all, 'total', filters] as const
}

const buildBookingsParams = ({
	filters = {},
	limit,
	page
}: Partial<BookingsListParams> & {
	filters?: BookingFilters
}) => ({
	...(filters.assetId ? { assetId: filters.assetId } : {}),
	...(filters.date ? { date: filters.date } : {}),
	...(filters.status ? { status: filters.status } : {}),
	...(limit ? { limit } : {}),
	...(page ? { page } : {})
})

const getBookings = async ({ filters, limit, page }: BookingsListParams) => {
	const { data } = await axiosInstance.get<PaginatedResponse<Booking>>('/bookings', {
		params: buildBookingsParams({
			filters,
			limit,
			page
		})
	})

	return data
}

const getBooking = async (bookingId: string) => {
	const { data } = await axiosInstance.get<Booking>(`/bookings/${bookingId}`)

	return data
}

const getBookingsTotal = async (filters: BookingFilters = {}) => {
	const { data } = await axiosInstance.get<PaginatedResponse<Booking>>('/bookings', {
		params: buildBookingsParams({
			filters,
			limit: 1,
			page: 1
		})
	})

	return data.total
}

const createBooking = async (payload: BookingFormValues) => {
	const { data } = await axiosInstance.post<Booking>('/bookings', payload)

	return data
}

const updateBooking = async ({ bookingId, payload }: UpdateBookingPayload) => {
	const { data } = await axiosInstance.patch<Booking>(`/bookings/${bookingId}`, payload)

	return data
}

const deleteBooking = async (bookingId: string) => {
	await axiosInstance.delete(`/bookings/${bookingId}`)
}

const extendBooking = async ({ bookingId, days }: ExtendBookingPayload) => {
	const { data } = await axiosInstance.post<Booking>(`/bookings/${bookingId}/extend`, {
		days
	})

	return data
}

const updateBookingStatus = async ({
	bookingId,
	status
}: UpdateBookingStatusPayload) => {
	const { data } = await axiosInstance.patch<Booking>(`/bookings/${bookingId}/status`, {
		status
	})

	return data
}

export const useBookingsQuery = (
	filters: BookingFilters = {},
	limit = DEFAULT_BOOKINGS_PAGE_LIMIT
) => {
	const query = useInfiniteQuery({
		queryKey: bookingsKeys.list(filters, limit),
		initialPageParam: 1,
		queryFn: ({ pageParam }) =>
			getBookings({
				filters,
				limit,
				page: Number(pageParam)
			}),
		getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined)
	})
	const pages = query.data?.pages ?? []
	const items = pages.flatMap((page) => page.items)
	const firstPage = pages[0]

	return {
		...query,
		data: items,
		hasMore: query.hasNextPage,
		isFetchingMore: query.isFetchingNextPage,
		loadedCount: items.length,
		limit,
		total: firstPage?.total ?? 0,
		totalPages: firstPage?.totalPages ?? 0
	}
}

export const useBookingQuery = (bookingId?: string | null, enabled = true) => {
	return useQuery({
		queryKey: bookingsKeys.detail(bookingId ?? 'unknown'),
		queryFn: () => getBooking(bookingId!),
		enabled: Boolean(bookingId) && enabled
	})
}

export const useBookingsTotalQuery = (filters: BookingFilters = {}, enabled = true) => {
	return useQuery({
		queryKey: bookingsKeys.total(filters),
		queryFn: () => getBookingsTotal(filters),
		enabled
	})
}

export const useCreateBookingMutation = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: createBooking,
		onSuccess: async () => {
			await invalidateBookingRelatedQueries(queryClient)
		}
	})
}

export const useUpdateBookingMutation = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: updateBooking,
		onSuccess: async () => {
			await invalidateBookingRelatedQueries(queryClient)
		}
	})
}

export const useDeleteBookingMutation = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: deleteBooking,
		onSuccess: async () => {
			await invalidateBookingRelatedQueries(queryClient)
		}
	})
}

export const useExtendBookingMutation = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: extendBooking,
		onSuccess: async () => {
			await invalidateBookingRelatedQueries(queryClient)
		}
	})
}

export const useUpdateBookingStatusMutation = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: updateBookingStatus,
		onSuccess: async () => {
			await invalidateBookingRelatedQueries(queryClient)
		}
	})
}
