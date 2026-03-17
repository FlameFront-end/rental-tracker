import { RouterProvider } from 'react-router-dom'

import { ErrorBoundary } from '@/shared/components/ErrorBoundary'

import { router } from './model/router'
import { Providers } from './model/providers'

export const App = () => {
	return (
		<ErrorBoundary>
			<Providers>
				<RouterProvider router={router} />
			</Providers>
		</ErrorBoundary>
	)
}
