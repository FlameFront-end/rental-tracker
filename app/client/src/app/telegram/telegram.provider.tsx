import { useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react'

import {
	backButton,
	closingBehavior,
	init,
	miniApp,
	retrieveLaunchParams,
	swipeBehavior,
	useSignal,
	viewport
} from '@tma.js/sdk-react'

import { useAuthSession } from '@/app/session/use-auth-session'
import { useTheme } from '@/app/theme/theme.context'
import { getThemePalette } from '@/app/theme/theme.palette'
import { TelegramBackButtonProvider } from '@/app/telegram/telegram-back-button'

const tryRun = (callback: () => void) => {
	try {
		callback()
	} catch {
		return
	}
}

const MOBILE_TELEGRAM_PLATFORMS = new Set(['android', 'android_x', 'ios'])

export const TelegramProvider = ({ children }: PropsWithChildren) => {
	const { isTelegramEnvironment, status } = useAuthSession()
	const { theme } = useTheme()
	const isInitializedRef = useRef(false)
	const isReadyRef = useRef(false)
	const isExpandedRef = useRef(false)
	const isFullscreenRequestedRef = useRef(false)
	const unbindViewportCssVarsRef = useRef<VoidFunction | null>(null)
	const [isBackButtonReady, setIsBackButtonReady] = useState(false)
	const safeAreaInsetTop = useSignal(viewport.safeAreaInsetTop, () => 0)
	const contentSafeAreaInsetTop = useSignal(viewport.contentSafeAreaInsetTop, () => 0)
	const safeAreaInsetBottom = useSignal(viewport.safeAreaInsetBottom, () => 0)
	const contentSafeAreaInsetBottom = useSignal(
		viewport.contentSafeAreaInsetBottom,
		() => 0
	)
	const isFullscreen = useSignal(viewport.isFullscreen, () => false)
	const launchPlatform = useMemo(() => {
		if (!isTelegramEnvironment) {
			return undefined
		}

		try {
			return retrieveLaunchParams().tgWebAppPlatform
		} catch {
			return undefined
		}
	}, [isTelegramEnvironment])
	const isMobileTelegramPlatform =
		launchPlatform !== undefined &&
		MOBILE_TELEGRAM_PLATFORMS.has(launchPlatform)

	useEffect(() => {
		if (!isTelegramEnvironment || isInitializedRef.current) {
			return
		}

		let cleanup: VoidFunction | undefined

		try {
			cleanup = init()
			tryRun(() => {
				backButton.mount()
				setIsBackButtonReady(true)
			})
			tryRun(() => {
				closingBehavior.mount()
				closingBehavior.enableConfirmation()
			})
			tryRun(() => miniApp.mount())
			tryRun(() => {
				swipeBehavior.mount()
				swipeBehavior.disableVertical()
			})
			void viewport
				.mount()
				.then(() => {
					try {
						unbindViewportCssVarsRef.current = viewport.bindCssVars()
					} catch {
						unbindViewportCssVarsRef.current = null
					}
				})
				.catch(() => undefined)
			isInitializedRef.current = true
		} catch {
			return
		}

		return () => {
			cleanup?.()
			unbindViewportCssVarsRef.current?.()
			unbindViewportCssVarsRef.current = null
			tryRun(() => backButton.unmount())
			setIsBackButtonReady(false)
			tryRun(() => closingBehavior.disableConfirmation())
			tryRun(() => closingBehavior.unmount())
			tryRun(() => miniApp.unmount())
			tryRun(() => swipeBehavior.enableVertical())
			tryRun(() => swipeBehavior.unmount())
			isInitializedRef.current = false
			isReadyRef.current = false
			isExpandedRef.current = false
			isFullscreenRequestedRef.current = false
		}
	}, [isTelegramEnvironment])

	useEffect(() => {
		if (!isTelegramEnvironment) {
			return
		}

		const palette = getThemePalette(theme)

		tryRun(() => miniApp.setBgColor(palette.background))
		tryRun(() => miniApp.setHeaderColor(palette.background))
		tryRun(() => miniApp.setBottomBarColor(palette.background))
	}, [isTelegramEnvironment, theme])

	useEffect(() => {
		if (!isTelegramEnvironment) {
			return
		}

		const root = document.documentElement
		const topChromeOffset =
			isMobileTelegramPlatform && isFullscreen
				? launchPlatform === 'ios'
					? 44
					: 40
				: 0

		root.style.setProperty(
			'--app-telegram-safe-top',
			`${Math.max(safeAreaInsetTop, contentSafeAreaInsetTop)}px`
		)
		root.style.setProperty(
			'--app-telegram-safe-bottom',
			`${Math.max(safeAreaInsetBottom, contentSafeAreaInsetBottom)}px`
		)
		root.style.setProperty('--app-telegram-top-chrome', `${topChromeOffset}px`)

		return () => {
			root.style.removeProperty('--app-telegram-safe-top')
			root.style.removeProperty('--app-telegram-safe-bottom')
			root.style.removeProperty('--app-telegram-top-chrome')
		}
	}, [
		contentSafeAreaInsetBottom,
		contentSafeAreaInsetTop,
		isFullscreen,
		isMobileTelegramPlatform,
		isTelegramEnvironment,
		launchPlatform,
		safeAreaInsetBottom,
		safeAreaInsetTop
	])

	useEffect(() => {
		if (!isTelegramEnvironment) {
			return
		}

		if (!isReadyRef.current) {
			const frame = requestAnimationFrame(() => {
				tryRun(() => miniApp.ready())
				isReadyRef.current = true
			})

			return () => {
				cancelAnimationFrame(frame)
			}
		}
	}, [isTelegramEnvironment])

	useEffect(() => {
		if (!isTelegramEnvironment || status === 'bootstrapping') {
			return
		}

		const frame = requestAnimationFrame(() => {
			if (!isExpandedRef.current) {
				tryRun(() => viewport.expand())
				isExpandedRef.current = true
			}

			if (isMobileTelegramPlatform && !isFullscreenRequestedRef.current) {
				void viewport.requestFullscreen().catch(() => undefined)
				isFullscreenRequestedRef.current = true
			}
		})

		return () => {
			cancelAnimationFrame(frame)
		}
	}, [isMobileTelegramPlatform, isTelegramEnvironment, status])

	useEffect(() => {
		if (!isTelegramEnvironment || !isFullscreen) {
			return
		}

		if (isMobileTelegramPlatform) {
			return
		}

		void viewport.exitFullscreen().catch(() => undefined)
		isFullscreenRequestedRef.current = false
	}, [isFullscreen, isMobileTelegramPlatform, isTelegramEnvironment])

	return (
		<TelegramBackButtonProvider enabled={isTelegramEnvironment && isBackButtonReady}>
			{children}
		</TelegramBackButtonProvider>
	)
}
