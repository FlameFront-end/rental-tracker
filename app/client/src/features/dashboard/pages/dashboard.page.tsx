import { useState } from 'react'

import { useNavigate } from 'react-router-dom'

import { useConfirm } from '@/app/confirm/use-confirm'
import { useI18n } from '@/app/i18n/use-i18n'
import type { Booking } from '@/shared/api/services/bookings'
import type { DashboardBookingItem } from '@/shared/api/services/dashboard'
import { useDashboardSummaryQuery } from '@/shared/api/services/dashboard'
import {
	useDeleteBookingMutation,
	useUpdateBookingStatusMutation
} from '@/shared/api/services/bookings'
import { useNotificationsStatusQuery } from '@/shared/api/services/notifications'
import { Button } from '@/shared/kit'
import {
	getApiErrorMessage
} from '@/shared/lib'
import { ROUTES } from '@/shared/model'
import { Layout } from '@/shared/widgets'

import BookingCard from '@/features/bookings/components/BookingCard'

import styles from './dashboard.module.scss'

const DashboardPage = () => {
	const navigate = useNavigate()
	const confirm = useConfirm()
	const { t } = useI18n()
	const { data: notificationsStatus, isLoading: isNotificationsLoading } =
		useNotificationsStatusQuery()
	const {
		data: summary,
		error: summaryError,
		isLoading: isSummaryLoading
	} = useDashboardSummaryQuery()
	const deleteBooking = useDeleteBookingMutation()
	const updateBookingStatus = useUpdateBookingStatusMutation()
	const [listError, setListError] = useState<string | null>(null)

	const handleEdit = (booking: Booking) => {
		navigate(`${ROUTES.BOOKINGS}?bookingId=${booking.id}`)
	}

	const handleDelete = async (booking: Booking) => {
		const confirmed = await confirm({
			title: t('bookings.confirmDeleteTitle'),
			description: t('bookings.confirmDeleteDescription', {
				name: booking.clientName
			}),
			confirmText: t('common.delete'),
			cancelText: t('common.keep'),
			tone: 'danger'
		})

		if (!confirmed) {
			return
		}

		setListError(null)

		try {
			await deleteBooking.mutateAsync(booking.id)
		} catch (deleteError) {
			setListError(
				getApiErrorMessage(
					deleteError,
					t('dashboard.errorDelete')
				)
			)
		}
	}

	const handleToggleStatus = async (booking: Booking) => {
		setListError(null)

		try {
			await updateBookingStatus.mutateAsync({
				bookingId: booking.id,
				status: booking.status === 'paid' ? 'pending' : 'paid'
			})
		} catch (statusError) {
			setListError(
				getApiErrorMessage(
					statusError,
					t('dashboard.errorStatus')
				)
			)
		}
	}

	const renderSection = (
		title: string,
		items: DashboardBookingItem[],
		emptyTitle: string,
		emptyDescription: string
	) => (
		<section className={styles.sectionCard}>
			<div className={styles.sectionHeader}>
				<h2 className={styles.sectionTitle}>{title}</h2>
				<span className={styles.sectionCount}>{items.length}</span>
			</div>

			{items.length === 0 ? (
				<div className={styles.emptySection}>
					<h3>{emptyTitle}</h3>
					<p>{emptyDescription}</p>
				</div>
			) : (
				<div className={styles.sectionBody}>
					{items.map((booking) => (
						<BookingCard
							key={booking.id}
							booking={booking}
							bikeName={booking.assetName}
							className={styles.dashboardBookingCard}
							compact
							isDeleting={deleteBooking.isPending && deleteBooking.variables === booking.id}
							isUpdatingStatus={
								updateBookingStatus.isPending &&
								updateBookingStatus.variables?.bookingId === booking.id
							}
							onDelete={handleDelete}
							onEdit={handleEdit}
							onToggleStatus={handleToggleStatus}
						/>
					))}
				</div>
			)}
		</section>
	)

	const reminderLabel = isNotificationsLoading
		? t('dashboard.checkingReminders')
		: notificationsStatus?.botConfigured && notificationsStatus?.schedulerEnabled
			? t('dashboard.remindersActive')
			: t('dashboard.remindersNeedSetup')

	return (
		<Layout
			title={t('dashboard.title')}
			subtitle={t('dashboard.subtitle')}
		>
			<div className={styles.page}>
				<section className={styles.summaryBar}>
					<div className={styles.summaryCopy}>
						<p className={styles.statusLine}>{reminderLabel}</p>
					</div>

					<div className={styles.actions}>
						<Button type='button' onClick={() => navigate(ROUTES.BOOKINGS)}>
							{t('dashboard.newRental')}
						</Button>
						<Button type='button' variant='secondary' onClick={() => navigate(ROUTES.CALENDAR)}>
							{t('dashboard.weekView')}
						</Button>
					</div>
				</section>

				{listError ? <p className={styles.error}>{listError}</p> : null}
				{summaryError ? (
					<p className={styles.error}>
						{getApiErrorMessage(
							summaryError,
							t('dashboard.errorLoad')
						)}
					</p>
				) : null}

				<section className={styles.metricsGrid}>
					<article className={styles.metricCard}>
						<span>{t('dashboard.metricActive')}</span>
						<strong>{isSummaryLoading ? '...' : summary?.metrics.activeTodayCount ?? 0}</strong>
					</article>
					<article className={styles.metricCard}>
						<span>{t('dashboard.metricDueToday')}</span>
						<strong>{isSummaryLoading ? '...' : summary?.metrics.endingTodayCount ?? 0}</strong>
					</article>
					<article className={styles.metricCard}>
						<span>{t('dashboard.metricUnpaid')}</span>
						<strong>{isSummaryLoading ? '...' : summary?.metrics.pendingCount ?? 0}</strong>
					</article>
				</section>

				{isSummaryLoading ? <div className={styles.loading}>{t('dashboard.loading')}</div> : null}

				{summary ? (
					<div className={styles.sectionsGrid}>
						{renderSection(
							t('dashboard.sectionDueToday'),
							summary.endingToday,
							t('dashboard.emptyDueTodayTitle'),
							t('dashboard.emptyDueTodayDescription')
						)}
						{renderSection(
							t('dashboard.sectionDueTomorrow'),
							summary.endingTomorrow,
							t('dashboard.emptyDueTomorrowTitle'),
							t('dashboard.emptyDueTomorrowDescription')
						)}
						{renderSection(
							t('dashboard.sectionPendingPayment'),
							summary.pending,
							t('dashboard.emptyPendingTitle'),
							t('dashboard.emptyPendingDescription')
						)}
					</div>
				) : null}
			</div>
		</Layout>
	)
}

export default DashboardPage
