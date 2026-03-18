import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import axiosInstance from '@/shared/api/axiosInstance'

export interface NotificationsStatus {
	status: string
	message: string
	botConfigured: boolean
	schedulerEnabled: boolean
	sentCount: number
	failedCount: number
}

export interface NotificationsPreferences {
	reminderTodayEnabled: boolean
	reminderTomorrowEnabled: boolean
}

export interface UpdateNotificationsPreferencesPayload {
	reminderTodayEnabled?: boolean
	reminderTomorrowEnabled?: boolean
}

export const notificationsKeys = {
	all: ['notifications'] as const,
	status: () => [...notificationsKeys.all, 'status'] as const,
	preferences: () => [...notificationsKeys.all, 'preferences'] as const
}

const getNotificationsStatus = async () => {
	const { data } = await axiosInstance.get<NotificationsStatus>('/notifications/status')

	return data
}

const getNotificationsPreferences = async () => {
	const { data } = await axiosInstance.get<NotificationsPreferences>(
		'/notifications/preferences'
	)

	return data
}

const updateNotificationsPreferences = async (
	payload: UpdateNotificationsPreferencesPayload
) => {
	const { data } = await axiosInstance.patch<NotificationsPreferences>(
		'/notifications/preferences',
		payload
	)

	return data
}

export const useNotificationsStatusQuery = () => {
	return useQuery({
		queryKey: notificationsKeys.status(),
		queryFn: getNotificationsStatus
	})
}

export const useNotificationsPreferencesQuery = () => {
	return useQuery({
		queryKey: notificationsKeys.preferences(),
		queryFn: getNotificationsPreferences
	})
}

export const useUpdateNotificationsPreferencesMutation = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: updateNotificationsPreferences,
		onSuccess: (preferences) => {
			queryClient.setQueryData(notificationsKeys.preferences(), preferences)
		}
	})
}
