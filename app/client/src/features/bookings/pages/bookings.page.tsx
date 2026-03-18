import { useEffect, useMemo, useRef, useState } from 'react'

import { useNavigate, useSearchParams } from 'react-router-dom'

import { useConfirm } from '@/app/confirm/use-confirm'
import { useI18n } from '@/app/i18n/use-i18n'
import type {
	Booking,
	BookingFilters,
	BookingFormValues,
	BookingStatus
} from '@/shared/api/services/bookings'
import {
	useBookingsQuery,
	useCreateBookingMutation,
	useDeleteBookingMutation,
	useUpdateBookingMutation,
	useUpdateBookingStatusMutation
} from '@/shared/api/services/bookings'
import { useAssetsQuery } from '@/shared/api/services/assets'
import { Button, SelectField } from '@/shared/kit'
import { getApiErrorMessage } from '@/shared/lib'
import { ROUTES } from '@/shared/model'
import { Layout, ScreenSheet } from '@/shared/widgets'

import BookingCard from '@/features/bookings/components/BookingCard'
import BookingFormCard from '@/features/bookings/components/BookingFormCard'
import BookingsEmptyState from '@/features/bookings/components/BookingsEmptyState'

import styles from './bookings.module.scss'

const ALL_FILTER_VALUE = 'all'
const BOOKING_PREFILL_KEYS = ['bookingId', 'assetId', 'startDate', 'endDate'] as const
const FILTER_ASSET_QUERY_KEY = 'filterAssetId'
const FOCUS_BOOKING_QUERY_KEY = 'focusBookingId'

