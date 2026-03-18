import {
	useLayoutEffect,
	useMemo,
	useState,
	type PropsWithChildren
} from 'react'

import { ThemeContext, type AppTheme } from './theme.context'
import { getThemePalette, resolveInitialTheme } from './theme.palette'

const THEME_STORAGE_KEY = 'rental-tracker-theme'

const getInitialTheme = (): AppTheme => {
	if (typeof window === 'undefined') {
		return 'dark'
	}

	return resolveInitialTheme(window.localStorage.getItem(THEME_STORAGE_KEY))
}

export const ThemeProvider = ({ children }: PropsWithChildren) => {
	const [theme, setTheme] = useState<AppTheme>(getInitialTheme)

	useLayoutEffect(() => {
		const palette = getThemePalette(theme)

		document.documentElement.dataset.theme = theme
		document.documentElement.style.colorScheme = palette.colorScheme
		document.documentElement.style.backgroundColor = palette.background
		document.body.style.backgroundColor = palette.background
		window.localStorage.setItem(THEME_STORAGE_KEY, theme)
	}, [theme])

	const value = useMemo(
		() => ({
			setTheme,
			theme,
			toggleTheme: () => {
				setTheme((currentTheme) =>
					currentTheme === 'dark' ? 'light' : 'dark'
				)
			}
		}),
		[theme]
	)

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
