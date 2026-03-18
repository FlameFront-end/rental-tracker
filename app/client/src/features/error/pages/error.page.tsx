import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

import { useI18n } from '@/app/i18n/use-i18n'
import { FullErrorScreen } from '@/shared/widgets'
import { ROUTES } from '@/shared/model/routes'

const ErrorPage = () => {
	const { t } = useI18n()
	const error = useRouteError()
	const statusCode = isRouteErrorResponse(error)
		? String(error.status)
		: '500'
	const detail =
		import.meta.env.DEV && error instanceof Error
			? error.message
			: isRouteErrorResponse(error) && import.meta.env.DEV
				? error.statusText
				: undefined

	return (
		<FullErrorScreen
			tone='error'
			eyebrow={t('error.routeEyebrow')}
			statusCode={statusCode}
			title={t('error.routeTitle')}
			message={t('error.routeMessage')}
			detail={detail}
			actions={[
				{
					label: t('common.reloadApp'),
					onClick: () => window.location.reload()
				},
				{
					label: t('common.goToDashboard'),
					variant: 'secondary',
					onClick: () => window.location.assign(ROUTES.DASHBOARD)
				}
			]}
		/>
	)
}

export default ErrorPage
