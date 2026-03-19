import { useMutation, useQuery } from '@tanstack/react-query'

import axiosInstance from '@/shared/api/axiosInstance'
import type { AppLocale } from '@/shared/model'

export type AuthUserSubscriptionStatus = 'none' | 'trial' | 'active'

export interface AuthUser {
	id: string
	locale: AppLocale
	telegramId: string
	createdAt: string
	subscriptionEndsAt: string | null
	subscriptionStatus: AuthUserSubscriptionStatus
}

export interface AuthResponse {
	accessToken: string
	user: AuthUser
}

export interface TelegramAuthPayload {
	initData: string
	locale?: AppLocale
}

export interface DevLoginPayload {
	telegramId: string
	locale?: AppLocale
}

export interface UpdateMyLocalePayload {
	locale: AppLocale
}

export const authKeys = {
	all: ['auth'] as const,
	me: () => [...authKeys.all, 'me'] as const
}

export const loginWithTelegram = async (payload: TelegramAuthPayload) => {
	const { data } = await axiosInstance.post<AuthResponse>('/auth/telegram', payload)

	return data
}

export const loginForDevelopment = async (payload: DevLoginPayload) => {
	const { data } = await axiosInstance.post<AuthResponse>('/auth/dev-login', payload)

	return data
}

export const getMe = async () => {
	const { data } = await axiosInstance.get<AuthUser>('/auth/me')

	return data
}

export const activateTrialSubscription = async () => {
	const { data } = await axiosInstance.post<AuthUser>('/auth/trial')

	return data
}

export const updateMyLocale = async (payload: UpdateMyLocalePayload) => {
	const { data } = await axiosInstance.patch<AuthUser>('/auth/me/locale', payload)

	return data
}

export const useTelegramAuthMutation = () => {
	return useMutation({
		mutationFn: loginWithTelegram
	})
}

export const useDevAuthMutation = () => {
	return useMutation({
		mutationFn: loginForDevelopment
	})
}

export const useMeQuery = (enabled = true) => {
	return useQuery({
		queryKey: authKeys.me(),
		queryFn: getMe,
		enabled
	})
}
