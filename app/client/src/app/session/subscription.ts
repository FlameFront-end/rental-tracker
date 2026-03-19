import type { AuthUser } from '@/shared/api/services/auth'

export type AuthSubscriptionState =
	| 'none'
	| 'trial_active'
	| 'trial_expired'
	| 'active'
	| 'subscription_expired'

const isFutureDate = (value: string | null) => {
	if (!value) {
		return false
	}

	const timestamp = Date.parse(value)

	return Number.isFinite(timestamp) && timestamp > Date.now()
}

export const resolveAuthSubscriptionState = (
	user: AuthUser | null
): AuthSubscriptionState => {
	if (!user) {
		return 'none'
	}

	if (user.subscriptionStatus === 'trial') {
		return isFutureDate(user.subscriptionEndsAt) ? 'trial_active' : 'trial_expired'
	}

	if (user.subscriptionStatus === 'active') {
		return isFutureDate(user.subscriptionEndsAt) ? 'active' : 'subscription_expired'
	}

	return 'none'
}

export const hasActiveSubscriptionAccess = (state: AuthSubscriptionState) =>
	state === 'trial_active' || state === 'active'
