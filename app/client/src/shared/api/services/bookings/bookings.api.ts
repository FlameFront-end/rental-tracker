import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import axiosInstance from '@/shared/api/axiosInstance'
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

export const bookingsKeys = {
	all: ['bookings'] as const,
	list: (filters: BookingFilters = {}) => [...bookingsKeys.all, 'list', filters] as const
}

const buildBookingsParams = (filters: BookingFilters = {}) => ({
	...(filters.assetId ? { assetId: filters.assetId } : {}),
	...(filters.date ? { date: filters.date } : {}),
	...(filters.status ? { status: filters.status } : {})
})

const getBookings = async (filters: BookingFilters = {}) => {
	const { data } = await axiosInstance.get<Booking[]>('/bookings', {
		params: buildBookingsParams(filters)
	})

	return data
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

export const useBookingsQuery = (filters: BookingFilters = {}) => {
	return useQuery({
		queryKey: bookingsKeys.list(filters),
		queryFn: () => getBookings(filters)
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
