import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppRoutes } from '@/app/components/AppRoutes'
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
				path: ROUTES.DASHBOARD,
				element: <DashboardPage />
			},
			{
				path: '*',
				element: <NotFoundPage />
			}
		]
	}
])
