import { useI18n } from '@/app/i18n/use-i18n'
import { Button } from '@/shared/kit'

import styles from './BookingsEmptyState.module.scss'

interface BookingsEmptyStateProps {
	hasBikes: boolean
	hasFilters: boolean
	onClearFilters?: () => void
	onCreate: () => void
	onOpenBikes: () => void
}

const BookingsEmptyState = ({
	hasBikes,
	hasFilters,
	onClearFilters,
	onCreate,
	onOpenBikes
}: BookingsEmptyStateProps) => {
	const { t } = useI18n()
	const title = !hasBikes
		? t('bookings.emptyNoBikeTitle')
		: hasFilters
			? t('bookings.emptyFilteredTitle')
			: t('bookings.emptyInitialTitle')
	const description = !hasBikes
		? t('bookings.emptyNoBikeDescription')
		: hasFilters
			? t('bookings.emptyFilteredDescription')
			: t('bookings.emptyInitialDescription')

	return (
		<section className={styles.state}>
			<h3 className={styles.title}>{title}</h3>
			<p className={styles.description}>{description}</p>
			<Button
				type='button'
				variant={hasFilters ? 'secondary' : 'primary'}
				onClick={
					!hasBikes ? onOpenBikes : hasFilters && onClearFilters ? onClearFilters : onCreate
				}
			>
				{!hasBikes
					? t('bookings.openBikes')
					: hasFilters
						? t('bookings.clearFilters')
						: t('common.createRental')}
			</Button>
		</section>
	)
}

export default BookingsEmptyState
