import { Navigate, Outlet } from 'react-router-dom'

import { useAuthSession } from '@/app/session/use-auth-session'
import { ROUTES } from '@/shared/model'
import { FullScreenLoader } from '@/shared/widgets'

export const AdminRoute = () => {
  const { isAdmin, status } = useAuthSession()

  if (status === 'bootstrapping') {
    return <FullScreenLoader />
  }

  if (!isAdmin) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return <Outlet />
}
