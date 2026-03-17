const fallbackEnv = {
	API_URL: 'http://localhost:3000/api',
	APP_NAME: 'Rental Tracker',
	DEV_TELEGRAM_ID: import.meta.env.DEV ? '900000001' : ''
}

export const env = {
	API_URL: import.meta.env.VITE_API_URL || fallbackEnv.API_URL,
	APP_NAME: import.meta.env.VITE_APP_NAME || fallbackEnv.APP_NAME,
	DEV_TELEGRAM_ID: import.meta.env.VITE_DEV_TELEGRAM_ID || fallbackEnv.DEV_TELEGRAM_ID
} as const
