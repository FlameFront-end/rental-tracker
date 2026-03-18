import { Skeleton } from '@/shared/kit'

import styles from './AssetCardSkeleton.module.scss'

const AssetCardSkeleton = () => {
	return (
		<article className={styles.card} aria-hidden='true'>
			<div className={styles.header}>
				<div className={styles.copy}>
					<Skeleton className={styles.title} />
					<Skeleton className={styles.metaLine} />
					<Skeleton className={styles.metaLineShort} />
				</div>
				<Skeleton className={styles.status} />
			</div>

			<div className={styles.actions}>
				<Skeleton className={styles.iconAction} />
				<Skeleton className={styles.iconAction} />
			</div>
		</article>
	)
}

export default AssetCardSkeleton
