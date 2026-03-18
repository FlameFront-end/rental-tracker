import { createContext, useContext } from 'react'

import type { AppLocale } from '@/shared/model'

export interface TranslationParams {
	[key: string]: string | number | boolean | null | undefined
}

export interface I18nContextValue {
	cycleLocale: () => void
	locale: AppLocale
	setLocale: (locale: AppLocale) => void
	t: (key: string, params?: TranslationParams) => string
}

export const I18nContext = createContext<I18nContextValue | null>(null)

export const useI18nContext = () => {
	const context = useContext(I18nContext)

	if (!context) {
		throw new Error('useI18n must be used within I18nProvider.')
	}

	return context
}
