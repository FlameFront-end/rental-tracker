import { useCallback, useMemo, useState } from 'react'

import { useConfirm } from '@/app/confirm/use-confirm'
import { useI18n } from '@/app/i18n/use-i18n'
import { useTelegramHaptics } from '@/app/telegram/use-telegram-haptics'
import { useTelegramFormGuard } from '@/app/telegram/use-telegram-form-guard'
import type { Asset, AssetFormValues } from '@/shared/api/services/assets'
import {
	useAssetsQuery,
	useCreateAssetMutation,
	useDeleteAssetMutation,
	useUpdateAssetMutation
} from '@/shared/api/services/assets'
import { Button } from '@/shared/kit'
import { getApiErrorMessage } from '@/shared/lib'
import { Layout, ScreenSheet } from '@/shared/widgets'

import AssetCard from '@/features/assets/components/AssetCard'
import AssetFormCard from '@/features/assets/components/AssetFormCard'
import AssetsEmptyState from '@/features/assets/components/AssetsEmptyState'

import styles from './assets.module.scss'

const AssetsPage = () => {
	const confirm = useConfirm()
	const { t } = useI18n()
	const { error: hapticError, success } = useTelegramHaptics()
	const [isComposerOpen, setIsComposerOpen] = useState(false)
	const [formResetVersion, setFormResetVersion] = useState(0)
	const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
	const [isComposerDirty, setIsComposerDirty] = useState(false)
	const [formError, setFormError] = useState<string | null>(null)
	const [listError, setListError] = useState<string | null>(null)
	const {
		data: assets = [],
		error,
		isLoading
	} = useAssetsQuery()
	const createAsset = useCreateAssetMutation()
	const updateAsset = useUpdateAssetMutation()
	const deleteAsset = useDeleteAssetMutation()
	const selectedAsset = useMemo(
		() => assets.find((asset) => asset.id === selectedAssetId),
		[assets, selectedAssetId]
	)
	const isComposerVisible = isComposerOpen || Boolean(selectedAsset)

	const handleStartCreate = useCallback(() => {
		setSelectedAssetId(null)
		setIsComposerDirty(false)
		setFormError(null)
		setListError(null)
		setIsComposerOpen(true)
		setFormResetVersion((current) => current + 1)
	}, [])

	const handleEdit = (asset: Asset) => {
		setSelectedAssetId(asset.id)
		setIsComposerDirty(false)
		setFormError(null)
		setListError(null)
		setIsComposerOpen(true)
	}

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

		setSelectedAssetId(null)
		setIsComposerDirty(false)
		setFormError(null)
		setIsComposerOpen(false)
		setFormResetVersion((current) => current + 1)
	}, [confirm, isComposerDirty, t])

	useTelegramFormGuard({
		active: isComposerVisible,
		isDirty: isComposerDirty
	})

	const handleSubmit = async (values: AssetFormValues) => {
		setFormError(null)

		try {
			if (selectedAsset) {
				await updateAsset.mutateAsync({
					assetId: selectedAsset.id,
					payload: values
				})
			} else {
				await createAsset.mutateAsync(values)
			}

			setSelectedAssetId(null)
			setIsComposerDirty(false)
			setIsComposerOpen(false)
			setFormResetVersion((current) => current + 1)
			success()
		} catch (submitError) {
			hapticError()
			setFormError(
				getApiErrorMessage(submitError, t('assets.errorSave'))
			)
		}
	}

	const handleDelete = async (asset: Asset) => {
		const confirmed = await confirm({
			title: t('assets.confirmDeleteTitle'),
			description: t('assets.confirmDeleteDescription', {
				name: asset.name
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
			await deleteAsset.mutateAsync(asset.id)

			if (selectedAssetId === asset.id) {
				setSelectedAssetId(null)
				setIsComposerOpen(false)
				setFormResetVersion((current) => current + 1)
			}
			success()
		} catch (deleteError) {
			hapticError()
			setListError(
				getApiErrorMessage(
					deleteError,
					t('assets.errorDelete')
				)
			)
		}
	}

	return (
		<Layout
			title={t('assets.title')}
			subtitle={t('assets.subtitle')}
		>
			<div className={styles.page}>
				<section className={styles.summaryBar}>
					<div className={styles.metric}>
						<span>{t('assets.totalBikes')}</span>
						<strong>{assets.length}</strong>
					</div>
					<Button type='button' onClick={handleStartCreate}>
						{t('assets.newBike')}
					</Button>
				</section>

				<section className={styles.listPanel}>
					<div className={styles.listHeader}>
						<div>
							<h2 className={styles.sectionTitle}>{t('assets.fleetList')}</h2>
							<p className={styles.sectionDescription}>
								{assets.length === 0
									? t('assets.noBikesYet')
									: t('assets.bikesAvailable', { count: assets.length })}
							</p>
						</div>
					</div>

					{listError ? <p className={styles.error}>{listError}</p> : null}
					{error ? (
						<p className={styles.error}>
							{getApiErrorMessage(error, t('assets.errorLoad'))}
						</p>
					) : null}
					{isLoading ? <div className={styles.loading}>{t('assets.loading')}</div> : null}
					{!isLoading && assets.length === 0 ? (
						<AssetsEmptyState onCreate={handleStartCreate} />
					) : null}
					<div className={styles.assetList}>
						{assets.map((asset) => (
							<AssetCard
								key={asset.id}
								asset={asset}
								isEditing={selectedAssetId === asset.id}
								isDeleting={deleteAsset.isPending && deleteAsset.variables === asset.id}
								onEdit={handleEdit}
								onDelete={handleDelete}
							/>
						))}
					</div>
				</section>

				<ScreenSheet open={isComposerVisible} onClose={handleCloseComposer}>
					<AssetFormCard
						asset={selectedAsset}
						error={formError}
						isSubmitting={createAsset.isPending || updateAsset.isPending}
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

export default AssetsPage
