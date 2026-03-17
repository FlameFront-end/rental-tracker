import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type PropsWithChildren
} from 'react'

import type { AxiosError } from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import { retrieveRawInitData } from '@tma.js/sdk-react'

import {
	AuthSessionContext,
	type AuthSessionContextValue,
	type AuthSessionStatus
} from '@/app/model/auth-session.context'
import {
	authKeys,
	getMe,
	loginForDevelopment,
	loginWithTelegram,
	type AuthResponse,
	type AuthUser
} from '@/shared/api/services/auth'
import { clearAccessToken, getAccessToken, setAccessToken } from '@/shared/lib'
import { env } from '@/shared/model'

const DEFAULT_UNAUTHENTICATED_MESSAGE =
	'Open the app inside Telegram or use the local development login.'

const getErrorMessage = (
	error: unknown,
	fallbackMessage = 'Authentication failed. Please try again.'
) => {
	const axiosError = error as AxiosError<{ message?: string | string[] }>
	const responseMessage = axiosError.response?.data?.message

	if (Array.isArray(responseMessage) && responseMessage.length > 0) {
		return responseMessage.join(', ')
	}

	if (typeof responseMessage === 'string' && responseMessage.trim()) {
		return responseMessage
	}

	if (error instanceof Error && error.message.trim()) {
		return error.message
	}

	return fallbackMessage
}

export const AuthSessionProvider = ({ children }: PropsWithChildren) => {
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
				resetSession(DEFAULT_UNAUTHENTICATED_MESSAGE)

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
				resetSession(getErrorMessage(loginError))

				return false
			}
		},
		[applyAuthenticatedState, rawInitData, resetSession]
	)

	const loginForDev = useCallback(
		async (telegramId = env.DEV_TELEGRAM_ID) => {
			if (!telegramId) {
				resetSession(DEFAULT_UNAUTHENTICATED_MESSAGE)

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
				resetSession(getErrorMessage(loginError))

				return false
			}
		},
		[applyAuthenticatedState, resetSession]
	)

	const logout = useCallback(() => {
		resetSession(DEFAULT_UNAUTHENTICATED_MESSAGE)
	}, [resetSession])

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

			resetSession(DEFAULT_UNAUTHENTICATED_MESSAGE)
		}

		void bootstrapSession()
	}, [loginForDev, loginWithTelegramInitData, queryClient, rawInitData, resetSession])

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
