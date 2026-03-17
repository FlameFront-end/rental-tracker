import { useRouteError } from 'react-router-dom'

import { FullErrorScreen } from '@/shared/widgets'

const ErrorPage = () => {
	const error = useRouteError()
	const message = error instanceof Error ? error.message : 'Something went wrong while rendering the page.'

	return <FullErrorScreen title='Application Error' message={message} />
}

export default ErrorPage
