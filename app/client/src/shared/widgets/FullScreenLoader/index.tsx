import { useI18n } from '@/app/i18n/use-i18n'

import styles from './FullScreenLoader.module.scss'

export const FullScreenLoader = () => {
	const { t } = useI18n()

	return (
		<div className={styles.wrapper}>
			<div className={styles.card}>
				<span className={styles.kicker}>{t('header.appName')}</span>
				<strong className={styles.title}>{t('loader.title')}</strong>
				<p className={styles.message}>{t('loader.message')}</p>
			</div>
		</div>
	)
}
