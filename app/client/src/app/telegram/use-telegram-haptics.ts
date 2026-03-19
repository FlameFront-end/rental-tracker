import { useCallback, useRef } from 'react'

import { hapticFeedback } from '@tma.js/sdk-react'

import { useAuthSession } from '@/app/session/use-auth-session'

const SELECTION_FALLBACK_COOLDOWN_MS = 40

const tryRun = (callback: () => void) => {
	try {
		callback()
	} catch {
		return
	}
}

export const useTelegramHaptics = () => {
	const { isTelegramEnvironment } = useAuthSession()
	const lastSelectionFallbackAtRef = useRef(0)

	const runSelectionFallback = useCallback(() => {
		if (typeof window === 'undefined' || typeof navigator === 'undefined') {
			return
		}

		const isTouchDevice =
			navigator.maxTouchPoints > 0 || window.matchMedia?.('(pointer: coarse)').matches

		if (!isTouchDevice || typeof navigator.vibrate !== 'function') {
			return
		}

		const now = Date.now()

		if (now - lastSelectionFallbackAtRef.current < SELECTION_FALLBACK_COOLDOWN_MS) {
			return
		}

		lastSelectionFallbackAtRef.current = now
		navigator.vibrate(10)
	}, [])

	const selectionChanged = useCallback(() => {
		if (isTelegramEnvironment) {
			tryRun(() => hapticFeedback.selectionChanged())
			return
		}

		runSelectionFallback()
	}, [isTelegramEnvironment, runSelectionFallback])

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
