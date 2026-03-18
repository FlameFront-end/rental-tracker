import { useCallback, useState } from 'react'

import { Link, useNavigate } from 'react-router-dom'

import { useI18n } from '@/app/i18n/use-i18n'
import { useTelegramBackButton } from '@/app/telegram/telegram-back-button'
import { useDashboardOccupancyQuery } from '@/shared/api/services/dashboard'
import { Button, Skeleton } from '@/shared/kit'
import {
	addDaysToDateOnly,
	formatDateRange,
	formatDayColumnLabel,
	getApiErrorMessage,
	getTodayDateOnly,
	isDateWithinRange
} from '@/shared/lib'
import { ROUTES } from '@/shared/model'
import { Layout } from '@/shared/widgets'

import styles from './calendar.module.scss'

const CALENDAR_WINDOW_DAYS = 7
const CALENDAR_SKELETON_BIKES = 3

const CalendarBikeSkeleton = () => {
	return (
		<article className={styles.bikeCard} aria-hidden='true'>
			<div className={styles.bikeHeader}>
				<div className={styles.bikeHeaderCopy}>
					<Skeleton className={styles.bikeNameSkeleton} />
					<Skeleton className={styles.bikeSummarySkeleton} />
				</div>
				<Skeleton className={styles.rowLinkSkeleton} />
			</div>

			<div className={styles.dayStrip}>
				{Array.from({ length: CALENDAR_WINDOW_DAYS }).map((_, index) => (
					<div key={index} className={styles.daySkeleton}>
						<Skeleton className={styles.dayLabelSkeleton} />
						<Skeleton className={styles.dayTitleSkeleton} />
						<Skeleton className={styles.dayMetaSkeleton} />
					</div>
				))}
			</div>
		</article>
	)
}

const CalendarPage = () => {
	const navigate = useNavigate()
	const { t } = useI18n()
	const todayDate = getTodayDateOnly()
	const [rangeStart, setRangeStart] = useState(todayDate)
	const rangeEnd = addDaysToDateOnly(rangeStart, CALENDAR_WINDOW_DAYS - 1)
	const isCurrentRange = rangeStart === todayDate
	const { data, error, isLoading } = useDashboardOccupancyQuery({
		from: rangeStart,
		to: rangeEnd
	})

	const handleShiftRange = (days: number) => {
		setRangeStart((current) => addDaysToDateOnly(current, days))
	}

	const handleResetRange = () => {
		setRangeStart(todayDate)
	}
	const handleBackToDashboard = useCallback(() => {
		navigate(ROUTES.DASHBOARD)
	}, [navigate])

	useTelegramBackButton(true, handleBackToDashboard)

	return (
		<Layout title={t('calendar.title')} subtitle={t('calendar.subtitle')}>
			<div className={styles.page}>
				<section className={styles.toolbar}>
					<div className={styles.rangeGroup}>
						<span className={styles.eyebrow}>{t('common.range')}</span>
						<h2 className={styles.rangeTitle}>{formatDateRange(rangeStart, rangeEnd)}</h2>
					</div>
					<div className={styles.actions}>
						<Button
							type='button'
							variant='ghost'
							size='sm'
							className={styles.navAction}
							onClick={() => handleShiftRange(-7)}
						>
							{t('common.prev')}
						</Button>
						<Button
							type='button'
							variant='secondary'
							size='sm'
							className={`${styles.navAction} ${isCurrentRange ? styles.navActionActive : ''}`}
							aria-pressed={isCurrentRange}
							onClick={handleResetRange}
						>
							{t('common.today')}
						</Button>
						<Button
							type='button'
							variant='ghost'
							size='sm'
							className={styles.navAction}
							onClick={() => handleShiftRange(7)}
						>
							{t('common.next')}
						</Button>
					</div>
				</section>

				{error ? (
					<p className={styles.error}>
						{getApiErrorMessage(error, t('calendar.errorLoad'))}
					</p>
				) : null}

				{!isLoading && data && data.bikes.length === 0 ? (
					<section className={styles.emptyState}>
						<h3 className={styles.emptyTitle}>{t('calendar.emptyTitle')}</h3>
						<p className={styles.emptyDescription}>{t('calendar.emptyDescription')}</p>
						<Link className={styles.ctaLink} to={ROUTES.ASSETS}>
							{t('calendar.openBikes')}
						</Link>
					</section>
				) : null}

				{isLoading ? (
					<section className={styles.timelineList}>
						{Array.from({ length: CALENDAR_SKELETON_BIKES }).map((_, index) => (
							<CalendarBikeSkeleton key={index} />
						))}
					</section>
				) : null}

				{!isLoading && data && data.bikes.length > 0 ? (
					<section className={styles.timelineList}>
						{data.bikes.map((bike) => (
							<article key={bike.assetId} className={styles.bikeCard}>
								<div className={styles.bikeHeader}>
									<div>
										<h3 className={styles.bikeName}>{bike.assetName}</h3>
										<p className={styles.bikeSummary}>
											{bike.bookings.length === 0
												? t('calendar.noRentalsInRange')
												: t('calendar.rentalsInRange', { count: bike.bookings.length })}
										</p>
									</div>
									<Link
										className={styles.rowLink}
										to={`${ROUTES.BOOKINGS}?filterAssetId=${bike.assetId}`}
									>
										{t('common.open')}
									</Link>
								</div>

								<div className={styles.dayStrip}>
									{data.days.map((day) => {
										const booking = bike.bookings.find((item) =>
											isDateWithinRange(day, item.startDate, item.endDate)
										)

										return booking ? (
											<Link
												key={`${bike.assetId}-${day}`}
												className={
													booking.status === 'paid'
														? styles.occupiedPaidCell
														: styles.occupiedPendingCell
												}
												to={`${ROUTES.BOOKINGS}?filterAssetId=${bike.assetId}&focusBookingId=${booking.id}`}
											>
												<span className={styles.dayLabel}>{formatDayColumnLabel(day)}</span>
												<strong>{booking.clientName}</strong>
												<span>
													{booking.status === 'paid'
														? t('booking.status.paid')
														: t('booking.status.pending')}
												</span>
											</Link>
										) : (
											<Link
												key={`${bike.assetId}-${day}`}
												className={styles.freeCell}
												to={`${ROUTES.BOOKINGS}?assetId=${bike.assetId}&startDate=${day}&endDate=${day}`}
											>
												<span className={styles.dayLabel}>{formatDayColumnLabel(day)}</span>
												<strong>{t('common.free')}</strong>
												<span>{t('calendar.newRental')}</span>
											</Link>
										)
									})}
								</div>
							</article>
						))}
					</section>
				) : null}
			</div>
		</Layout>
	)
}

export default CalendarPage
