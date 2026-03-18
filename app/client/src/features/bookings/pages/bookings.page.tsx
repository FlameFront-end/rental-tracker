import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useNavigate, useSearchParams } from 'react-router-dom'

import { useConfirm } from '@/app/confirm/use-confirm'
import { useI18n } from '@/app/i18n/use-i18n'
import {
	getStoredBookingDraft,
	getStoredBookingsAssetFilter,
	persistBookingDraft,
	persistBookingsAssetFilter
} from '@/app/telegram/app-storage'
import { useTelegramBackButton } from '@/app/telegram/telegram-back-button'
import { useTelegramHaptics } from '@/app/telegram/use-telegram-haptics'
import type {
	Booking,
	BookingFilters,
	BookingFormValues,
	BookingStatus
} from '@/shared/api/services/bookings'
import {
	useBookingQuery,
	useBookingsQuery,
	useBookingsTotalQuery,
	useCreateBookingMutation,
	useDeleteBookingMutation,
	useUpdateBookingMutation,
	useUpdateBookingStatusMutation
} from '@/shared/api/services/bookings'
import { useAssetsCatalogQuery } from '@/shared/api/services/assets'
import { Button, SelectField, Skeleton } from '@/shared/kit'
import { getApiErrorMessage } from '@/shared/lib'
import { ROUTES, ROUTE_QUERY_KEYS } from '@/shared/model'
import { Layout, ScreenSheet } from '@/shared/widgets'

import BookingCard from '@/features/bookings/components/BookingCard'
import BookingCardSkeleton from '@/features/bookings/components/BookingCardSkeleton'
import BookingFormCard from '@/features/bookings/components/BookingFormCard'
import BookingsEmptyState from '@/features/bookings/components/BookingsEmptyState'

import styles from './bookings.module.scss'

const ALL_FILTER_VALUE = 'all'
const BOOKING_PREFILL_KEYS = [
	ROUTE_QUERY_KEYS.BOOKING_ID,
	ROUTE_QUERY_KEYS.ASSET_ID,
	'startDate',
	'endDate'
] as const
const BOOKING_STATUS_VALUES: BookingStatus[] = ['pending', 'paid']
const BOOKING_SKELETON_COUNT = 3

