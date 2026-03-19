import { ChevronLeft, ChevronRight } from 'lucide-react'

import {
	useCallback,
	useEffect,
	useMemo,
	useState
} from 'react'

import clsx from 'clsx'
import dayjs from 'dayjs'
import useEmblaCarousel from 'embla-carousel-react'
import WheelGesturesPlugin from 'embla-carousel-wheel-gestures'
import { Link, useNavigate } from 'react-router-dom'

import { useI18n } from '@/app/i18n/use-i18n'
import { useTelegramBackButton } from '@/app/telegram/telegram-back-button'
import { useTelegramHaptics } from '@/app/telegram/use-telegram-haptics'
import type { DashboardBookingItem } from '@/shared/api/services/dashboard'
import { useDashboardOccupancyQuery } from '@/shared/api/services/dashboard'
import { Button, Skeleton } from '@/shared/kit'
import {
	addDaysToDateOnly,
	formatDateRange,
	formatPrice,
	getApiErrorMessage,
	getIntlLocale,
	getTodayDateOnly,
	isDateWithinRange
} from '@/shared/lib'
import { ROUTES, ROUTE_QUERY_KEYS } from '@/shared/model'
import { Layout } from '@/shared/widgets'

import styles from './calendar.module.scss'

const CALENDAR_WINDOW_DAYS = 7
const CALENDAR_SKELETON_CARDS = 3

type SelectedDayState = 'active' | 'ending' | 'starting'

interface DaySummary {
	date: string
	freeCount: number
	occupiedCount: number
}

interface OccupiedBikeEntry {
	assetId: string
	assetName: string
	booking: DashboardBookingItem
	dayState: SelectedDayState
}

interface FreeBikeEntry {
	assetId: string
	assetName: string
}

const capitalizeFirstLetter = (value: string) =>
	value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value

const buildBookingsLink = (params: Record<string, string>) =>
	`${ROUTES.BOOKINGS}?${new URLSearchParams(params).toString()}`

const CalendarPlannerSkeleton = () => {
	return (
		<section className={styles.plannerCard} aria-hidden='true'>
			<div className={styles.plannerHeader}>
				<div className={styles.selectedDayGroup}>
					<Skeleton className={styles.plannerTitleSkeleton} />
					<Skeleton className={styles.plannerCaptionSkeleton} />
				</div>
				<div className={styles.plannerActions}>
					<Skeleton className={styles.actionSkeleton} />
					<Skeleton className={styles.actionSkeletonWide} />
					<Skeleton className={styles.actionSkeleton} />
				</div>
			</div>

			<div className={styles.metricsGrid}>
				{Array.from({ length: 3 }).map((_, index) => (
					<div key={index} className={styles.metricCard}>
						<Skeleton className={styles.metricLabelSkeleton} />
						<Skeleton className={styles.metricValueSkeleton} />
					</div>
				))}
			</div>

			<div className={styles.dayRailViewport}>
				<div className={styles.dayRailContainer}>
					{Array.from({ length: CALENDAR_WINDOW_DAYS }).map((_, index) => (
						<div key={index} className={styles.dayRailSlide}>
							<Skeleton className={styles.dayChipSkeleton} />
						</div>
					))}
				</div>
			</div>
		</section>
	)
}

const CalendarSectionSkeleton = ({ title }: { title: string }) => {
	return (
		<section className={styles.sectionCard} aria-hidden='true'>
			<div className={styles.sectionHeader}>
				<h2 className={styles.sectionTitle}>{title}</h2>
				<Skeleton className={styles.sectionCountSkeleton} />
			</div>

			<div className={styles.cardList}>
				{Array.from({ length: CALENDAR_SKELETON_CARDS }).map((_, index) => (
					<Skeleton key={index} className={styles.statusCardSkeleton} />
				))}
			</div>
		</section>
	)
}

