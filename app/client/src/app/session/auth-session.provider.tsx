import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type PropsWithChildren
} from 'react'

import { useQueryClient } from '@tanstack/react-query'
import { retrieveRawInitData } from '@tma.js/sdk-react'

import {
	AuthSessionContext,
	type AuthSessionProfile,
	type AuthSessionContextValue,
	type AuthSessionStatus
} from '@/app/session/auth-session.context'
import { useI18n } from '@/app/i18n/use-i18n'
import {
	authKeys,
	getMe,
	loginForDevelopment,
	loginWithTelegram,
	type AuthResponse,
	type AuthUser
} from '@/shared/api/services/auth'
import {
	clearAccessToken,
	getAccessToken,
	getApiErrorMessage,
	setAccessToken
} from '@/shared/lib'
import { env } from '@/shared/model'

interface TelegramInitDataUser {
	first_name?: string
	last_name?: string
	photo_url?: string
	username?: string
}

const buildInitials = (displayName: string) => {
	const parts = displayName.trim().split(/\s+/).filter(Boolean)

	if (parts.length === 0) {
		return 'RT'
	}

	if (parts.length === 1) {
		return parts[0].slice(0, 2).toUpperCase()
	}

	return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

const parseTelegramInitDataUser = (rawInitData?: string) => {
	if (!rawInitData) {
		return null
	}

	try {
		const userRaw = new URLSearchParams(rawInitData).get('user')

		if (!userRaw) {
			return null
		}

		return JSON.parse(userRaw) as TelegramInitDataUser
	} catch {
		return null
	}
}

export const AuthSessionProvider = ({ children }: PropsWithChildren) => {
	const { t } = useI18n()
	const queryClient = useQueryClient()
	const bootstrapStartedRef = useRef(false)
	const [status, setStatus] = useState<AuthSessionStatus>('bootstrapping')
	const [user, setUser] = useState<AuthUser | null>(null)
	const [error, setError] = useState<string | null>(null)
	const rawInitData = useMemo(() => {
		try {
			return retrieveRawInitData()
		} catch {
			return undefined
		}
	}, [])

	const isTelegramEnvironment = Boolean(rawInitData)
	const canUseDevelopmentLogin = !isTelegramEnvironment && Boolean(env.DEV_TELEGRAM_ID)
	const profile = useMemo<AuthSessionProfile | null>(() => {
		const telegramUser = parseTelegramInitDataUser(rawInitData)
		const displayName =
			[telegramUser?.first_name, telegramUser?.last_name].filter(Boolean).join(' ') ||
			telegramUser?.username ||
			(user ? `ID ${user.telegramId}` : '')

		if (!displayName) {
			return null
		}

		return {
			displayName,
			initials: buildInitials(displayName),
			photoUrl: telegramUser?.photo_url,
			username: telegramUser?.username
		}
	}, [rawInitData, user])

	const applyAuthenticatedState = useCallback(
		(authResponse: AuthResponse) => {
			setAccessToken(authResponse.accessToken)
			queryClient.setQueryData(authKeys.me(), authResponse.user)
			setUser(authResponse.user)
			setError(null)
			setStatus('authenticated')
		},
		[queryClient]
	)

	const resetSession = useCallback(
		(nextError: string | null = null) => {
			clearAccessToken()
			queryClient.removeQueries({
				queryKey: authKeys.all
			})
			setUser(null)
			setError(nextError)
			setStatus('unauthenticated')
		},
		[queryClient]
	)

	const loginWithTelegramInitData = useCallback(
		async (nextInitData = rawInitData) => {
			if (!nextInitData) {
				resetSession(t('auth.error.unauthenticated'))

				return false
			}

			setStatus('bootstrapping')

			try {
				const authResponse = await loginWithTelegram({
					initData: nextInitData
				})

				applyAuthenticatedState(authResponse)

				return true
			} catch (loginError) {
				resetSession(
					getApiErrorMessage(
						loginError,
						t('auth.error.authenticationFailed')
					)
				)

				return false
			}
		},
		[applyAuthenticatedState, rawInitData, resetSession, t]
	)

	const loginForDev = useCallback(
		async (telegramId = env.DEV_TELEGRAM_ID) => {
			if (!telegramId) {
				resetSession(t('auth.error.unauthenticated'))

				return false
			}

			setStatus('bootstrapping')

			try {
				const authResponse = await loginForDevelopment({
					telegramId
				})

				applyAuthenticatedState(authResponse)

				return true
			} catch (loginError) {
				resetSession(
					getApiErrorMessage(
						loginError,
						t('auth.error.authenticationFailed')
					)
				)

				return false
			}
		},
		[applyAuthenticatedState, resetSession, t]
	)

	useEffect(() => {
		if (bootstrapStartedRef.current) {
			return
		}

		bootstrapStartedRef.current = true

		const bootstrapSession = async () => {
			const accessToken = getAccessToken()

			if (accessToken) {
				try {
					const currentUser = await getMe()

					queryClient.setQueryData(authKeys.me(), currentUser)
					setUser(currentUser)
					setError(null)
					setStatus('authenticated')

					return
				} catch {
					clearAccessToken()
					queryClient.removeQueries({
						queryKey: authKeys.all
					})
				}
			}

			if (rawInitData) {
				await loginWithTelegramInitData(rawInitData)

				return
			}

			if (env.DEV_TELEGRAM_ID) {
				await loginForDev(env.DEV_TELEGRAM_ID)

				return
			}

			resetSession(t('auth.error.unauthenticated'))
		}

		void bootstrapSession()
	}, [loginForDev, loginWithTelegramInitData, queryClient, rawInitData, resetSession, t])

	const value = useMemo<AuthSessionContextValue>(
		() => ({
			canUseDevelopmentLogin,
			error,
			isTelegramEnvironment,
			loginForDev,
			loginWithTelegramInitData,
			profile,
			status,
			user
		}),
		[
			canUseDevelopmentLogin,
			error,
			isTelegramEnvironment,
			loginForDev,
			loginWithTelegramInitData,
			profile,
			status,
			user
		]
	)

	return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>
}
