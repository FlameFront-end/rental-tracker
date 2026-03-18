export const ROUTES = {
	AUTH: '/auth',
	ASSETS: '/assets',
	BOOKINGS: '/bookings',
	CALENDAR: '/calendar',
	DASHBOARD: '/dashboard',
	SETTINGS: '/settings'
} as const

export const ROUTE_QUERY_KEYS = {
	ASSET_ID: 'assetId',
	BOOKING_ID: 'bookingId',
	BOOKING_STATUS: 'status',
	FILTER_ASSET_ID: 'filterAssetId',
	FOCUS_BOOKING_ID: 'focusBookingId',
	START_APP: 'startapp',
	TG_WEB_APP_START_PARAM: 'tgWebAppStartParam'
} as const

export const APP_SECTION_ITEMS = [
	{
		labelKey: 'nav.today',
		to: ROUTES.DASHBOARD
	},
	{
		labelKey: 'nav.bikes',
		to: ROUTES.ASSETS
	},
	{
		labelKey: 'nav.rentals',
		to: ROUTES.BOOKINGS
	},
	{
		labelKey: 'nav.week',
		to: ROUTES.CALENDAR
	}
] as const
