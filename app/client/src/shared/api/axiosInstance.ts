import axios from 'axios'

import { getAccessToken } from '@/shared/lib/auth/token-storage'
import { env } from '@/shared/model'

const isNgrokApi = env.API_URL?.includes('ngrok-free.app') || env.API_URL?.includes('ngrok.io')

const axiosInstance = axios.create({
	baseURL: env.API_URL,
	timeout: 10000,
	headers: {
		Accept: 'application/json',
		'Content-Type': 'application/json',
		...(isNgrokApi ? { 'ngrok-skip-browser-warning': 'true' } : {})
	}
})

axiosInstance.interceptors.request.use((config) => {
	const accessToken = getAccessToken()

	if (accessToken) {
		config.headers.Authorization = `Bearer ${accessToken}`
	}

	return config
})

export default axiosInstance
