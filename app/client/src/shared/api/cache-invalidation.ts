import type { QueryClient } from '@tanstack/react-query'

export const invalidateBookingRelatedQueries = async (queryClient: QueryClient) => {
	await Promise.all([
		queryClient.invalidateQueries({
			queryKey: ['bookings']
		}),
		queryClient.invalidateQueries({
			queryKey: ['dashboard']
		})
	])
}

export const invalidateAssetRelatedQueries = async (queryClient: QueryClient) => {
	await Promise.all([
		queryClient.invalidateQueries({
			queryKey: ['assets']
		}),
		queryClient.invalidateQueries({
			queryKey: ['bookings']
		}),
		queryClient.invalidateQueries({
			queryKey: ['dashboard']
		})
	])
}
