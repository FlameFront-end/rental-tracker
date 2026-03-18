import { useI18n } from '@/app/i18n/use-i18n'
import { Button } from '@/shared/kit'

import styles from './AssetsEmptyState.module.scss'

interface AssetsEmptyStateProps {
	onCreate: () => void
}

const AssetsEmptyState = ({ onCreate }: AssetsEmptyStateProps) => {
	const { t } = useI18n()

	return (
		<section className={styles.state}>
			<h3 className={styles.title}>{t('assets.emptyTitle')}</h3>
			<p className={styles.description}>{t('assets.emptyDescription')}</p>
			<Button type='button' onClick={onCreate}>
				{t('assets.emptyAction')}
			</Button>
		</section>
	)
}

export default AssetsEmptyState
