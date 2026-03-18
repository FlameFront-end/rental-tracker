import { useQuery } from '@tanstack/react-query'

import axiosInstance from '@/shared/api/axiosInstance'

export interface NotificationsStatus {
	status: string
	message: string
	botConfigured: boolean
	schedulerEnabled: boolean
	sentCount: number
	failedCount: number
}

export const notificationsKeys = {
	all: ['notifications'] as const,
	status: () => [...notificationsKeys.all, 'status'] as const
}

const getNotificationsStatus = async () => {
	const { data } = await axiosInstance.get<NotificationsStatus>('/notifications/status')

	return data
}

export const useNotificationsStatusQuery = () => {
	return useQuery({
		queryKey: notificationsKeys.status(),
		queryFn: getNotificationsStatus
	})
}
