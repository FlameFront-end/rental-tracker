import { useCallback, useEffect, useMemo, useState } from 'react'

import { useNavigate, useSearchParams } from 'react-router-dom'

import { useConfirm } from '@/app/confirm/use-confirm'
import { useI18n } from '@/app/i18n/use-i18n'
import { useTelegramBackButton } from '@/app/telegram/telegram-back-button'
import { useTelegramHaptics } from '@/app/telegram/use-telegram-haptics'
import type { Asset, AssetFormValues } from '@/shared/api/services/assets'
import {
	useAssetQuery,
	useAssetsQuery,
	useCreateAssetMutation,
	useDeleteAssetMutation,
	useUpdateAssetMutation
} from '@/shared/api/services/assets'
import { Button, Skeleton } from '@/shared/kit'
import { getApiErrorMessage } from '@/shared/lib'
import { ROUTES, ROUTE_QUERY_KEYS } from '@/shared/model'
import { Layout, ScreenSheet } from '@/shared/widgets'

import AssetCard from '@/features/assets/components/AssetCard'
import AssetCardSkeleton from '@/features/assets/components/AssetCardSkeleton'
import AssetFormCard from '@/features/assets/components/AssetFormCard'
import AssetsEmptyState from '@/features/assets/components/AssetsEmptyState'

import styles from './assets.module.scss'

const ASSET_SKELETON_COUNT = 3

const AssetsPage = () => {
	const navigate = useNavigate()
	const confirm = useConfirm()
	const { t } = useI18n()
	const { error: hapticError, success } = useTelegramHaptics()
	const [searchParams, setSearchParams] = useSearchParams()
	const [isComposerOpen, setIsComposerOpen] = useState(false)
	const [formResetVersion, setFormResetVersion] = useState(0)
	const [isComposerDirty, setIsComposerDirty] = useState(false)
	const [formError, setFormError] = useState<string | null>(null)
	const [listError, setListError] = useState<string | null>(null)
	const {
		data: assets = [],
		error,
		fetchNextPage,
		hasMore = false,
		isFetchingMore,
		isLoading,
		total
	} = useAssetsQuery()
	const createAsset = useCreateAssetMutation()
	const updateAsset = useUpdateAssetMutation()
	const deleteAsset = useDeleteAssetMutation()
	const selectedAssetId = searchParams.get(ROUTE_QUERY_KEYS.ASSET_ID)
	const assetFromList = useMemo(
		() => assets.find((asset) => asset.id === selectedAssetId),
		[assets, selectedAssetId]
	)
	const {
		data: selectedAssetDetail,
		isLoading: isSelectedAssetLoading
	} = useAssetQuery(selectedAssetId, Boolean(selectedAssetId && !assetFromList))
	const selectedAsset = assetFromList ?? selectedAssetDetail
	const totalAssets = total || assets.length
	const isListLoading = isLoading && assets.length === 0
	const isComposerVisible = isComposerOpen || Boolean(selectedAsset)

	const updateSelectedAsset = useCallback((nextAssetId?: string | null) => {
		const nextSearchParams = new URLSearchParams(searchParams)

		if (nextAssetId) {
			nextSearchParams.set(ROUTE_QUERY_KEYS.ASSET_ID, nextAssetId)
		} else {
			nextSearchParams.delete(ROUTE_QUERY_KEYS.ASSET_ID)
		}

		setSearchParams(nextSearchParams, {
			replace: true
		})
	}, [searchParams, setSearchParams])

	useEffect(() => {
		if (!selectedAssetId || isListLoading || isSelectedAssetLoading || selectedAsset) {
			return
		}

		updateSelectedAsset(null)
	}, [isListLoading, isSelectedAssetLoading, selectedAsset, selectedAssetId, updateSelectedAsset])

	const handleLoadMore = useCallback(() => {
		if (!hasMore || isFetchingMore) {
			return
		}

		void fetchNextPage()
	}, [fetchNextPage, hasMore, isFetchingMore])

	const handleStartCreate = useCallback(() => {
		updateSelectedAsset(null)
		setIsComposerDirty(false)
		setFormError(null)
		setListError(null)
		setIsComposerOpen(true)
		setFormResetVersion((current) => current + 1)
	}, [updateSelectedAsset])

	const handleEdit = (asset: Asset) => {
		updateSelectedAsset(asset.id)
		setIsComposerDirty(false)
		setFormError(null)
		setListError(null)
		setIsComposerOpen(false)
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

		updateSelectedAsset(null)
		setIsComposerDirty(false)
		setFormError(null)
		setIsComposerOpen(false)
		setFormResetVersion((current) => current + 1)
	}, [confirm, isComposerDirty, t, updateSelectedAsset])

	useTelegramBackButton(!isComposerVisible, () => {
		navigate(ROUTES.DASHBOARD)
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

			updateSelectedAsset(null)
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
				updateSelectedAsset(null)
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
						<strong>
							{isListLoading ? (
								<Skeleton className={styles.metricValueSkeleton} />
							) : (
								totalAssets
							)}
						</strong>
					</div>
					<Button type='button' onClick={handleStartCreate}>
						{t('assets.newBike')}
					</Button>
				</section>

				<section className={styles.listPanel}>
					<div className={styles.listHeader}>
						<div>
							<h2 className={styles.sectionTitle}>{t('assets.fleetList')}</h2>
							{isListLoading ? (
								<div className={styles.sectionDescriptionSkeletons}>
									<Skeleton className={styles.sectionDescriptionSkeleton} />
									<Skeleton className={styles.sectionDescriptionSkeletonShort} />
								</div>
							) : (
								<p className={styles.sectionDescription}>
									{totalAssets === 0
										? t('assets.noBikesYet')
										: t('assets.bikesAvailable', { count: totalAssets })}
								</p>
							)}
						</div>
					</div>

					{listError ? <p className={styles.error}>{listError}</p> : null}
					{error ? (
						<p className={styles.error}>
							{getApiErrorMessage(error, t('assets.errorLoad'))}
						</p>
					) : null}
					{!error && !isListLoading && totalAssets === 0 ? (
						<AssetsEmptyState onCreate={handleStartCreate} />
					) : null}
					<div className={styles.assetList}>
						{isListLoading
							? Array.from({ length: ASSET_SKELETON_COUNT }).map((_, index) => (
									<AssetCardSkeleton key={index} />
								))
							: assets.map((asset) => (
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
					{!isListLoading && hasMore ? (
						<div className={styles.paginationActions}>
							<Button
								type='button'
								variant='secondary'
								className={styles.loadMoreButton}
								disabled={isFetchingMore}
								onClick={handleLoadMore}
							>
								{isFetchingMore ? t('common.loadingMore') : t('assets.loadMore')}
							</Button>
						</div>
					) : null}
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
