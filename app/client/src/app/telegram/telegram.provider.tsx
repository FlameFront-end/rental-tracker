import { useEffect, useRef, type PropsWithChildren } from 'react'

import { init, miniApp, retrieveLaunchParams, useSignal, viewport } from '@tma.js/sdk-react'

import { useAuthSession } from '@/app/session/use-auth-session'
import { useTheme } from '@/app/theme/theme.context'
import { getThemePalette } from '@/app/theme/theme.palette'

const tryRun = (callback: () => void) => {
	try {
		callback()
	} catch {
		return
	}
}

export const TelegramProvider = ({ children }: PropsWithChildren) => {
	const { isTelegramEnvironment, status } = useAuthSession()
	const { theme } = useTheme()
	const isInitializedRef = useRef(false)
	const isReadyRef = useRef(false)
	const isExpandedRef = useRef(false)
	const isFullscreenRequestedRef = useRef(false)
	const unbindViewportCssVarsRef = useRef<VoidFunction | null>(null)
	const safeAreaInsetTop = useSignal(viewport.safeAreaInsetTop, () => 0)
	const contentSafeAreaInsetTop = useSignal(viewport.contentSafeAreaInsetTop, () => 0)
	const safeAreaInsetBottom = useSignal(viewport.safeAreaInsetBottom, () => 0)
	const contentSafeAreaInsetBottom = useSignal(
		viewport.contentSafeAreaInsetBottom,
		() => 0
	)
	const isFullscreen = useSignal(viewport.isFullscreen, () => false)

	useEffect(() => {
		if (!isTelegramEnvironment || isInitializedRef.current) {
			return
		}

		let cleanup: VoidFunction | undefined

		try {
			cleanup = init()
			tryRun(() => miniApp.mount())
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
			tryRun(() => miniApp.unmount())
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
		const launchPlatform = (() => {
			try {
				return retrieveLaunchParams().tgWebAppPlatform
			} catch {
				return undefined
			}
		})()
		const isCompactViewport = window.matchMedia('(max-width: 899px)').matches
		const topChromeOffset =
			isCompactViewport && isFullscreen
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
		isTelegramEnvironment,
		safeAreaInsetBottom,
		safeAreaInsetTop
	])

	useEffect(() => {
		if (!isTelegramEnvironment || status === 'bootstrapping') {
			return
		}

		const frame = requestAnimationFrame(() => {
			const isCompactViewport = window.matchMedia('(max-width: 899px)').matches

			if (!isExpandedRef.current) {
				tryRun(() => viewport.expand())
				isExpandedRef.current = true
			}

			if (!isReadyRef.current) {
				tryRun(() => miniApp.ready())
				isReadyRef.current = true
			}

			if (isCompactViewport && !isFullscreenRequestedRef.current) {
				void viewport.requestFullscreen().catch(() => undefined)
				isFullscreenRequestedRef.current = true
			}
		})

		return () => {
			cancelAnimationFrame(frame)
		}
	}, [isTelegramEnvironment, status])

	return children
}
