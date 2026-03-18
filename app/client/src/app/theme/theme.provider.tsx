import {
	useEffect,
	useMemo,
	useState,
	type PropsWithChildren
} from 'react'

import { ThemeContext, type AppTheme } from './theme.context'

const THEME_STORAGE_KEY = 'rental-tracker-theme'
const DEFAULT_THEME: AppTheme = 'dark'

const getInitialTheme = (): AppTheme => {
	if (typeof window === 'undefined') {
		return DEFAULT_THEME
	}

	const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)

	return storedTheme === 'light' || storedTheme === 'dark'
		? storedTheme
		: DEFAULT_THEME
}

export const ThemeProvider = ({ children }: PropsWithChildren) => {
	const [theme, setTheme] = useState<AppTheme>(getInitialTheme)

	useEffect(() => {
		document.documentElement.dataset.theme = theme
		document.documentElement.style.colorScheme = theme
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
