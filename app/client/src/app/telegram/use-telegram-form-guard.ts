import { useEffect } from 'react'

import { closingBehavior, swipeBehavior } from '@tma.js/sdk-react'

import { useAuthSession } from '@/app/session/use-auth-session'

interface UseTelegramFormGuardOptions {
	active: boolean
	isDirty: boolean
}

const tryRun = (callback: () => void) => {
	try {
		callback()
	} catch {
		return
	}
}

export const useTelegramFormGuard = ({
	active,
	isDirty
}: UseTelegramFormGuardOptions) => {
	const { isTelegramEnvironment } = useAuthSession()

	useEffect(() => {
		if (!isTelegramEnvironment || !active) {
			return
		}

		tryRun(() => closingBehavior.mount())
		tryRun(() => swipeBehavior.mount())
		tryRun(() => swipeBehavior.disableVertical())

		return () => {
			tryRun(() => closingBehavior.disableConfirmation())
			tryRun(() => swipeBehavior.enableVertical())
			tryRun(() => closingBehavior.unmount())
			tryRun(() => swipeBehavior.unmount())
		}
	}, [active, isTelegramEnvironment])

	useEffect(() => {
		if (!isTelegramEnvironment || !active) {
			return
		}

		if (isDirty) {
			tryRun(() => closingBehavior.enableConfirmation())
			return
		}

		tryRun(() => closingBehavior.disableConfirmation())
	}, [active, isDirty, isTelegramEnvironment])
}
