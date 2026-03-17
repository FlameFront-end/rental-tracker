const fallbackEnv = {
	API_URL: 'http://localhost:3000/api',
	APP_NAME: 'Rental Tracker'
}

export const env = {
	API_URL: import.meta.env.VITE_API_URL || fallbackEnv.API_URL,
	APP_NAME: import.meta.env.VITE_APP_NAME || fallbackEnv.APP_NAME
} as const