const BookingsPage = () => {
	const navigate = useNavigate()
	const confirm = useConfirm()
	const { t } = useI18n()
	const {
		error: hapticError,
		selectionChanged,
		success
	} = useTelegramHaptics()
	const [searchParams, setSearchParams] = useSearchParams()
	const assetFilterParam = searchParams.get(ROUTE_QUERY_KEYS.FILTER_ASSET_ID)
	const statusFilterParam = searchParams.get(ROUTE_QUERY_KEYS.BOOKING_STATUS)
	const focusBookingId = searchParams.get(ROUTE_QUERY_KEYS.FOCUS_BOOKING_ID)
	const selectedAssetFilter = assetFilterParam ?? ALL_FILTER_VALUE
	const selectedStatusFilter = BOOKING_STATUS_VALUES.includes(statusFilterParam as BookingStatus)
		? (statusFilterParam as BookingStatus)
		: ALL_FILTER_VALUE
	const [isComposerOpen, setIsComposerOpen] = useState(false)
	const [formResetVersion, setFormResetVersion] = useState(0)
	const [isComposerDirty, setIsComposerDirty] = useState(false)
	const [formError, setFormError] = useState<string | null>(null)
	const [listError, setListError] = useState<string | null>(null)
	const [storedAssetFilterSeed, setStoredAssetFilterSeed] = useState(() =>
		getStoredBookingsAssetFilter()
	)
	const [storedBookingDraftSeed, setStoredBookingDraftSeed] = useState<
		Partial<BookingFormValues> | undefined
	>(() => getStoredBookingDraft())
	const draftRestoreRef = useRef<Partial<BookingFormValues> | undefined>(storedBookingDraftSeed)

	const {
		data: assets = [],
		error: assetsError,
		isLoading: isAssetsLoading
	} = useAssetsCatalogQuery()

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
	const bookingIdParam = searchParams.get(ROUTE_QUERY_KEYS.BOOKING_ID)
	const selectedBookingId = bookingIdParam
	const hasDraftPrefill = BOOKING_PREFILL_KEYS.some((key) => Boolean(searchParams.get(key)))
	const bookingDraft = useMemo<Partial<BookingFormValues>>(
		() => ({
			...(searchParams.get(ROUTE_QUERY_KEYS.ASSET_ID)
				? { assetId: searchParams.get(ROUTE_QUERY_KEYS.ASSET_ID) ?? '' }
				: {}),
			...(searchParams.get('startDate')
				? { startDate: searchParams.get('startDate') ?? '' }
				: {}),
			...(searchParams.get('endDate') ? { endDate: searchParams.get('endDate') ?? '' } : {})
		}),
		[searchParams]
	)
	const composerDraftValues = useMemo<Partial<BookingFormValues> | undefined>(
		() => (hasDraftPrefill ? bookingDraft : storedBookingDraftSeed),
		[bookingDraft, hasDraftPrefill, storedBookingDraftSeed]
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
		fetchNextPage,
		hasMore = false,
		isFetchingMore,
		isLoading: isBookingsLoading,
		total
	} = useBookingsQuery(bookingFilters)
	const createBooking = useCreateBookingMutation()
	const updateBooking = useUpdateBookingMutation()
	const deleteBooking = useDeleteBookingMutation()
	const updateBookingStatus = useUpdateBookingStatusMutation()
	const bookingItemRefs = useRef<Record<string, HTMLDivElement | null>>({})
	const lastFocusedBookingRef = useRef<string | null>(null)
	const bookingFromList = useMemo(
		() => bookings.find((booking) => booking.id === selectedBookingId),
		[bookings, selectedBookingId]
	)
	const {
		data: selectedBookingDetail,
		isLoading: isSelectedBookingLoading
	} = useBookingQuery(selectedBookingId, Boolean(selectedBookingId && !bookingFromList))
	const selectedBooking = bookingFromList ?? selectedBookingDetail
	const pendingMetricFilters = useMemo<BookingFilters>(
		() => ({
			...(selectedAssetFilter !== ALL_FILTER_VALUE ? { assetId: selectedAssetFilter } : {}),
			status: 'pending'
		}),
		[selectedAssetFilter]
	)
	const shouldLoadPendingMetric = assets.length > 0 && selectedStatusFilter === ALL_FILTER_VALUE
	const {
		data: pendingBookingsTotal = 0,
		isLoading: isPendingMetricLoading
	} = useBookingsTotalQuery(pendingMetricFilters, shouldLoadPendingMetric)
	const totalBookings = total || bookings.length
	const pendingCount =
		selectedStatusFilter === 'pending'
			? totalBookings
			: selectedStatusFilter === 'paid'
				? 0
				: pendingBookingsTotal
	const isBookingsInitialLoading = isBookingsLoading && bookings.length === 0
	const isComposerVisible =
		assets.length > 0 && (isComposerOpen || Boolean(selectedBooking) || hasDraftPrefill)
	const isPageLoading = isAssetsLoading || isBookingsInitialLoading

	useEffect(() => {
		if (assetFilterParam || isAssetsLoading || !storedAssetFilterSeed) {
			return
		}

		if (!assets.some((asset) => asset.id === storedAssetFilterSeed)) {
			persistBookingsAssetFilter(undefined)
			setStoredAssetFilterSeed(undefined)
			return
		}

		const nextSearchParams = new URLSearchParams(searchParams)

		nextSearchParams.set(ROUTE_QUERY_KEYS.FILTER_ASSET_ID, storedAssetFilterSeed)

		setSearchParams(nextSearchParams, {
			replace: true
		})
	}, [
		assetFilterParam,
		assets,
		isAssetsLoading,
		searchParams,
		setSearchParams,
		storedAssetFilterSeed
	])

	useEffect(() => {
		if (!focusBookingId || isBookingsInitialLoading) {
			return
		}

		if (lastFocusedBookingRef.current === focusBookingId) {
			return
		}

		const element = bookingItemRefs.current[focusBookingId]

		if (element) {
			lastFocusedBookingRef.current = focusBookingId
			element.scrollIntoView({
				behavior: 'smooth',
				block: 'center'
			})
			return
		}

		if (bookings.some((booking) => booking.id === focusBookingId) || isFetchingMore) {
			return
		}

		if (hasMore) {
			void fetchNextPage()
		}
	}, [bookings, fetchNextPage, focusBookingId, hasMore, isBookingsInitialLoading, isFetchingMore])

	useEffect(() => {
		if (!selectedBookingId || isBookingsInitialLoading || isSelectedBookingLoading || selectedBooking) {
			return
		}

		const nextSearchParams = new URLSearchParams(searchParams)

		nextSearchParams.delete(ROUTE_QUERY_KEYS.BOOKING_ID)

		setSearchParams(nextSearchParams, {
			replace: true
		})
	}, [
		isBookingsInitialLoading,
		isSelectedBookingLoading,
		searchParams,
		selectedBooking,
		selectedBookingId,
		setSearchParams
	])

	useEffect(() => {
		if (!hasDraftPrefill || !isComposerVisible || selectedBooking) {
			return
		}

		draftRestoreRef.current = storedBookingDraftSeed
	}, [hasDraftPrefill, isComposerVisible, selectedBooking, storedBookingDraftSeed])

	const clearBookingSearchParams = useCallback(() => {
		const nextSearchParams = new URLSearchParams(searchParams)

		for (const key of BOOKING_PREFILL_KEYS) {
			nextSearchParams.delete(key)
		}

		setSearchParams(nextSearchParams, {
			replace: true
		})
	}, [searchParams, setSearchParams])

	const updateAssetFilter = useCallback((nextValue: string) => {
		const nextSearchParams = new URLSearchParams(searchParams)

		if (nextValue === ALL_FILTER_VALUE) {
			nextSearchParams.delete(ROUTE_QUERY_KEYS.FILTER_ASSET_ID)
		} else {
			nextSearchParams.set(ROUTE_QUERY_KEYS.FILTER_ASSET_ID, nextValue)
		}

		const nextAssetFilter = nextValue === ALL_FILTER_VALUE ? undefined : nextValue

		setStoredAssetFilterSeed(nextAssetFilter)
		persistBookingsAssetFilter(nextAssetFilter)

		setSearchParams(nextSearchParams, {
			replace: true
		})
	}, [searchParams, setSearchParams])

	const updateStatusFilter = useCallback((nextValue: BookingStatus | typeof ALL_FILTER_VALUE) => {
		const nextSearchParams = new URLSearchParams(searchParams)

		if (nextValue === ALL_FILTER_VALUE) {
			nextSearchParams.delete(ROUTE_QUERY_KEYS.BOOKING_STATUS)
		} else {
			nextSearchParams.set(ROUTE_QUERY_KEYS.BOOKING_STATUS, nextValue)
		}

		setSearchParams(nextSearchParams, {
			replace: true
		})
	}, [searchParams, setSearchParams])

	const handleStartCreate = useCallback(() => {
		const nextStoredDraft = getStoredBookingDraft()

		draftRestoreRef.current = nextStoredDraft
		setStoredBookingDraftSeed(nextStoredDraft)
		setIsComposerDirty(false)
		setFormError(null)
		setListError(null)
		setIsComposerOpen(true)
		setFormResetVersion((current) => current + 1)
		clearBookingSearchParams()
	}, [clearBookingSearchParams])

	const handleCloseComposer = useCallback(async () => {
		if (isComposerDirty) {
			const confirmed = await confirm({
				title: t('common.unsavedChangesTitle'),
				description: t('common.unsavedChangesDescription'),
				confirmText: t('common.discard'),
				cancelText: t('common.keep'),
				tone: 'danger'
			})

			if (!confirmed) {
				return
			}
		}

		if (!selectedBooking && isComposerDirty) {
			const restoredDraft = persistBookingDraft(draftRestoreRef.current)

			setStoredBookingDraftSeed(restoredDraft)
		}

		setIsComposerDirty(false)
		setFormError(null)
		setListError(null)
		setIsComposerOpen(false)
		setFormResetVersion((current) => current + 1)
		clearBookingSearchParams()
	}, [clearBookingSearchParams, confirm, isComposerDirty, selectedBooking, t])

	const handleClearFilters = useCallback(() => {
		const nextSearchParams = new URLSearchParams(searchParams)

		nextSearchParams.delete(ROUTE_QUERY_KEYS.FILTER_ASSET_ID)
		nextSearchParams.delete(ROUTE_QUERY_KEYS.BOOKING_STATUS)

		setStoredAssetFilterSeed(undefined)
		persistBookingsAssetFilter(undefined)
		setSearchParams(nextSearchParams, {
			replace: true
		})
		setListError(null)
	}, [searchParams, setSearchParams])

	const handleOpenBikes = useCallback(() => {
		navigate(ROUTES.ASSETS)
	}, [navigate])
	const handleBackToDashboard = useCallback(() => {
		navigate(ROUTES.DASHBOARD)
	}, [navigate])

	const handleLoadMore = useCallback(() => {
		if (!hasMore || isFetchingMore) {
			return
		}

		void fetchNextPage()
	}, [fetchNextPage, hasMore, isFetchingMore])

	useTelegramBackButton(!isComposerVisible, handleBackToDashboard)

	const handleEdit = (booking: Booking) => {
		setIsComposerDirty(false)
		setFormError(null)
		setListError(null)
		setIsComposerOpen(true)
		const nextSearchParams = new URLSearchParams(searchParams)

		nextSearchParams.set(ROUTE_QUERY_KEYS.BOOKING_ID, booking.id)
		nextSearchParams.delete(ROUTE_QUERY_KEYS.FOCUS_BOOKING_ID)
		nextSearchParams.delete(ROUTE_QUERY_KEYS.ASSET_ID)
		nextSearchParams.delete('startDate')
		nextSearchParams.delete('endDate')

		setSearchParams(nextSearchParams, {
			replace: true
		})
	}

	const handleDraftChange = useCallback(
		(draft: Partial<BookingFormValues>, isDirty: boolean) => {
			if (selectedBooking) {
				return
			}

			if (!isDirty) {
				persistBookingDraft(draftRestoreRef.current)
				return
			}

			persistBookingDraft(draft)
		},
		[selectedBooking]
	)

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
				persistBookingDraft(undefined)
				setStoredBookingDraftSeed(undefined)
				draftRestoreRef.current = undefined
			}

			setFormResetVersion((current) => current + 1)
			setIsComposerDirty(false)
			setIsComposerOpen(false)
			clearBookingSearchParams()
			success()
		} catch (submitError) {
			hapticError()
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
			success()
		} catch (deleteError) {
			hapticError()
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
			success()
		} catch (statusError) {
			hapticError()
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

				{!assetsError && !isAssetsLoading && assets.length === 0 ? (
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
									<strong>
										{isPageLoading ? (
											<Skeleton className={styles.metricValueSkeleton} />
										) : (
											totalBookings
										)}
									</strong>
								</div>
								<div className={styles.metric}>
									<span>{t('bookings.metricPending')}</span>
									<strong>
										{isPageLoading || isPendingMetricLoading ? (
											<Skeleton className={styles.metricValueSkeleton} />
										) : (
											pendingCount
										)}
									</strong>
								</div>
							</div>

							<Button type='button' onClick={handleStartCreate} disabled={isAssetsLoading}>
								{t('bookings.newRental')}
							</Button>
						</section>

						{isAssetsLoading || assets.length > 0 ? (
							<section className={styles.filtersCard}>
								<div className={styles.filterGrid}>
									{isAssetsLoading ? (
										<>
											<div className={styles.filterSkeleton}>
												<Skeleton className={styles.filterSkeletonLabel} />
												<Skeleton className={styles.filterSkeletonField} />
											</div>
											<div className={styles.filterSkeleton}>
												<Skeleton className={styles.filterSkeletonLabel} />
												<Skeleton className={styles.filterSkeletonField} />
											</div>
										</>
									) : (
										<>
											<SelectField
												id='bookings-filter-bike'
												label={t('bookings.filterBike')}
												options={assetFilterOptions}
												value={selectedAssetFilter}
												onChange={(event) => {
													if (event.target.value !== selectedAssetFilter) {
														selectionChanged()
													}
													updateAssetFilter(event.target.value)
												}}
											/>
											<SelectField
												id='bookings-filter-status'
												label={t('bookings.filterStatus')}
												options={statusFilterOptions}
												value={selectedStatusFilter}
												onChange={(event) => {
													if (event.target.value !== selectedStatusFilter) {
														selectionChanged()
													}
													updateStatusFilter(
														event.target.value as BookingStatus | typeof ALL_FILTER_VALUE
													)
												}}
											/>
										</>
									)}
								</div>
							</section>
						) : null}

						<section className={styles.listPanel}>
							<div className={styles.listHeader}>
								<div>
									<h2 className={styles.sectionTitle}>{t('bookings.sectionTitle')}</h2>
									{isPageLoading ? (
										<div className={styles.sectionDescriptionSkeletons}>
											<Skeleton className={styles.sectionDescriptionSkeleton} />
											<Skeleton className={styles.sectionDescriptionSkeletonShort} />
										</div>
									) : (
										<p className={styles.sectionDescription}>
											{hasFilters
												? t('bookings.filteredResults')
												: t('bookings.allCurrentRentals')}
										</p>
									)}
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
							{!bookingsError && !isBookingsInitialLoading && totalBookings === 0 ? (
								<BookingsEmptyState
									hasBikes
									hasFilters={hasFilters}
									onClearFilters={handleClearFilters}
									onCreate={handleStartCreate}
									onOpenBikes={handleOpenBikes}
								/>
							) : null}
							<div className={styles.bookingList}>
								{isPageLoading
									? Array.from({ length: BOOKING_SKELETON_COUNT }).map((_, index) => (
											<BookingCardSkeleton key={index} />
										))
									: bookings.map((booking) => (
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
							{!isBookingsInitialLoading && hasMore ? (
								<div className={styles.paginationActions}>
									<Button
										type='button'
										variant='secondary'
										className={styles.loadMoreButton}
										disabled={isFetchingMore}
										onClick={handleLoadMore}
									>
										{isFetchingMore ? t('common.loadingMore') : t('bookings.loadMore')}
									</Button>
								</div>
							) : null}
						</section>
					</>
				) : null}

				<ScreenSheet open={isComposerVisible} onClose={handleCloseComposer}>
					<BookingFormCard
						assetOptions={assetOptions}
						booking={selectedBooking}
						draftValues={selectedBooking ? undefined : composerDraftValues}
						error={formError}
						isSubmitting={createBooking.isPending || updateBooking.isPending}
						onDraftChange={handleDraftChange}
						onDirtyChange={setIsComposerDirty}
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
