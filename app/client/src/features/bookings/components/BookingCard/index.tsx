import clsx from 'clsx'
import { Check, Clock3, SquarePen, Trash2 } from 'lucide-react'

import { useI18n } from '@/app/i18n/use-i18n'
import type { Booking } from '@/shared/api/services/bookings'
import { Button } from '@/shared/kit'
import {
	formatDateRange,
	formatPrice,
	getBookingDurationDays
} from '@/shared/lib'
import styles from './BookingCard.module.scss'

interface BookingCardProps {
	bikeName: string
	booking: Booking
	className?: string
	compact?: boolean
	isDeleting?: boolean
	isEditing?: boolean
	isUpdatingStatus?: boolean
	onDelete: (booking: Booking) => void
	onEdit: (booking: Booking) => void
	onToggleStatus: (booking: Booking) => void
}

const BookingCard = ({
	bikeName,
	booking,
	className,
	compact = false,
	isDeleting = false,
	isEditing = false,
	isUpdatingStatus = false,
	onDelete,
	onEdit,
	onToggleStatus
}: BookingCardProps) => {
	const { t } = useI18n()
	const duration = getBookingDurationDays(booking.startDate, booking.endDate)
	const isBusy = isDeleting || isUpdatingStatus

	return (
		<article className={clsx(styles.card, compact && styles.compactCard, className)}>
			<div className={styles.header}>
				<div className={styles.heading}>
					<p className={styles.kicker}>{bikeName}</p>
					<h3 className={styles.title}>{booking.clientName}</h3>
				</div>
				<span
					className={styles[booking.status === 'paid' ? 'badgePaid' : 'badgePending']}
				>
					{booking.status === 'paid'
						? t('booking.badge.paid')
						: t('booking.badge.pending')}
				</span>
			</div>

			<div className={styles.metaRow}>
				<div className={styles.metaBlock}>
					<span className={styles.metaLabel}>{t('booking.card.dates')}</span>
					<strong className={styles.metaValue}>{formatDateRange(booking.startDate, booking.endDate)}</strong>
				</div>
				<div className={`${styles.metaBlock} ${styles.metaBlockPrice}`}>
					<span className={styles.metaLabel}>{t('booking.card.price')}</span>
					<strong className={`${styles.metaValue} ${styles.metaValuePrice}`}>
						{formatPrice(booking.price)}
					</strong>
				</div>
				<div className={styles.metaBlock}>
					<span className={styles.metaLabel}>{t('booking.card.duration')}</span>
					<strong className={styles.metaValue}>{t('booking.card.days', { count: duration })}</strong>
				</div>
			</div>

			<div className={styles.actions}>
				<div className={styles.leadingActions}>
					<button
						type='button'
						className={styles.iconAction}
						disabled={isDeleting}
						aria-label={isEditing ? t('booking.card.editing') : t('booking.card.edit')}
						title={isEditing ? t('booking.card.editing') : t('booking.card.edit')}
						onClick={() => onEdit(booking)}
					>
						<SquarePen size={16} strokeWidth={1.9} aria-hidden='true' />
					</button>
					<button
						type='button'
						className={`${styles.iconAction} ${styles.deleteAction}`}
						disabled={isBusy}
						aria-label={isDeleting ? t('booking.card.deleting') : t('booking.card.delete')}
						title={isDeleting ? t('booking.card.deleting') : t('booking.card.delete')}
						onClick={() => onDelete(booking)}
					>
						<Trash2 size={17} strokeWidth={1.9} aria-hidden='true' />
					</button>
				</div>

				<Button
					type='button'
					variant={booking.status === 'paid' ? 'secondary' : 'primary'}
					size='sm'
					className={styles.statusAction}
					disabled={isBusy}
					aria-label={
						isUpdatingStatus
							? t('booking.card.savingStatus')
							: booking.status === 'paid'
								? t('booking.card.markPending')
								: t('booking.card.markPaid')
					}
					title={
						booking.status === 'paid'
							? t('booking.card.markPending')
							: t('booking.card.markPaid')
					}
					onClick={() => onToggleStatus(booking)}
				>
					{isUpdatingStatus ? (
						t('common.saving')
					) : (
						<>
							{booking.status === 'paid' ? (
								<Clock3 size={16} strokeWidth={1.9} aria-hidden='true' />
							) : (
								<Check size={16} strokeWidth={2.1} aria-hidden='true' />
							)}
							<span>
								{booking.status === 'paid'
									? t('booking.card.markPendingShort')
									: t('booking.card.markPaidShort')}
							</span>
						</>
					)}
				</Button>
			</div>
		</article>
	)
}

export default BookingCard
