import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppRoutes } from '@/app/components/AppRoutes'
import { ProtectedRoute } from '@/app/components/ProtectedRoute'
import AuthPage from '@/features/auth/pages/auth.page'
import AssetsPage from '@/features/assets/pages/assets.page'
import BookingsPage from '@/features/bookings/pages/bookings.page'
import CalendarPage from '@/features/calendar/pages/calendar.page'
import DashboardPage from '@/features/dashboard/pages/dashboard.page'
import ErrorPage from '@/features/error/pages/error.page'
import NotFoundPage from '@/features/not-found/pages/not-found.page'
import { ROUTES } from '@/shared/model/routes'

export const router = createBrowserRouter([
	{
		element: <AppRoutes />,
		errorElement: <ErrorPage />,
		children: [
			{
				index: true,
				element: <Navigate to={ROUTES.DASHBOARD} replace />
			},
			{
				path: ROUTES.AUTH,
				element: <AuthPage />
			},
			{
				element: <ProtectedRoute />,
				children: [
					{
						path: ROUTES.DASHBOARD,
						element: <DashboardPage />
					},
					{
						path: ROUTES.ASSETS,
						element: <AssetsPage />
					},
					{
						path: ROUTES.BOOKINGS,
						element: <BookingsPage />
					},
					{
						path: ROUTES.CALENDAR,
						element: <CalendarPage />
					}
				]
			},
			{
				path: '*',
				element: <NotFoundPage />
			}
		]
	}
])
