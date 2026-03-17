import axios from 'axios'

import { getAccessToken } from '@/shared/lib/auth/token-storage'
import { env } from '@/shared/model'

const axiosInstance = axios.create({
	baseURL: env.API_URL,
	timeout: 10000,
	headers: {
		Accept: 'application/json',
		'Content-Type': 'application/json'
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
