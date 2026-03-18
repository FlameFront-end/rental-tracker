import { Navigate } from 'react-router-dom'

import { getStoredLastRoute } from '@/app/telegram/app-storage'
import { getStartAppTarget } from '@/app/telegram/startapp'
import { ROUTES } from '@/shared/model'

export const StartAppRedirect = () => {
	return <Navigate to={getStartAppTarget() ?? getStoredLastRoute() ?? ROUTES.DASHBOARD} replace />
}