const CalendarPage = () => {
	const navigate = useNavigate()
	const { locale, t } = useI18n()
	const { selectionChanged } = useTelegramHaptics()
	const todayDate = getTodayDateOnly()
	const [rangeStart, setRangeStart] = useState(todayDate)
	const [selectedDay, setSelectedDay] = useState(todayDate)
	const dayRailPlugins = useMemo(
		() => [
			WheelGesturesPlugin({
				forceWheelAxis: 'x',
				wheelDraggingClass: styles.dayRailWheelDragging
			})
		],
		[]
	)
	const [dayRailViewportRef, dayRailApi] = useEmblaCarousel(
		{
			align: 'start',
			containScroll: 'trimSnaps',
			dragFree: true
		},
		dayRailPlugins
	)
	const rangeEnd = addDaysToDateOnly(rangeStart, CALENDAR_WINDOW_DAYS - 1)
	const isCurrentRange = rangeStart === todayDate
	const { data, error, isLoading } = useDashboardOccupancyQuery({
		from: rangeStart,
		to: rangeEnd
	})
	const intlLocale = getIntlLocale(locale)
	const dayTitleFormatter = useMemo(
		() =>
			new Intl.DateTimeFormat(intlLocale, {
				day: 'numeric',
				month: 'long',
				weekday: 'long',
				year: 'numeric'
			}),
		[intlLocale]
	)
	const chipDayFormatter = useMemo(
		() =>
			new Intl.DateTimeFormat(intlLocale, {
				day: '2-digit'
			}),
		[intlLocale]
	)
	const chipWeekdayFormatter = useMemo(
		() =>
			new Intl.DateTimeFormat(intlLocale, {
				weekday: 'short'
			}),
		[intlLocale]
	)
	const dayOffset = useMemo(
		() =>
			Math.max(
				0,
				Math.min(
					dayjs(selectedDay).diff(dayjs(rangeStart), 'day'),
					CALENDAR_WINDOW_DAYS - 1
				)
			),
		[rangeStart, selectedDay]
	)
	const daySummaries = useMemo<DaySummary[]>(() => {
		if (!data) {
			return []
		}

		const totalBikes = data.bikes.length

		return data.days.map((date) => {
			const occupiedCount = data.bikes.reduce((count, bike) => {
				const isOccupied = bike.bookings.some((booking) =>
					isDateWithinRange(date, booking.startDate, booking.endDate)
				)

				return count + (isOccupied ? 1 : 0)
			}, 0)

			return {
				date,
				freeCount: totalBikes - occupiedCount,
				occupiedCount
			}
		})
	}, [data])
	const selectedDaySummary = useMemo(
		() => daySummaries.find((item) => item.date === selectedDay) ?? null,
		[daySummaries, selectedDay]
	)
	const { freeEntries, occupiedEntries } = useMemo(() => {
		const occupied: OccupiedBikeEntry[] = []
		const free: FreeBikeEntry[] = []

		if (!data) {
			return {
				freeEntries: free,
				occupiedEntries: occupied
			}
		}

		for (const bike of data.bikes) {
			const booking = bike.bookings.find((item) =>
				isDateWithinRange(selectedDay, item.startDate, item.endDate)
			)

			if (!booking) {
				free.push({
					assetId: bike.assetId,
					assetName: bike.assetName
				})
				continue
			}

			const dayState: SelectedDayState =
				selectedDay === booking.endDate
					? 'ending'
					: selectedDay === booking.startDate
						? 'starting'
						: 'active'

			occupied.push({
				assetId: bike.assetId,
				assetName: bike.assetName,
				booking,
				dayState
			})
		}

		const getOccupiedRank = (item: OccupiedBikeEntry) => {
			if (item.dayState === 'ending') {
				return 0
			}

			if (item.booking.status === 'pending') {
				return 1
			}

			if (item.dayState === 'starting') {
				return 2
			}

			return 3
		}

		occupied.sort((left, right) => {
			const rankDiff = getOccupiedRank(left) - getOccupiedRank(right)

			if (rankDiff !== 0) {
				return rankDiff
			}

			const endDateDiff = left.booking.endDate.localeCompare(right.booking.endDate)

			if (endDateDiff !== 0) {
				return endDateDiff
			}

			return left.assetName.localeCompare(right.assetName, intlLocale)
		})

		free.sort((left, right) => left.assetName.localeCompare(right.assetName, intlLocale))

		return {
			freeEntries: free,
			occupiedEntries: occupied
		}
	}, [data, intlLocale, selectedDay])
	const selectedDayTitle = capitalizeFirstLetter(
		dayTitleFormatter.format(dayjs(selectedDay).toDate())
	)
	const totalBikes = data?.bikes.length ?? 0

	useEffect(() => {
		if (!data || data.days.length === 0 || data.days.includes(selectedDay)) {
			return
		}

		setSelectedDay(data.days[0])
	}, [data, selectedDay])

	useEffect(() => {
		if (!dayRailApi || daySummaries.length === 0) {
			return
		}

		const selectedIndex = daySummaries.findIndex((item) => item.date === selectedDay)

		if (selectedIndex >= 0) {
			dayRailApi.scrollTo(selectedIndex)
		}
	}, [dayRailApi, daySummaries, selectedDay])

	const handleShiftRange = (days: number) => {
		selectionChanged()

		const nextRangeStart = addDaysToDateOnly(rangeStart, days)
		const nextSelectedDay = addDaysToDateOnly(nextRangeStart, dayOffset)

		setRangeStart(nextRangeStart)
		setSelectedDay(nextSelectedDay)
	}

	const handleResetRange = () => {
		if (isCurrentRange && selectedDay === todayDate) {
			return
		}

		selectionChanged()
		setRangeStart(todayDate)
		setSelectedDay(todayDate)
	}

	const handleSelectDay = (day: string) => {
		if (day === selectedDay) {
			return
		}

		selectionChanged()
		setSelectedDay(day)
	}

	const handleBackToDashboard = useCallback(() => {
		navigate(ROUTES.DASHBOARD)
	}, [navigate])

	useTelegramBackButton(true, handleBackToDashboard)

	return (
		<Layout title={t('calendar.title')} subtitle={t('calendar.subtitle')}>
			<div className={styles.page}>
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
					<div className={styles.loadingStack}>
						<CalendarPlannerSkeleton />
						<CalendarSectionSkeleton title={t('calendar.busySection')} />
						<CalendarSectionSkeleton title={t('calendar.freeSection')} />
					</div>
				) : null}

				{!isLoading && data && data.bikes.length > 0 ? (
					<>
						<section className={styles.plannerCard}>
							<div className={styles.plannerHeader}>
								<div className={styles.selectedDayGroup}>
									<span className={styles.eyebrow}>{t('calendar.selectedDay')}</span>
									<h2 className={styles.selectedDayTitle}>{selectedDayTitle}</h2>
									<p className={styles.rangeCaption}>
										{t('common.range')}: {formatDateRange(rangeStart, rangeEnd)}
									</p>
								</div>

								<div className={styles.plannerActions}>
									<Button
										type='button'
										variant='ghost'
										size='sm'
										className={styles.actionButton}
										aria-label={t('common.prev')}
										onClick={() => handleShiftRange(-7)}
									>
										<ChevronLeft size={16} strokeWidth={2} aria-hidden='true' />
									</Button>
									<Button
										type='button'
										variant={isCurrentRange ? 'secondary' : 'ghost'}
										size='sm'
										className={styles.actionButtonToday}
										aria-pressed={isCurrentRange && selectedDay === todayDate}
										onClick={handleResetRange}
									>
										{t('common.today')}
									</Button>
									<Button
										type='button'
										variant='ghost'
										size='sm'
										className={styles.actionButton}
										aria-label={t('common.next')}
										onClick={() => handleShiftRange(7)}
									>
										<ChevronRight size={16} strokeWidth={2} aria-hidden='true' />
									</Button>
								</div>
							</div>

							<div className={styles.metricsGrid}>
								<div className={clsx(styles.metricCard, styles.metricCardTotal)}>
									<span className={styles.metricLabel}>{t('calendar.metricTotal')}</span>
									<strong className={styles.metricValue}>{totalBikes}</strong>
								</div>
								<div className={clsx(styles.metricCard, styles.metricCardBusy)}>
									<span className={styles.metricLabel}>{t('calendar.metricBusy')}</span>
									<strong className={styles.metricValue}>
										{selectedDaySummary?.occupiedCount ?? 0}
									</strong>
								</div>
								<div className={clsx(styles.metricCard, styles.metricCardFree)}>
									<span className={styles.metricLabel}>{t('calendar.metricFree')}</span>
									<strong className={styles.metricValue}>
										{selectedDaySummary?.freeCount ?? 0}
									</strong>
								</div>
							</div>

							<div className={styles.dayRailViewport} ref={dayRailViewportRef}>
								<div className={styles.dayRailContainer}>
									{daySummaries.map((summary) => {
									const isSelected = summary.date === selectedDay
									const isToday = summary.date === todayDate
									const chipMeta =
										summary.occupiedCount > 0
											? t('calendar.dayBusy', {
														count: summary.occupiedCount
													})
												: t('calendar.dayFree', {
														count: summary.freeCount
													})

										return (
											<div key={summary.date} className={styles.dayRailSlide}>
												<button
													type='button'
													className={clsx(
														styles.dayChip,
														isSelected && styles.dayChipActive,
														isToday && styles.dayChipToday
													)}
													aria-pressed={isSelected}
													onClick={() => handleSelectDay(summary.date)}
												>
													<span className={styles.dayChipWeekday}>
														{capitalizeFirstLetter(
															chipWeekdayFormatter.format(dayjs(summary.date).toDate())
														)}
													</span>
													<strong className={styles.dayChipNumber}>
														{chipDayFormatter.format(dayjs(summary.date).toDate())}
													</strong>
													<span className={styles.dayChipMeta}>{chipMeta}</span>
												</button>
											</div>
										)
									})}
								</div>
							</div>
						</section>

						<div className={styles.sectionsGrid}>
							<section className={styles.sectionCard}>
								<div className={styles.sectionHeader}>
									<h2 className={styles.sectionTitle}>{t('calendar.busySection')}</h2>
									<span className={styles.sectionCount}>{occupiedEntries.length}</span>
								</div>

								{occupiedEntries.length === 0 ? (
									<div className={styles.emptySection}>
										<h3 className={styles.emptySectionTitle}>
											{t('calendar.busyEmptyTitle')}
										</h3>
										<p className={styles.emptySectionDescription}>
											{t('calendar.busyEmptyDescription')}
										</p>
									</div>
								) : (
									<div className={styles.cardList}>
										{occupiedEntries.map((item) => {
											const dayStateLabel =
												item.dayState === 'ending'
													? t('calendar.endsToday')
													: item.dayState === 'starting'
														? t('calendar.startsToday')
														: t('calendar.activeRental')

											return (
												<Link
													key={`${item.assetId}-${item.booking.id}`}
													className={clsx(
														styles.statusCard,
														item.booking.status === 'paid'
															? styles.statusCardPaid
															: styles.statusCardPending
													)}
													to={buildBookingsLink({
														[ROUTE_QUERY_KEYS.FILTER_ASSET_ID]: item.assetId,
														[ROUTE_QUERY_KEYS.FOCUS_BOOKING_ID]: item.booking.id
													})}
												>
													<div className={styles.cardHeader}>
														<div className={styles.cardCopy}>
															<span className={styles.cardEyebrow}>
																{item.booking.clientName}
															</span>
															<h3 className={styles.cardTitle}>{item.assetName}</h3>
														</div>
														<span
															className={
																item.booking.status === 'paid'
																	? styles.badgePaid
																	: styles.badgePending
															}
														>
															{item.booking.status === 'paid'
																? t('booking.badge.paid')
																: t('booking.badge.pending')}
														</span>
													</div>

													<div className={styles.metaRow}>
														<span className={styles.metaPill}>
															{formatDateRange(
																item.booking.startDate,
																item.booking.endDate
															)}
														</span>
														<span className={styles.metaPill}>
															{formatPrice(item.booking.price)}
														</span>
													</div>

													<div className={styles.cardFooter}>
														<span className={styles.cardState}>{dayStateLabel}</span>
														<span className={styles.cardAction}>{t('common.open')}</span>
													</div>
												</Link>
											)
										})}
									</div>
								)}
							</section>

							<section className={styles.sectionCard}>
								<div className={styles.sectionHeader}>
									<h2 className={styles.sectionTitle}>{t('calendar.freeSection')}</h2>
									<span className={styles.sectionCount}>{freeEntries.length}</span>
								</div>

								{freeEntries.length === 0 ? (
									<div className={styles.emptySection}>
										<h3 className={styles.emptySectionTitle}>
											{t('calendar.freeEmptyTitle')}
										</h3>
										<p className={styles.emptySectionDescription}>
											{t('calendar.freeEmptyDescription')}
										</p>
									</div>
								) : (
									<div className={styles.cardList}>
										{freeEntries.map((item) => (
											<Link
												key={item.assetId}
												className={clsx(styles.statusCard, styles.statusCardFree)}
												to={buildBookingsLink({
													[ROUTE_QUERY_KEYS.ASSET_ID]: item.assetId,
													endDate: selectedDay,
													startDate: selectedDay
												})}
											>
												<div className={styles.cardHeader}>
													<div className={styles.cardCopy}>
														<span className={styles.cardEyebrow}>
															{t('common.free')}
														</span>
														<h3 className={styles.cardTitle}>{item.assetName}</h3>
													</div>
													<span className={styles.cardActionMuted}>
														{t('calendar.newRental')}
													</span>
												</div>

												<p className={styles.freeHint}>{t('calendar.freeBikeHint')}</p>
											</Link>
										))}
									</div>
								)}
							</section>
						</div>
					</>
				) : null}
			</div>
		</Layout>
	)
}

export default CalendarPage
