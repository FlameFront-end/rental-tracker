import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { useI18n } from '@/app/i18n/use-i18n'
import type { Asset, AssetFormValues } from '@/shared/api/services/assets'
import { Button, TextField } from '@/shared/kit'

import styles from './AssetFormCard.module.scss'

interface AssetFormCardProps {
	asset?: Asset
	error?: string | null
	isSubmitting?: boolean
	onCancelEdit: () => void
	onSubmit: (values: AssetFormValues) => Promise<void> | void
	resetVersion: number
}

const createDefaultValues = (asset?: Asset): AssetFormValues => ({
	name: asset?.name ?? ''
})

const AssetFormCard = ({
	asset,
	error,
	isSubmitting = false,
	onCancelEdit,
	onSubmit,
	resetVersion
}: AssetFormCardProps) => {
	const { t } = useI18n()
	const isEditMode = Boolean(asset)
	const assetSchema = z.object({
		name: z
			.string()
			.trim()
			.min(1, t('assetForm.nameRequired'))
			.max(120, t('assetForm.nameMax'))
	})
	const {
		formState: { errors },
		handleSubmit,
		register,
		reset
	} = useForm<AssetFormValues>({
		defaultValues: createDefaultValues(asset),
		resolver: zodResolver(assetSchema)
	})

	useEffect(() => {
		reset(createDefaultValues(asset))
	}, [asset, reset, resetVersion])

	return (
		<aside className={styles.card}>
			<header className={styles.header}>
				<span className={styles.eyebrow}>
					{isEditMode ? t('assetForm.editEyebrow') : t('assetForm.newEyebrow')}
				</span>
				<h2 className={styles.title}>
					{isEditMode ? t('assetForm.updateTitle') : t('assetForm.addTitle')}
				</h2>
				<p className={styles.description}>{t('assetForm.description')}</p>
			</header>

			<form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
				<TextField
					id='asset-name'
					label={t('assetForm.nameLabel')}
					placeholder={t('assetForm.namePlaceholder')}
					error={errors.name?.message}
					{...register('name')}
				/>
				{error ? <p className={styles.error}>{error}</p> : null}

				<div className={styles.actions}>
					<Button type='submit' disabled={isSubmitting}>
						{isSubmitting
							? isEditMode
								? t('common.saving')
								: t('common.creating')
							: isEditMode
								? t('common.save')
								: t('common.createBike')}
					</Button>
					{isEditMode ? (
						<Button
							type='button'
							variant='secondary'
							onClick={() => {
								reset(createDefaultValues())
								onCancelEdit()
							}}
						>
							{t('common.close')}
						</Button>
					) : null}
				</div>
			</form>
		</aside>
	)
}

export default AssetFormCard
