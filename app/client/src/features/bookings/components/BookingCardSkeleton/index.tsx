import clsx from 'clsx'

import { Skeleton } from '@/shared/kit'

import styles from './BookingCardSkeleton.module.scss'

interface BookingCardSkeletonProps {
	compact?: boolean
}

const BookingCardSkeleton = ({ compact = false }: BookingCardSkeletonProps) => {
	return (
		<article className={clsx(styles.card, compact && styles.compactCard)} aria-hidden='true'>
			<div className={styles.header}>
				<div className={styles.heading}>
					<Skeleton className={styles.kicker} />
					<Skeleton className={styles.title} />
				</div>
				<Skeleton className={styles.badge} />
			</div>

			<div className={styles.metaRow}>
				{Array.from({
					length: 3
				}).map((_, index) => (
					<div key={index} className={styles.metaBlock}>
						<Skeleton className={styles.metaLabel} />
						<Skeleton className={styles.metaValue} />
					</div>
				))}
			</div>

			<div className={styles.actions}>
				<div className={styles.leadingActions}>
					<Skeleton className={styles.iconAction} />
					<Skeleton className={styles.iconAction} />
				</div>
				<Skeleton className={styles.statusAction} />
			</div>
		</article>
	)
}

export default BookingCardSkeleton
