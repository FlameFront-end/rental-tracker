import { SquarePen, Trash2 } from 'lucide-react'

import { useI18n } from '@/app/i18n/use-i18n'
import type { Asset } from '@/shared/api/services/assets'
import { formatDateLabel } from '@/shared/lib'

import styles from './AssetCard.module.scss'

interface AssetCardProps {
	asset: Asset
	isDeleting?: boolean
	isEditing?: boolean
	onDelete: (asset: Asset) => void
	onEdit: (asset: Asset) => void
}

const AssetCard = ({
	asset,
	isDeleting = false,
	isEditing = false,
	onDelete,
	onEdit
}: AssetCardProps) => {
	const { t } = useI18n()

	return (
		<article className={styles.card}>
			<div className={styles.header}>
				<div>
					<h3 className={styles.title}>{asset.name}</h3>
					<p className={styles.meta}>
						{t('assetCard.updated', {
							date: formatDateLabel(asset.updatedAt.slice(0, 10))
						})}
					</p>
				</div>
				<span className={styles.status}>{t('assetCard.available')}</span>
			</div>

			<div className={styles.actions}>
				<button
					type='button'
					className={`${styles.iconAction} ${isEditing ? styles.iconActionActive : ''}`}
					aria-label={isEditing ? t('assetCard.editing') : t('assetCard.edit')}
					title={isEditing ? t('assetCard.editing') : t('assetCard.edit')}
					onClick={() => onEdit(asset)}
				>
					<SquarePen size={16} strokeWidth={1.9} aria-hidden='true' />
				</button>
				<button
					type='button'
					className={`${styles.iconAction} ${styles.deleteAction}`}
					disabled={isDeleting}
					aria-label={isDeleting ? t('assetCard.deleting') : t('assetCard.delete')}
					title={isDeleting ? t('assetCard.deleting') : t('assetCard.delete')}
					onClick={() => onDelete(asset)}
				>
					<Trash2 size={17} strokeWidth={1.9} aria-hidden='true' />
				</button>
			</div>
		</article>
	)
}

export default AssetCard
