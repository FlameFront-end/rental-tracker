import { decodeStartParam, retrieveLaunchParams } from '@tma.js/sdk-react'
import type { To } from 'react-router-dom'

import { ROUTES, ROUTE_QUERY_KEYS } from '@/shared/model'

type StartAppPayload = Record<string, unknown>

const START_APP_BOOKING_TYPES = new Set(['booking', 'rental'])
const START_APP_ASSET_TYPES = new Set(['asset', 'bike'])

const buildSearch = (params: Record<string, string | undefined>) => {
	const searchParams = new URLSearchParams()

	for (const [key, value] of Object.entries(params)) {
		if (value) {
			searchParams.set(key, value)
		}
	}

	const search = searchParams.toString()

	return search ? `?${search}` : ''
}

const buildRouteTarget = (
	pathname: string,
	params: Record<string, string | undefined> = {}
): To => ({
	pathname,
	search: buildSearch(params)
})

const START_APP_ROUTE_TARGETS: Record<string, To> = {
	bikes: buildRouteTarget(ROUTES.ASSETS),
	bookings: buildRouteTarget(ROUTES.BOOKINGS),
	calendar: buildRouteTarget(ROUTES.CALENDAR),
	rentals: buildRouteTarget(ROUTES.BOOKINGS),
	today: buildRouteTarget(ROUTES.DASHBOARD),
	unpaid: buildRouteTarget(ROUTES.BOOKINGS, {
		[ROUTE_QUERY_KEYS.BOOKING_STATUS]: 'pending'
	}),
	week: buildRouteTarget(ROUTES.CALENDAR)
}

const isStartAppPayload = (value: unknown): value is StartAppPayload =>
	typeof value === 'object' && value !== null

const readStringField = (payload: StartAppPayload, key: string) => {
	const value = payload[key]

	return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

const tryParseJson = (value: string) => {
	try {
		return JSON.parse(value) as unknown
	} catch {
		return null
	}
}

const getDecodedStartParamCandidates = (value: string) => {
	const trimmedValue = value.trim()
	const candidates = [trimmedValue]

	try {
		const decodedValue = decodeStartParam(trimmedValue)

		if (decodedValue.trim()) {
			candidates.unshift(decodedValue.trim())
		}
	} catch {
		return [...new Set(candidates)]
	}

	return [...new Set(candidates)]
}

const resolveJsonStartAppTarget = (payload: StartAppPayload): To | null => {
	const routeAlias =
		readStringField(payload, 'screen') ??
		readStringField(payload, 'route') ??
		readStringField(payload, 'target')

	if (routeAlias) {
		const routeTarget = START_APP_ROUTE_TARGETS[routeAlias.toLowerCase()]

		if (routeTarget) {
			return routeTarget
		}
	}

	const entityType = readStringField(payload, 'type')?.toLowerCase()
	const entityId = readStringField(payload, 'id')
	const bookingId =
		readStringField(payload, 'bookingId') ??
		readStringField(payload, 'rentalId') ??
		(entityType && START_APP_BOOKING_TYPES.has(entityType) ? entityId : undefined)
	const assetId =
		readStringField(payload, 'assetId') ??
		readStringField(payload, 'bikeId') ??
		(entityType && START_APP_ASSET_TYPES.has(entityType) ? entityId : undefined)

	if (bookingId) {
		return buildRouteTarget(ROUTES.BOOKINGS, {
			[ROUTE_QUERY_KEYS.BOOKING_ID]: bookingId
		})
	}

	if (assetId) {
		return buildRouteTarget(ROUTES.ASSETS, {
			[ROUTE_QUERY_KEYS.ASSET_ID]: assetId
		})
	}

	return null
}

const resolveStringStartAppTarget = (value: string): To | null => {
	const normalizedValue = value.trim().toLowerCase()

	if (!normalizedValue) {
		return null
	}

	if (START_APP_ROUTE_TARGETS[normalizedValue]) {
		return START_APP_ROUTE_TARGETS[normalizedValue]
	}

	const entityMatch = /^([a-z]+)[:/]([^/]+)$/i.exec(value.trim())

	if (!entityMatch) {
		return null
	}

	const [, entityType, entityId] = entityMatch
	const normalizedType = entityType.toLowerCase()

	if (START_APP_BOOKING_TYPES.has(normalizedType)) {
		return buildRouteTarget(ROUTES.BOOKINGS, {
			[ROUTE_QUERY_KEYS.BOOKING_ID]: entityId
		})
	}

	if (START_APP_ASSET_TYPES.has(normalizedType)) {
		return buildRouteTarget(ROUTES.ASSETS, {
			[ROUTE_QUERY_KEYS.ASSET_ID]: entityId
		})
	}

	return null
}

export const resolveStartAppTarget = (startParam?: string | null): To | null => {
	if (!startParam?.trim()) {
		return null
	}

	for (const candidate of getDecodedStartParamCandidates(startParam)) {
		const jsonPayload = tryParseJson(candidate)

		if (jsonPayload && isStartAppPayload(jsonPayload)) {
			const jsonTarget = resolveJsonStartAppTarget(jsonPayload)

			if (jsonTarget) {
				return jsonTarget
			}
		}

		const stringTarget = resolveStringStartAppTarget(candidate)

		if (stringTarget) {
			return stringTarget
		}
	}

	return null
}

export const getStartAppParam = () => {
	try {
		const telegramStartParam = retrieveLaunchParams().tgWebAppStartParam

		if (telegramStartParam?.trim()) {
			return telegramStartParam
		}
	} catch {
		// Ignore launch params access errors outside Telegram.
	}

	if (typeof window === 'undefined') {
		return undefined
	}

	const currentSearchParams = new URLSearchParams(window.location.search)

	return (
		currentSearchParams.get(ROUTE_QUERY_KEYS.START_APP) ??
		currentSearchParams.get(ROUTE_QUERY_KEYS.TG_WEB_APP_START_PARAM) ??
		undefined
	)
}

export const getStartAppTarget = () => resolveStartAppTarget(getStartAppParam())

export const getSafeRedirectTarget = (value: unknown): To | null => {
	if (typeof value === 'string') {
		return value && value !== ROUTES.AUTH ? value : null
	}

	if (!isStartAppPayload(value)) {
		return null
	}

	const pathname = readStringField(value, 'pathname')

	if (!pathname || pathname === ROUTES.AUTH) {
		return null
	}

	const search = typeof value.search === 'string' ? value.search : ''
	const hash = typeof value.hash === 'string' ? value.hash : ''

	return {
		hash,
		pathname,
		search
	}
}
