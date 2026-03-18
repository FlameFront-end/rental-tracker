export const APP_LOCALES = ['en', 'ru', 'id'] as const

export type AppLocale = (typeof APP_LOCALES)[number]

export const DEFAULT_LOCALE: AppLocale = 'en'

export const APP_LOCALE_LABELS: Record<AppLocale, string> = {
	en: 'English',
	ru: 'Русский',
	id: 'Bahasa Indonesia'
}

export const APP_LOCALE_CODES: Record<AppLocale, string> = {
	en: 'EN',
	ru: 'RU',
	id: 'ID'
}
