import {
	useEffect,
	useMemo,
	useState,
	type PropsWithChildren
} from 'react'

import {
	APP_LOCALES,
	DEFAULT_LOCALE,
	type AppLocale
} from '@/shared/model'
import { setFormattingLocale } from '@/shared/lib'

import {
	I18nContext,
	type I18nContextValue,
	type TranslationParams
} from './i18n.context'
import { enTranslations } from './translations.en'
import { idTranslations } from './translations.id'
import { ruTranslations } from './translations.ru'

const LOCALE_STORAGE_KEY = 'rental-tracker-locale'

const translations = {
	en: enTranslations,
	ru: ruTranslations,
	id: idTranslations
} as const

const interpolate = (template: string, params?: TranslationParams) => {
	if (!params) {
		return template
	}

	return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
		String(params[key] ?? '')
	)
}

const getInitialLocale = (): AppLocale => {
	if (typeof window === 'undefined') {
		setFormattingLocale(DEFAULT_LOCALE)
		return DEFAULT_LOCALE
	}

	const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY)
	const locale = APP_LOCALES.includes(storedLocale as AppLocale)
		? (storedLocale as AppLocale)
		: DEFAULT_LOCALE

	setFormattingLocale(locale)

	return locale
}

export const I18nProvider = ({ children }: PropsWithChildren) => {
	const [locale, setLocale] = useState<AppLocale>(getInitialLocale)

	setFormattingLocale(locale)

	useEffect(() => {
		window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
	}, [locale])

	const value = useMemo<I18nContextValue>(() => {
		const t = (key: string, params?: TranslationParams) => {
			const translation =
				translations[locale][key] ?? translations[DEFAULT_LOCALE][key]

			if (!translation) {
				return key
			}

			return typeof translation === 'function'
				? translation(params ?? {})
				: interpolate(translation, params)
		}

		return {
			locale,
			setLocale,
			cycleLocale: () => {
				setLocale((currentLocale) => {
					const currentIndex = APP_LOCALES.indexOf(currentLocale)

					return APP_LOCALES[(currentIndex + 1) % APP_LOCALES.length]
				})
			},
			t
		}
	}, [locale])

	return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
