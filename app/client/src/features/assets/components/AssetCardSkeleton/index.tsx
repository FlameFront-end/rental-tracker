import { Skeleton } from '@/shared/kit'

import styles from './AssetCardSkeleton.module.scss'

const AssetCardSkeleton = () => {
	return (
		<article className={styles.card} aria-hidden='true'>
			<div className={styles.header}>
				<Skeleton className={styles.title} />
				<Skeleton className={styles.status} />
			</div>

			<div className={styles.footer}>
				<Skeleton className={styles.metaLine} />
				<div className={styles.actions}>
					<Skeleton className={styles.iconAction} />
					<Skeleton className={styles.iconAction} />
				</div>
			</div>
		</article>
	)
}

export default AssetCardSkeleton
