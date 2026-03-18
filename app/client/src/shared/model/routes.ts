export const ROUTES = {
	AUTH: '/auth',
	ASSETS: '/assets',
	BOOKINGS: '/bookings',
	CALENDAR: '/calendar',
	DASHBOARD: '/dashboard'
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
