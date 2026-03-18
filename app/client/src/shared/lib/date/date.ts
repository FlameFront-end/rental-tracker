import dayjs from 'dayjs'

export const getTodayDateOnly = () => dayjs().format('YYYY-MM-DD')

export const addDaysToDateOnly = (date: string, days: number) =>
	dayjs(date).add(days, 'day').format('YYYY-MM-DD')

export const formatDateLabel = (date: string) => dayjs(date).format('DD MMM YYYY')

export const formatDayColumnLabel = (date: string) => dayjs(date).format('ddd DD')

export const formatDateRange = (startDate: string, endDate: string) => {
	const start = dayjs(startDate)
	const end = dayjs(endDate)

	if (start.isSame(end, 'day')) {
		return start.format('DD MMM YYYY')
	}

	if (start.isSame(end, 'month')) {
		return `${start.format('DD')} - ${end.format('DD MMM YYYY')}`
	}

	return `${start.format('DD MMM')} - ${end.format('DD MMM YYYY')}`
}

export const getBookingDurationDays = (startDate: string, endDate: string) =>
	dayjs(endDate).diff(dayjs(startDate), 'day') + 1

export const isDateWithinRange = (date: string, startDate: string, endDate: string) =>
	dayjs(date).isSame(dayjs(startDate), 'day') ||
	(dayjs(date).isAfter(dayjs(startDate), 'day') && dayjs(date).isBefore(dayjs(endDate), 'day')) ||
	dayjs(date).isSame(dayjs(endDate), 'day')