const BookingsPage = () => {
	const navigate = useNavigate()
	const confirm = useConfirm()
	const { t } = useI18n()
	const [searchParams, setSearchParams] = useSearchParams()
	const assetFilterParam = searchParams.get(FILTER_ASSET_QUERY_KEY)
	const focusBookingId = searchParams.get(FOCUS_BOOKING_QUERY_KEY)
	const selectedAssetFilter = assetFilterParam ?? ALL_FILTER_VALUE
	const [isComposerOpen, setIsComposerOpen] = useState(false)
	const [formResetVersion, setFormResetVersion] = useState(0)
	const [selectedStatusFilter, setSelectedStatusFilter] = useState<
		BookingStatus | typeof ALL_FILTER_VALUE
	>(ALL_FILTER_VALUE)
	const [formError, setFormError] = useState<string | null>(null)
	const [listError, setListError] = useState<string | null>(null)

	const {
		data: assets = [],
		error: assetsError,
		isLoading: isAssetsLoading
	} = useAssetsQuery()

	const assetOptions = useMemo(
		() =>
			assets.map((asset) => ({
				label: asset.name,
				value: asset.id
			})),
		[assets]
	)
	const assetNameMap = useMemo(
		() => Object.fromEntries(assets.map((asset) => [asset.id, asset.name])),
		[assets]
	)
	const assetFilterOptions = useMemo(
		() => [
			{
				label: t('bookings.allBikes'),
				value: ALL_FILTER_VALUE
			},
			...assetOptions
		],
		[assetOptions, t]
	)
	const statusFilterOptions = useMemo(
		() => [
			{
				label: t('bookings.allStatuses'),
				value: ALL_FILTER_VALUE
			},
			{
				label: t('booking.status.pending'),
				value: 'pending'
			},
			{
				label: t('booking.status.paid'),
				value: 'paid'
			}
		],
		[t]
	)
	const bookingIdParam = searchParams.get('bookingId')
	const selectedBookingId = bookingIdParam
	const hasDraftPrefill = BOOKING_PREFILL_KEYS.some((key) => Boolean(searchParams.get(key)))
	const bookingDraft = useMemo<Partial<BookingFormValues>>(
		() => ({
			...(searchParams.get('assetId') ? { assetId: searchParams.get('assetId') ?? '' } : {}),
			...(searchParams.get('startDate')
				? { startDate: searchParams.get('startDate') ?? '' }
				: {}),
			...(searchParams.get('endDate') ? { endDate: searchParams.get('endDate') ?? '' } : {})
		}),
		[searchParams]
	)
	const bookingFilters = useMemo<BookingFilters>(
		() => ({
			...(selectedAssetFilter !== ALL_FILTER_VALUE ? { assetId: selectedAssetFilter } : {}),
			...(selectedStatusFilter !== ALL_FILTER_VALUE
				? { status: selectedStatusFilter }
				: {})
		}),
		[selectedAssetFilter, selectedStatusFilter]
	)
	const hasFilters =
		selectedAssetFilter !== ALL_FILTER_VALUE || selectedStatusFilter !== ALL_FILTER_VALUE
	const {
		data: bookings = [],
		error: bookingsError,
		isLoading: isBookingsLoading
	} = useBookingsQuery(bookingFilters)
	const createBooking = useCreateBookingMutation()
	const updateBooking = useUpdateBookingMutation()
	const deleteBooking = useDeleteBookingMutation()
	const updateBookingStatus = useUpdateBookingStatusMutation()
	const bookingItemRefs = useRef<Record<string, HTMLDivElement | null>>({})
	const lastFocusedBookingRef = useRef<string | null>(null)
	const selectedBooking = useMemo(
		() => bookings.find((booking) => booking.id === selectedBookingId),
		[bookings, selectedBookingId]
	)
	const isComposerVisible =
		assets.length > 0 && (isComposerOpen || Boolean(selectedBookingId) || hasDraftPrefill)
	const pendingCount = bookings.filter((booking) => booking.status === 'pending').length

	useEffect(() => {
		if (!focusBookingId || isBookingsLoading || bookings.length === 0) {
			return
		}

		if (lastFocusedBookingRef.current === focusBookingId) {
			return
		}

		const focusedBookingExists = bookings.some((booking) => booking.id === focusBookingId)

		if (!focusedBookingExists) {
			return
		}

		const element = bookingItemRefs.current[focusBookingId]

		if (!element) {
			return
		}

		lastFocusedBookingRef.current = focusBookingId
		element.scrollIntoView({
			behavior: 'smooth',
			block: 'center'
		})
	}, [bookings, focusBookingId, isBookingsLoading])

	const clearBookingSearchParams = () => {
		const nextSearchParams = new URLSearchParams(searchParams)

		for (const key of BOOKING_PREFILL_KEYS) {
			nextSearchParams.delete(key)
		}

		setSearchParams(nextSearchParams, {
			replace: true
		})
	}

	const updateAssetFilter = (nextValue: string) => {
		const nextSearchParams = new URLSearchParams(searchParams)

		if (nextValue === ALL_FILTER_VALUE) {
			nextSearchParams.delete(FILTER_ASSET_QUERY_KEY)
		} else {
			nextSearchParams.set(FILTER_ASSET_QUERY_KEY, nextValue)
		}

		setSearchParams(nextSearchParams, {
			replace: true
		})
	}

	const handleStartCreate = () => {
		setFormError(null)
		setListError(null)
		setIsComposerOpen(true)
		setFormResetVersion((current) => current + 1)
		clearBookingSearchParams()
	}

	const handleCloseComposer = () => {
		setFormError(null)
		setListError(null)
		setIsComposerOpen(false)
		setFormResetVersion((current) => current + 1)
		clearBookingSearchParams()
	}

	const handleClearFilters = () => {
		updateAssetFilter(ALL_FILTER_VALUE)
		setSelectedStatusFilter(ALL_FILTER_VALUE)
		setListError(null)
	}

	const handleOpenBikes = () => {
		navigate(ROUTES.ASSETS)
	}

	const handleEdit = (booking: Booking) => {
		setFormError(null)
		setListError(null)
		setIsComposerOpen(true)
		const nextSearchParams = new URLSearchParams(searchParams)

		nextSearchParams.set('bookingId', booking.id)
		nextSearchParams.delete(FOCUS_BOOKING_QUERY_KEY)
		nextSearchParams.delete('assetId')
		nextSearchParams.delete('startDate')
		nextSearchParams.delete('endDate')

		setSearchParams(nextSearchParams, {
			replace: true
		})
	}

	const handleSubmit = async (values: BookingFormValues) => {
		setFormError(null)

		try {
			if (selectedBooking) {
				await updateBooking.mutateAsync({
					bookingId: selectedBooking.id,
					payload: values
				})
			} else {
				await createBooking.mutateAsync(values)
			}

			setFormResetVersion((current) => current + 1)
			setIsComposerOpen(false)
			clearBookingSearchParams()
		} catch (submitError) {
			setFormError(getApiErrorMessage(submitError, t('bookings.errorSave')))
		}
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

			if (selectedBookingId === booking.id) {
				setFormResetVersion((current) => current + 1)
				setIsComposerOpen(false)
				clearBookingSearchParams()
			}
		} catch (deleteError) {
			setListError(getApiErrorMessage(deleteError, t('bookings.errorDelete')))
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
			setListError(getApiErrorMessage(statusError, t('bookings.errorStatus')))
		}
	}

	return (
		<Layout title={t('bookings.title')} subtitle={t('bookings.subtitle')}>
			<div className={styles.page}>
				{assetsError ? (
					<p className={styles.error}>
						{getApiErrorMessage(assetsError, t('bookings.errorLoadBikes'))}
					</p>
				) : null}

				{!isAssetsLoading && assets.length === 0 ? (
					<BookingsEmptyState
						hasBikes={false}
						hasFilters={false}
						onCreate={handleStartCreate}
						onOpenBikes={handleOpenBikes}
					/>
				) : null}

				{assets.length > 0 ? (
					<>
						<section className={styles.summaryBar}>
							<div className={styles.metricList}>
								<div className={styles.metric}>
									<span>{t('bookings.metricRentals')}</span>
									<strong>{bookings.length}</strong>
								</div>
								<div className={styles.metric}>
									<span>{t('bookings.metricPending')}</span>
									<strong>{pendingCount}</strong>
								</div>
							</div>

							<Button type='button' onClick={handleStartCreate}>
								{t('bookings.newRental')}
							</Button>
						</section>

						<section className={styles.filtersCard}>
							<div className={styles.filterGrid}>
								<SelectField
									id='bookings-filter-bike'
									label={t('bookings.filterBike')}
									options={assetFilterOptions}
									value={selectedAssetFilter}
									onChange={(event) => updateAssetFilter(event.target.value)}
								/>
								<SelectField
									id='bookings-filter-status'
									label={t('bookings.filterStatus')}
									options={statusFilterOptions}
									value={selectedStatusFilter}
									onChange={(event) =>
										setSelectedStatusFilter(
											event.target.value as BookingStatus | typeof ALL_FILTER_VALUE
										)
									}
								/>
							</div>
						</section>

						<section className={styles.listPanel}>
							<div className={styles.listHeader}>
								<div>
									<h2 className={styles.sectionTitle}>{t('bookings.sectionTitle')}</h2>
									<p className={styles.sectionDescription}>
										{hasFilters
											? t('bookings.filteredResults')
											: t('bookings.allCurrentRentals')}
									</p>
								</div>
								{hasFilters ? (
									<Button type='button' variant='ghost' onClick={handleClearFilters}>
										{t('bookings.clearFilters')}
									</Button>
								) : null}
							</div>

							{listError ? <p className={styles.error}>{listError}</p> : null}
							{bookingsError ? (
								<p className={styles.error}>
									{getApiErrorMessage(bookingsError, t('bookings.errorLoad'))}
								</p>
							) : null}
							{isBookingsLoading ? (
								<div className={styles.loading}>{t('bookings.loading')}</div>
							) : null}
							{!isBookingsLoading && bookings.length === 0 ? (
								<BookingsEmptyState
									hasBikes
									hasFilters={hasFilters}
									onClearFilters={handleClearFilters}
									onCreate={handleStartCreate}
									onOpenBikes={handleOpenBikes}
								/>
							) : null}
							<div className={styles.bookingList}>
								{bookings.map((booking) => (
									<div
										key={booking.id}
										ref={(element) => {
											bookingItemRefs.current[booking.id] = element
										}}
										className={
											booking.id === focusBookingId ? styles.focusedBookingItem : undefined
										}
									>
										<BookingCard
											booking={booking}
											bikeName={assetNameMap[booking.assetId] ?? t('bookings.unknownBike')}
											isDeleting={
												deleteBooking.isPending && deleteBooking.variables === booking.id
											}
											isEditing={selectedBookingId === booking.id}
											isUpdatingStatus={
												updateBookingStatus.isPending &&
												updateBookingStatus.variables?.bookingId === booking.id
											}
											onDelete={handleDelete}
											onEdit={handleEdit}
											onToggleStatus={handleToggleStatus}
										/>
									</div>
								))}
							</div>
						</section>
					</>
				) : null}

				<ScreenSheet open={isComposerVisible} onClose={handleCloseComposer}>
					<BookingFormCard
						assetOptions={assetOptions}
						booking={selectedBooking}
						draftValues={selectedBooking ? undefined : bookingDraft}
						error={formError}
						isSubmitting={createBooking.isPending || updateBooking.isPending}
						onCancelEdit={handleCloseComposer}
						onSubmit={handleSubmit}
						resetVersion={formResetVersion}
					/>
				</ScreenSheet>
			</div>
		</Layout>
	)
}

export default BookingsPage
