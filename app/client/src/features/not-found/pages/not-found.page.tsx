import { useI18n } from '@/app/i18n/use-i18n'
import { ROUTES } from '@/shared/model/routes'
import { FullErrorScreen } from '@/shared/widgets'

const NotFoundPage = () => {
	const { t } = useI18n()

	return (
		<FullErrorScreen
			tone='not-found'
			eyebrow={t('error.notFoundEyebrow')}
			statusCode='404'
			title={t('error.notFoundTitle')}
			message={t('error.notFoundMessage')}
			actions={[
				{
					label: t('common.goToDashboard'),
					onClick: () => window.location.assign(ROUTES.DASHBOARD)
				},
				{
					label: t('common.goBack'),
					variant: 'secondary',
					onClick: () => window.history.back()
				}
			]}
		/>
	)
}

export default NotFoundPage
