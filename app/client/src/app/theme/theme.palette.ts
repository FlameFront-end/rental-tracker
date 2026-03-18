import { retrieveLaunchParams } from '@tma.js/sdk-react'

import type { AppTheme } from './theme.context'

interface AppThemePalette {
	background: `#${string}`
	colorScheme: AppTheme
	elevatedBackground: `#${string}`
}

const DEFAULT_THEME: AppTheme = 'dark'

export const APP_THEME_PALETTES: Record<AppTheme, AppThemePalette> = {
	dark: {
		background: '#07111f',
		colorScheme: 'dark',
		elevatedBackground: '#0d1b30'
	},
	light: {
		background: '#f4efe6',
		colorScheme: 'light',
		elevatedBackground: '#fff8ed'
	}
}

const getChannelValue = (hex: string, startIndex: number) =>
	Number.parseInt(hex.slice(startIndex, startIndex + 2), 16)

const getBrightness = (hexColor: `#${string}`) => {
	const normalizedColor = hexColor.length === 4
		? `#${hexColor[1]}${hexColor[1]}${hexColor[2]}${hexColor[2]}${hexColor[3]}${hexColor[3]}`
		: hexColor.slice(0, 7)

	const red = getChannelValue(normalizedColor, 1)
	const green = getChannelValue(normalizedColor, 3)
	const blue = getChannelValue(normalizedColor, 5)

	return (red * 299 + green * 587 + blue * 114) / 1000
}

export const getThemePalette = (theme: AppTheme) => APP_THEME_PALETTES[theme]

export const getTelegramLaunchTheme = (): AppTheme | null => {
	if (typeof window === 'undefined') {
		return null
	}

	try {
		const launchParams = retrieveLaunchParams()
		const backgroundColor =
			launchParams.tgWebAppThemeParams.bg_color ??
			launchParams.tgWebAppThemeParams.secondary_bg_color ??
			launchParams.tgWebAppThemeParams.header_bg_color

		if (!backgroundColor) {
			return null
		}

		return getBrightness(backgroundColor) < 150 ? 'dark' : 'light'
	} catch {
		return null
	}
}

export const resolveInitialTheme = (storedTheme: string | null): AppTheme => {
	const telegramTheme = getTelegramLaunchTheme()

	if (telegramTheme) {
		return telegramTheme
	}

	return storedTheme === 'light' || storedTheme === 'dark'
		? storedTheme
		: DEFAULT_THEME
}
