import { createContext, useContext } from 'react'

export type AppTheme = 'dark' | 'light'

export interface ThemeContextValue {
	setTheme: (theme: AppTheme) => void
	theme: AppTheme
	toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export const useTheme = () => {
	const context = useContext(ThemeContext)

	if (!context) {
		throw new Error('useTheme must be used within ThemeProvider.')
	}

	return context
}
