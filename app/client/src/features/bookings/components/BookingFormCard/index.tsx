import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { useI18n } from '@/app/i18n/use-i18n'
import { useAuthSession } from '@/app/session/use-auth-session'
import type { Booking, BookingFormValues } from '@/shared/api/services/bookings'
import { Button, DateField, SelectField, TextField } from '@/shared/kit'
import { addDaysToDateOnly, getTodayDateOnly } from '@/shared/lib'

import styles from './BookingFormCard.module.scss'

interface BookingFormCardProps {
	assetOptions: Array<{
		label: string
		value: string
	}>
	booking?: Booking
	draftValues?: Partial<BookingFormValues>
	error?: string | null
	isSubmitting?: boolean
	onDraftChange?: (draft: Partial<BookingFormValues>, isDirty: boolean) => void
	onDirtyChange?: (isDirty: boolean) => void
	onCancelEdit: () => void
	onSubmit: (values: BookingFormValues) => Promise<void> | void
	resetVersion: number
}

const createDefaultValues = (
	booking: Booking | undefined,
	defaultAssetId: string,
	draftValues?: Partial<BookingFormValues>
): BookingFormValues => ({
	assetId: booking?.assetId ?? draftValues?.assetId ?? defaultAssetId,
	clientName: booking?.clientName ?? draftValues?.clientName ?? '',
	startDate: booking?.startDate ?? draftValues?.startDate ?? getTodayDateOnly(),
	endDate:
		booking?.endDate ??
		draftValues?.endDate ??
		addDaysToDateOnly(draftValues?.startDate ?? getTodayDateOnly(), 1),
	price: booking?.price ?? draftValues?.price ?? 0,
	status: booking?.status ?? draftValues?.status ?? 'pending'
})

const BookingFormCard = ({
	assetOptions,
	booking,
	draftValues,
	error,
	isSubmitting = false,
	onDraftChange,
	onDirtyChange,
	onCancelEdit,
	onSubmit,
	resetVersion
}: BookingFormCardProps) => {
	const { t } = useI18n()
	const { isTelegramEnvironment } = useAuthSession()
	const isEditMode = Boolean(booking)
	const defaultAssetId = assetOptions[0]?.value ?? ''
	const bookingSchema = z
		.object({
			assetId: z.string().uuid(t('booking.form.chooseBike')),
			clientName: z
				.string()
				.trim()
				.min(1, t('booking.form.clientNameRequired'))
				.max(120, t('booking.form.clientNameMax')),
			startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, t('booking.form.startDateRequired')),
			endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, t('booking.form.endDateRequired')),
			price: z.number().min(0, t('booking.form.priceInvalid')),
			status: z.enum(['pending', 'paid'])
		})
		.refine((values) => values.startDate <= values.endDate, {
			message: t('booking.form.endDateAfter'),
			path: ['endDate']
		})
	const bookingStatusOptions: Array<{ label: string; value: string }> = [
		{
			label: t('booking.status.pending'),
			value: 'pending'
		},
		{
			label: t('booking.status.paid'),
			value: 'paid'
		}
	]
	const {
		control,
		formState: { errors, isDirty },
		handleSubmit,
		register,
		reset,
		watch
	} = useForm<BookingFormValues>({
		defaultValues: createDefaultValues(booking, defaultAssetId, draftValues),
		resolver: zodResolver(bookingSchema)
	})
	const watchedValues = watch()

	const handleCancel = () => {
		reset(createDefaultValues(undefined, defaultAssetId, draftValues))
		onCancelEdit()
	}

	useEffect(() => {
		reset(createDefaultValues(booking, defaultAssetId, draftValues))
	}, [booking, defaultAssetId, draftValues, reset, resetVersion])

	useEffect(() => {
		onDirtyChange?.(isDirty)
	}, [isDirty, onDirtyChange])

	useEffect(() => {
		onDraftChange?.(watchedValues, isDirty)
	}, [isDirty, onDraftChange, watchedValues])

	return (
		<aside className={styles.card}>
			<header className={styles.header}>
				<span className={styles.eyebrow}>
					{isEditMode ? t('booking.form.editEyebrow') : t('booking.form.newEyebrow')}
				</span>
				<h2 className={styles.title}>
					{isEditMode ? t('booking.form.updateTitle') : t('booking.form.createTitle')}
				</h2>
			</header>

			<form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
				<SelectField
					id='booking-asset'
					label={t('bookings.filterBike')}
					error={errors.assetId?.message}
					options={assetOptions}
					{...register('assetId')}
				/>
				<TextField
					id='booking-client-name'
					label={t('booking.form.clientNameLabel')}
					placeholder={t('booking.form.clientNamePlaceholder')}
					error={errors.clientName?.message}
					{...register('clientName')}
				/>

				<div className={styles.row}>
					<Controller
						name='startDate'
						control={control}
						render={({ field }) => (
							<DateField
								id='booking-start-date'
								label={t('booking.form.startDateLabel')}
								error={errors.startDate?.message}
								max={watchedValues.endDate}
								required
								value={field.value}
								onBlur={field.onBlur}
								onChange={field.onChange}
							/>
						)}
					/>
					<Controller
						name='endDate'
						control={control}
						render={({ field }) => (
							<DateField
								id='booking-end-date'
								label={t('booking.form.endDateLabel')}
								error={errors.endDate?.message}
								min={watchedValues.startDate}
								required
								value={field.value}
								onBlur={field.onBlur}
								onChange={field.onChange}
							/>
						)}
					/>
				</div>

				<div className={styles.row}>
					<TextField
						id='booking-price'
						type='number'
						min='0'
						step='0.01'
						label={t('booking.form.priceLabel')}
						placeholder='150'
						error={errors.price?.message}
						{...register('price', {
							valueAsNumber: true
						})}
					/>
					<SelectField
						id='booking-status'
						label={t('booking.form.statusLabel')}
						error={errors.status?.message}
						options={bookingStatusOptions}
						{...register('status')}
					/>
				</div>

				{error ? <p className={styles.error}>{error}</p> : null}

				<div className={styles.actions}>
					<Button type='submit' disabled={isSubmitting}>
						{isSubmitting
							? isEditMode
								? t('common.saving')
								: t('common.creating')
							: isEditMode
								? t('common.save')
								: t('common.createRental')}
					</Button>
					{isEditMode && !isTelegramEnvironment ? (
						<Button type='button' variant='secondary' onClick={handleCancel}>
							{t('common.close')}
						</Button>
					) : null}
				</div>
			</form>
		</aside>
	)
}

export default BookingFormCard
