import { Outlet, useLocation } from 'react-router-dom'

import { useAuthSession } from '@/app/session/use-auth-session'
import { APP_SECTION_ITEMS, ROUTES } from '@/shared/model'
import { AppNavigation } from '@/shared/widgets'

export const AppRoutes = () => {
	const location = useLocation()
	const { status } = useAuthSession()
	const shouldShowNavigation =
		status === 'authenticated' &&
		location.pathname !== ROUTES.AUTH &&
		APP_SECTION_ITEMS.some((item) => location.pathname.startsWith(item.to))

	return (
		<>
			<Outlet />
			{shouldShowNavigation ? <AppNavigation /> : null}
		</>
	)
}
