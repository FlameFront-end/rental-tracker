import { getIntlLocale } from '@/shared/lib/intl/locale'

const priceFormatters = new Map<string, Intl.NumberFormat>()

export const formatPrice = (value: number) => {
	const locale = getIntlLocale()
	const formatter =
		priceFormatters.get(locale) ??
		new Intl.NumberFormat(locale, {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		})

	if (!priceFormatters.has(locale)) {
		priceFormatters.set(locale, formatter)
	}

	return formatter.format(value)
}
