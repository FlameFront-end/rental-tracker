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

	const logout = useCallback(() => {
		resetSession(t('auth.error.unauthenticated'))
	}, [resetSession, t])

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
			logout,
			status,
			user
		}),
		[
			canUseDevelopmentLogin,
			error,
			isTelegramEnvironment,
			loginForDev,
			loginWithTelegramInitData,
			logout,
			status,
			user
		]
	)

	return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>
}
