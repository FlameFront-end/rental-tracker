import { createContext, useContext } from 'react'

import type { AuthUser } from '@/shared/api/services/auth'
import type { AuthSubscriptionState } from '@/app/session/subscription'

export type AuthSessionStatus = 'bootstrapping' | 'authenticated' | 'unauthenticated'

export interface AuthSessionProfile {
	displayName: string
	initials: string
	photoUrl?: string
	username?: string
}

export interface AuthSessionContextValue {
	canUseDevelopmentLogin: boolean
	error: string | null
	hasSubscriptionAccess: boolean
	isTelegramEnvironment: boolean
	loginForDev: (telegramId?: string) => Promise<boolean>
	loginWithTelegramInitData: (initData?: string) => Promise<boolean>
	profile: AuthSessionProfile | null
	status: AuthSessionStatus
	subscriptionState: AuthSubscriptionState
	updateCurrentUser: (user: AuthUser) => void
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
