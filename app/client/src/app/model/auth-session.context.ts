import { createContext, useContext } from 'react'

import type { AuthUser } from '@/shared/api/services/auth'

export type AuthSessionStatus = 'bootstrapping' | 'authenticated' | 'unauthenticated'

export interface AuthSessionContextValue {
	canUseDevelopmentLogin: boolean
	error: string | null
	isTelegramEnvironment: boolean
	loginForDev: (telegramId?: string) => Promise<boolean>
	loginWithTelegramInitData: (initData?: string) => Promise<boolean>
	logout: () => void
	status: AuthSessionStatus
	user: AuthUser | null
}

export const AuthSessionContext = createContext<AuthSessionContextValue | null>(null)

export const useAuthSession = () => {
	const context = useContext(AuthSessionContext)

	if (!context) {
		throw new Error('useAuthSession must be used within AuthSessionProvider.')
	}

	return context
}
