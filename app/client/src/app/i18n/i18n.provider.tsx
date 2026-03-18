import {
	useEffect,
	useMemo,
	useRef,
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
import {
	getStoredLocale,
	hydrateStoredLocaleIfMissing,
	persistLocale
} from '@/app/telegram/app-storage'
import { enTranslations } from './translations.en'
import { idTranslations } from './translations.id'
import { ruTranslations } from './translations.ru'

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

	const locale = getStoredLocale()

	setFormattingLocale(locale)

	return locale
}

export const I18nProvider = ({ children }: PropsWithChildren) => {
	const [locale, setLocale] = useState<AppLocale>(getInitialLocale)
	const initialLocaleRef = useRef(locale)

	setFormattingLocale(locale)

	useEffect(() => {
		persistLocale(locale)
	}, [locale])

	useEffect(() => {
		void hydrateStoredLocaleIfMissing((storedLocale) => {
			setLocale((currentLocale) =>
				currentLocale === initialLocaleRef.current ? storedLocale : currentLocale
			)
		})
	}, [])

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
