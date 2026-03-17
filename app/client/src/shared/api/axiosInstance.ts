import axios from 'axios'

import { env } from '@/shared/model'

const axiosInstance = axios.create({
	baseURL: env.API_URL,
	timeout: 10000,
	headers: {
		Accept: 'application/json',
		'Content-Type': 'application/json'
	}
})

export default axiosInstance
