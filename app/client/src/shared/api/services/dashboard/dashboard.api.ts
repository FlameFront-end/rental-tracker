import { useQuery } from '@tanstack/react-query'

import type { BookingStatus } from '@/shared/api/services/bookings'
import axiosInstance from '@/shared/api/axiosInstance'

export interface DashboardBookingItem {
	id: string
	assetId: string
	assetName: string
	clientName: string
	startDate: string
	endDate: string
	price: number
	status: BookingStatus
	createdAt: string
	updatedAt: string
}

export interface DashboardSummary {
	metrics: {
		bikeCount: number
		activeTodayCount: number
		endingTodayCount: number
		endingTomorrowCount: number
		pendingCount: number
	}
	endingToday: DashboardBookingItem[]
	endingTomorrow: DashboardBookingItem[]
	pending: DashboardBookingItem[]
}

export interface DashboardOccupancyBike {
	assetId: string
	assetName: string
	bookings: DashboardBookingItem[]
}

export interface DashboardOccupancy {
	from: string
	to: string
	days: string[]
	bikes: DashboardOccupancyBike[]
}

interface OccupancyFilters {
	from: string
	to: string
}

export const dashboardKeys = {
	all: ['dashboard'] as const,
	summary: () => [...dashboardKeys.all, 'summary'] as const,
	occupancy: (filters: OccupancyFilters) =>
		[...dashboardKeys.all, 'occupancy', filters] as const
}

const getDashboardSummary = async () => {
	const { data } = await axiosInstance.get<DashboardSummary>('/dashboard/summary')

	return data
}

const getDashboardOccupancy = async (filters: OccupancyFilters) => {
	const { data } = await axiosInstance.get<DashboardOccupancy>('/dashboard/occupancy', {
		params: filters
	})

	return data
}

export const useDashboardSummaryQuery = () => {
	return useQuery({
		queryKey: dashboardKeys.summary(),
		queryFn: getDashboardSummary
	})
}

export const useDashboardOccupancyQuery = (filters: OccupancyFilters) => {
	return useQuery({
		queryKey: dashboardKeys.occupancy(filters),
		queryFn: () => getDashboardOccupancy(filters)
	})
}
