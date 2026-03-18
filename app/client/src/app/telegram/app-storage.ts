import { cloudStorage, deviceStorage } from '@tma.js/sdk-react'

import type { BookingFormValues, BookingStatus } from '@/shared/api/services/bookings'
import {
	APP_LOCALES,
	APP_SECTION_ITEMS,
	DEFAULT_LOCALE,
	type AppLocale
} from '@/shared/model'

const STORAGE_KEYS = {
	bookingAssetFilter: 'rental-tracker-bookings-filter-asset',
	bookingDraft: 'rental-tracker-bookings-draft',
	lastRoute: 'rental-tracker-last-route',
	locale: 'rental-tracker-locale',
	remindersWriteAccess: 'rental-tracker-reminders-write-access'
} as const

const APP_SECTION_ROUTES = new Set(APP_SECTION_ITEMS.map((item) => item.to))

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]
type AppSectionRoute = (typeof APP_SECTION_ITEMS)[number]['to']
type PersistedBookingDraft = Partial<BookingFormValues>

const toStoredString = (value: string | null | undefined) =>
	typeof value === 'string' && value.length > 0 ? value : undefined

const readLocalString = (key: StorageKey) => {
	if (typeof window === 'undefined') {
		return undefined
	}

	try {
		return toStoredString(window.localStorage.getItem(key))
	} catch {
		return undefined
	}
}

const writeLocalString = (key: StorageKey, value: string) => {
	if (typeof window === 'undefined') {
		return
	}

	try {
		window.localStorage.setItem(key, value)
	} catch {
		return
	}
}

const removeLocalString = (key: StorageKey) => {
	if (typeof window === 'undefined') {
		return
	}

	try {
		window.localStorage.removeItem(key)
	} catch {
		return
	}
}

const readRemoteString = async (key: StorageKey) => {
	if (typeof window === 'undefined') {
		return undefined
	}

	try {
		return toStoredString(await deviceStorage.getItem(key))
	} catch {
		try {
			return toStoredString(await cloudStorage.getItem(key))
		} catch {
			return undefined
		}
	}
}

const persistString = (key: StorageKey, value: string | undefined) => {
	if (value === undefined) {
		removeLocalString(key)
	} else {
		writeLocalString(key, value)
	}

	if (typeof window === 'undefined') {
		return
	}

	void (async () => {
		try {
			if (value === undefined) {
				await deviceStorage.deleteItem(key)
			} else {
				await deviceStorage.setItem(key, value)
			}
			return
		} catch {
			try {
				if (value === undefined) {
					await cloudStorage.deleteItem(key)
				} else {
					await cloudStorage.setItem(key, value)
				}
			} catch {
				return
			}
		}
	})()
}

const isBookingStatus = (value: unknown): value is BookingStatus =>
	value === 'paid' || value === 'pending'

const parseLocale = (value?: string): AppLocale | undefined =>
	APP_LOCALES.includes(value as AppLocale) ? (value as AppLocale) : undefined

const parseLastRoute = (value?: string): AppSectionRoute | undefined =>
	APP_SECTION_ROUTES.has(value as AppSectionRoute) ? (value as AppSectionRoute) : undefined

const normalizeBookingDraft = (value: unknown): PersistedBookingDraft | undefined => {
	if (!value || typeof value !== 'object') {
		return undefined
	}

	const candidate = value as Partial<Record<keyof BookingFormValues, unknown>>
	const draft: PersistedBookingDraft = {}

	if (typeof candidate.assetId === 'string' && candidate.assetId.length > 0) {
		draft.assetId = candidate.assetId
	}

	if (typeof candidate.clientName === 'string' && candidate.clientName.length > 0) {
		draft.clientName = candidate.clientName
	}

	if (
		typeof candidate.startDate === 'string' &&
		/^\d{4}-\d{2}-\d{2}$/.test(candidate.startDate)
	) {
		draft.startDate = candidate.startDate
	}

	if (typeof candidate.endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(candidate.endDate)) {
		draft.endDate = candidate.endDate
	}

	if (typeof candidate.price === 'number' && Number.isFinite(candidate.price) && candidate.price >= 0) {
		draft.price = candidate.price
	}

	if (isBookingStatus(candidate.status)) {
		draft.status = candidate.status
	}

	return Object.keys(draft).length > 0 ? draft : undefined
}

const parseBookingDraft = (value?: string) => {
	if (!value) {
		return undefined
	}

	try {
		return normalizeBookingDraft(JSON.parse(value))
	} catch {
		return undefined
	}
}

export const getStoredLocale = (): AppLocale =>
	parseLocale(readLocalString(STORAGE_KEYS.locale)) ?? DEFAULT_LOCALE

export const hydrateStoredLocaleIfMissing = async (
	onHydrated: (locale: AppLocale) => void
) => {
	if (parseLocale(readLocalString(STORAGE_KEYS.locale))) {
		return
	}

	const remoteLocale = parseLocale(await readRemoteString(STORAGE_KEYS.locale))

	if (!remoteLocale) {
		return
	}

	writeLocalString(STORAGE_KEYS.locale, remoteLocale)
	onHydrated(remoteLocale)
}

export const persistLocale = (locale: AppLocale) => {
	persistString(STORAGE_KEYS.locale, locale)
}

export const getStoredLastRoute = () => parseLastRoute(readLocalString(STORAGE_KEYS.lastRoute))

export const persistLastRoute = (route: string) => {
	const nextRoute = parseLastRoute(route)

	if (!nextRoute) {
		return
	}

	persistString(STORAGE_KEYS.lastRoute, nextRoute)
}

export const getStoredBookingsAssetFilter = () =>
	readLocalString(STORAGE_KEYS.bookingAssetFilter)

export const persistBookingsAssetFilter = (assetId?: string) => {
	persistString(STORAGE_KEYS.bookingAssetFilter, toStoredString(assetId))
}

export const getStoredBookingDraft = () =>
	parseBookingDraft(readLocalString(STORAGE_KEYS.bookingDraft))

export const persistBookingDraft = (draft?: PersistedBookingDraft) => {
	const normalizedDraft = normalizeBookingDraft(draft)

	persistString(
		STORAGE_KEYS.bookingDraft,
		normalizedDraft ? JSON.stringify(normalizedDraft) : undefined
	)

	return normalizedDraft
}

export const getStoredRemindersWriteAccessStatus = () =>
	readLocalString(STORAGE_KEYS.remindersWriteAccess)

export const hydrateStoredRemindersWriteAccessStatusIfMissing = async (
	onHydrated: (status: string) => void
) => {
	if (readLocalString(STORAGE_KEYS.remindersWriteAccess)) {
		return
	}

	const remoteStatus = await readRemoteString(STORAGE_KEYS.remindersWriteAccess)

	if (!remoteStatus) {
		return
	}

	writeLocalString(STORAGE_KEYS.remindersWriteAccess, remoteStatus)
	onHydrated(remoteStatus)
}

export const persistRemindersWriteAccessStatus = (status?: string) => {
	persistString(STORAGE_KEYS.remindersWriteAccess, toStoredString(status))
}
