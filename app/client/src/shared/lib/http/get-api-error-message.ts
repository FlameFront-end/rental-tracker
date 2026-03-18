import type { AxiosError } from 'axios'

export const getApiErrorMessage = (
	error: unknown,
	fallbackMessage = 'Request failed. Please try again.'
) => {
	const axiosError = error as AxiosError<{ message?: string | string[] }>
	const responseMessage = axiosError.response?.data?.message

	if (Array.isArray(responseMessage) && responseMessage.length > 0) {
		return responseMessage.join(', ')
	}

	if (typeof responseMessage === 'string' && responseMessage.trim()) {
		return responseMessage
	}

	if (error instanceof Error && error.message.trim()) {
		return error.message
	}

	return fallbackMessage
}
