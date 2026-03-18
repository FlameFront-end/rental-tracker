import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuthSession } from '@/app/session/use-auth-session'
import { ROUTES } from '@/shared/model'
import { FullScreenLoader } from '@/shared/widgets'

export const ProtectedRoute = () => {
	const location = useLocation()
	const { status } = useAuthSession()

	if (status === 'bootstrapping') {
		return <FullScreenLoader />
	}

	if (status !== 'authenticated') {
		return (
			<Navigate
				to={ROUTES.AUTH}
				replace
				state={{
					from: location
				}}
			/>
		)
	}

	return <Outlet />
}
