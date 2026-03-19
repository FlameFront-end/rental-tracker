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
import {
	hasActiveSubscriptionAccess,
	resolveAuthSubscriptionState
} from '@/app/session/subscription'
import { useI18n } from '@/app/i18n/use-i18n'
import { hasStoredLocale } from '@/app/telegram/app-storage'
import {
	authKeys,
	getMe,
	loginForDevelopment,
	loginWithTelegram,
	updateMyLocale,
	type AuthResponse,
	type AuthUser
} from '@/shared/api/services/auth'
import {
	clearAccessToken,
	getAccessToken,
	getApiErrorMessage,
	setAccessToken
} from '@/shared/lib'
import { DEFAULT_LOCALE, env, type AppLocale } from '@/shared/model'

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
	const { locale, setLocale, t } = useI18n()
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
	const applyCurrentUser = useCallback(
		(nextUser: AuthUser) => {
			queryClient.setQueryData(authKeys.me(), nextUser)
			setUser(nextUser)
			setError(null)
			setStatus('authenticated')

			if (nextUser.locale !== locale) {
				setLocale(nextUser.locale)
			}
		},
		[locale, queryClient, setLocale]
	)
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
			applyCurrentUser(authResponse.user)
		},
		[applyCurrentUser]
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
					initData: nextInitData,
					...(hasStoredLocale()
						? {
								locale
							}
						: {})
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
		[applyAuthenticatedState, locale, rawInitData, resetSession, t]
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
					telegramId,
					...(hasStoredLocale()
						? {
								locale
							}
						: {})
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
		[applyAuthenticatedState, locale, resetSession, t]
	)

	const subscriptionState = useMemo(
		() => resolveAuthSubscriptionState(user),
		[user]
	)
	const hasSubscriptionAccess = useMemo(
		() => hasActiveSubscriptionAccess(subscriptionState),
		[subscriptionState]
	)
	const setPreferredLocale = useCallback(
		async (nextLocale: AppLocale) => {
			if (nextLocale === locale && (!user || user.locale === nextLocale)) {
				return
			}

			const fallbackLocale = user?.locale ?? locale ?? DEFAULT_LOCALE

			setLocale(nextLocale)

			if (!user) {
				return
			}

			try {
				const nextUser = await updateMyLocale({
					locale: nextLocale
				})

				applyCurrentUser(nextUser)
			} catch (error) {
				setLocale(fallbackLocale)
				throw error
			}
		},
		[applyCurrentUser, locale, setLocale, user]
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
					const nextUser =
						hasStoredLocale() && currentUser.locale !== locale
							? await updateMyLocale({
									locale
								})
							: currentUser

					applyCurrentUser(nextUser)

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
	}, [
		applyCurrentUser,
		loginForDev,
		loginWithTelegramInitData,
		queryClient,
		rawInitData,
		resetSession,
		t
	])

	const value = useMemo<AuthSessionContextValue>(
		() => ({
			canUseDevelopmentLogin,
			error,
			hasSubscriptionAccess,
			isTelegramEnvironment,
			loginForDev,
			loginWithTelegramInitData,
			profile,
			setPreferredLocale,
			status,
			subscriptionState,
			updateCurrentUser: applyCurrentUser,
			user
		}),
		[
			canUseDevelopmentLogin,
			error,
			hasSubscriptionAccess,
			isTelegramEnvironment,
			loginForDev,
			loginWithTelegramInitData,
			profile,
			setPreferredLocale,
			status,
			subscriptionState,
			applyCurrentUser,
			user
		]
	)

	return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>
}
