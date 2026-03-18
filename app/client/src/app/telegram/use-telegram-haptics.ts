import { useCallback } from 'react'

import { hapticFeedback } from '@tma.js/sdk-react'

import { useAuthSession } from '@/app/session/use-auth-session'

const tryRun = (callback: () => void) => {
	try {
		callback()
	} catch {
		return
	}
}

export const useTelegramHaptics = () => {
	const { isTelegramEnvironment } = useAuthSession()

	const selectionChanged = useCallback(() => {
		if (!isTelegramEnvironment) {
			return
		}

		tryRun(() => hapticFeedback.selectionChanged())
	}, [isTelegramEnvironment])

	const success = useCallback(() => {
		if (!isTelegramEnvironment) {
			return
		}

		tryRun(() => hapticFeedback.notificationOccurred('success'))
	}, [isTelegramEnvironment])

	const error = useCallback(() => {
		if (!isTelegramEnvironment) {
			return
		}

		tryRun(() => hapticFeedback.notificationOccurred('error'))
	}, [isTelegramEnvironment])

	return {
		error,
		selectionChanged,
		success
	}
}
