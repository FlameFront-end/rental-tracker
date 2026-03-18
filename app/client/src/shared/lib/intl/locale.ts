import dayjs from 'dayjs'
import idLocale from 'dayjs/esm/locale/id'
import ruLocale from 'dayjs/esm/locale/ru'

import { DEFAULT_LOCALE, type AppLocale } from '@/shared/model'

dayjs.locale(idLocale, undefined, true)
dayjs.locale(ruLocale, undefined, true)

const dayjsLocaleMap: Record<AppLocale, string> = {
	en: 'en',
	ru: 'ru',
	id: 'id'
}

const intlLocaleMap: Record<AppLocale, string> = {
	en: 'en-US',
	ru: 'ru-RU',
	id: 'id-ID'
}

let currentLocale: AppLocale = DEFAULT_LOCALE

export const setFormattingLocale = (locale: AppLocale) => {
	currentLocale = locale
	dayjs.locale(dayjsLocaleMap[locale])
}

export const getFormattingLocale = () => currentLocale

export const getIntlLocale = (locale = currentLocale) => intlLocaleMap[locale]

setFormattingLocale(DEFAULT_LOCALE)
