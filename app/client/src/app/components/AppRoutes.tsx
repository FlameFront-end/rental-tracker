import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { persistLastRoute } from '@/app/telegram/app-storage'
import { useAuthSession } from '@/app/session/use-auth-session'
import { APP_SECTION_ITEMS, ROUTES } from '@/shared/model'
import { AppNavigation } from '@/shared/widgets'

export const AppRoutes = () => {
	const location = useLocation()
	const { status } = useAuthSession()
	const activeSection = APP_SECTION_ITEMS.find((item) => location.pathname.startsWith(item.to))
	const shouldShowNavigation =
		status === 'authenticated' &&
		location.pathname !== ROUTES.AUTH &&
		Boolean(activeSection)

	useEffect(() => {
		if (status !== 'authenticated' || !activeSection) {
			return
		}

		persistLastRoute(activeSection.to)
	}, [activeSection, status])

	return (
		<>
			<Outlet />
			{shouldShowNavigation ? <AppNavigation /> : null}
		</>
	)
}
