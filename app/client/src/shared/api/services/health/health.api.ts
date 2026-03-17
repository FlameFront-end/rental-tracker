import { useQuery } from '@tanstack/react-query'

import axiosInstance from '@/shared/api/axiosInstance'

export interface HealthResponse {
	status: 'ok'
	database: 'up'
	environment: string
	timestamp: string
}

export const healthApi = {
	getStatus: async () => {
		const response = await axiosInstance.get<HealthResponse>('/health')
		return response.data
	}
}

export const useHealthCheck = () => {
	return useQuery({
		queryKey: ['health'],
		queryFn: healthApi.getStatus
	})
}
